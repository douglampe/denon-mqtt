import { connectAsync } from 'mqtt';
import { Telnet } from 'telnet-client';

import { MqttListener } from './MqttListener';
import { ReceiverManager } from './ReceiverManager';
import { MqttManager } from './MqttManager';

jest.mock('mqtt', () => {
  return {
    connectAsync: jest.fn(),
  };
});

jest.mock('telnet-client', () => {
  return {
    Telnet: jest.fn(),
  };
});

const receiverConfig = {
  name: 'Home Theater',
  id: 'avr_id',
  ip: '192.168.1.1234',
  sources: [],
  zones: [
    {
      index: '1',
      name: 'Main Zone',
      sources: ['DVD', 'CD'],
    },
    {
      index: '2',
      name: 'Zone 2',
      sources: ['DVD', 'CD'],
    },
    {
      index: '3',
      name: 'Zone 3',
      sources: ['DVD', 'CD'],
    },
  ],
};

describe('MqttListener', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listenToZone()', () => {
    it('should subscribe to topic prefix/avr_id/main_zone/command', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/device/command', Buffer.from('{"power":"ON"}'));
        },
        subscribeAsync: jest.fn(),
      });
      const client = await connectAsync('mqtt://foo:123');
      const listener = new MqttListener({
        prefix: 'prefix',
        id: 'avr_id',
        client,
        receiver: {} as any,
      });

      const mockSubscribeAsync = jest.spyOn(client, 'subscribeAsync');

      listener.listenToZone(1);

      expect(mockSubscribeAsync).toHaveBeenCalledWith('prefix/avr_id/main_zone/command');
    });
  });

  describe('listen()', () => {
    it('should call listentToZone for each zone', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/device/command', Buffer.from('{"power":"ON"}'));
        },
        subscribeAsync: jest.fn(),
      });
      const mockSend = jest.fn();
      (Telnet as any as jest.Mock).mockReturnValue({
        connect: jest.fn(),
        send: mockSend,
      });
      const client = await connectAsync('mqtt://foo:123');
      const mqttManager = new MqttManager(client, {
        host: 'localhost',
        port: 1883,
        username: 'user',
        password: 'password',
        prefix: 'denon',
        id: 'denon',
        receiver: receiverConfig,
      });
      const receiver = new ReceiverManager(receiverConfig, mqttManager);
      const listener = new MqttListener({
        prefix: 'denon',
        id: 'denon',
        client,
        receiver,
      });
      const mockListenToZone = jest.spyOn(listener, 'listenToZone');

      await receiver.connect();

      await listener.listen();
      expect(mockListenToZone).toHaveBeenCalledTimes(3);
      expect(mockListenToZone).toHaveBeenCalledWith(1);
      expect(mockListenToZone).toHaveBeenCalledWith(2);
      expect(mockListenToZone).toHaveBeenCalledWith(3);
    });

    it('should call receiver.query() when REFRESH received on prefix/id/device/command', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/avr_id/device/command', Buffer.from('REFRESH'));
        },
        subscribeAsync: jest.fn(),
      });
      const mockSend = jest.fn();
      (Telnet as any as jest.Mock).mockReturnValue({
        connect: jest.fn(),
        send: mockSend,
      });
      const client = await connectAsync('mqtt://foo:123');
      const mqttManager = new MqttManager(client, {
        host: 'localhost',
        port: 1883,
        username: 'user',
        password: 'password',
        prefix: 'denon',
        id: 'denon',
        receiver: receiverConfig,
      });
      const receiver = new ReceiverManager(receiverConfig, mqttManager);
      const listener = new MqttListener({
        prefix: 'denon',
        id: 'avr_id',
        client,
        receiver,
      });
      const mockQuery = jest.spyOn(receiver, 'query');

      await receiver.connect();
      await listener.listen();
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should call receiver.queryZone() when { "refresh": { "text": "ON" } } received on prefix/id/main_zone/command', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/avr_id/main_zone/command', Buffer.from('{ "refresh": { "text": "ON" } }'));
        },
        subscribeAsync: jest.fn(),
      });
      const mockSend = jest.fn();
      (Telnet as any as jest.Mock).mockReturnValue({
        connect: jest.fn(),
        send: mockSend,
      });
      const client = await connectAsync('mqtt://foo:123');
      const mqttManager = new MqttManager(client, {
        host: 'localhost',
        port: 1883,
        username: 'user',
        password: 'password',
        prefix: 'denon',
        id: 'denon',
        receiver: receiverConfig,
      });
      const receiver = new ReceiverManager(receiverConfig, mqttManager);
      const listener = new MqttListener({
        prefix: 'denon',
        id: 'avr_id',
        client,
        receiver,
      });
      const mockQuery = jest.spyOn(receiver, 'queryZone');

      await receiver.connect();
      await listener.listen();
      expect(mockQuery).toHaveBeenCalledWith(1);
    });

    it('should call handleMessage()', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/avr_id/main_zone/command', Buffer.from('{ "power": { "text": "ON" } }'));
        },
        subscribeAsync: jest.fn(),
      });
      const mockSend = jest.fn();
      (Telnet as any as jest.Mock).mockReturnValue({
        connect: jest.fn(),
        send: mockSend,
      });
      const client = await connectAsync('mqtt://foo:123');

      const mqttManager = new MqttManager(client, {
        host: 'localhost',
        port: 1883,
        username: 'user',
        password: 'password',
        prefix: 'denon',
        id: 'denon',
        receiver: receiverConfig,
      });
      const receiver = new ReceiverManager(receiverConfig, mqttManager);
      const listener = new MqttListener({
        prefix: 'denon',
        id: 'avr_id',
        client,
        receiver,
      });
      const mockHandleMessage = jest.spyOn(listener, 'handleMessage');

      await receiver.connect();
      await listener.listen();
      expect(mockHandleMessage).toHaveBeenCalledWith(1, '{ "power": { "text": "ON" } }');
    });

    it('should not call handleMessage if topic does not match ()', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/different_avr_id/main_zone/command', Buffer.from('{ "power": { "text": "ON" } }'));
        },
        subscribeAsync: jest.fn(),
      });
      const mockSend = jest.fn();
      (Telnet as any as jest.Mock).mockReturnValue({
        connect: jest.fn(),
        send: mockSend,
      });
      const client = await connectAsync('mqtt://foo:123');

      const mqttManager = new MqttManager(client, {
        host: 'localhost',
        port: 1883,
        username: 'user',
        password: 'password',
        prefix: 'denon',
        id: 'denon',
        receiver: receiverConfig,
      });
      const receiver = new ReceiverManager(receiverConfig, mqttManager);
      const listener = new MqttListener({
        prefix: 'denon',
        id: 'avr_id',
        client,
        receiver,
      });
      const mockHandleMessage = jest.spyOn(listener, 'handleMessage');

      await receiver.connect();
      await listener.listen();
      expect(mockHandleMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleMessage()', () => {
    it.each([
      { zone: 1, body: JSON.stringify({ power: { text: 'ON' } }), command: 'ZMON' },
      { zone: 1, body: JSON.stringify({ volume: { numeric: 55 } }), command: 'MV55' },
      { zone: 1, body: JSON.stringify({ channel_volume: { key: 'C', value: '55' } }), command: 'CVC 55' },
      { zone: 2, body: JSON.stringify({ power: { text: 'ON' } }), command: 'Z2ON' },
    ])('should send $command for payload $body on zone $zone', async (testData) => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/avr_id/main_zone/command', Buffer.from('{ "power": { "text": "ON" } }'));
        },
      });
      const client = await connectAsync('mqtt://foo:123');
      const mqttManager = new MqttManager(client, {
        host: 'localhost',
        port: 1883,
        username: 'user',
        password: 'password',
        prefix: 'denon',
        id: 'denon',
        receiver: receiverConfig,
      });
      const receiver = new ReceiverManager(receiverConfig, mqttManager);
      const listener = new MqttListener({
        prefix: 'denon',
        id: 'denon',
        client,
        receiver,
      });

      const mockSend = jest.spyOn(receiver, 'send');
      mockSend.mockImplementationOnce(async () => {});

      await listener.handleMessage(testData.zone, testData.body);

      expect(mockSend).toHaveBeenCalledWith(testData.command);
    });
  });
});
