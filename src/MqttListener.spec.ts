import { connectAsync } from 'mqtt';
import { Telnet } from 'telnet-client';

import { MqttListener } from './MqttListener';
import { ReceiverManager } from './ReceiverManager';
import { MqttManager } from './MqttManager';
import { ReceiverSettings } from 'denon-state-manager';

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

describe('MqttListener', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getTopic()', () => {
    it('should return topic', async () => {
      const listener = new MqttListener({
        prefix: 'prefix',
        id: 'avr_id',
        client: {} as any,
        receiver: {} as any,
      });
      const topic = listener.getTopic('switch', 'power', 1);

      expect(topic).toEqual('prefix/switch/avr_id_main_zone_power/command');
    });
  });

  describe('listenToZone()', () => {
    it('should call listenToTopic', async () => {
      const listener = new MqttListener({
        prefix: 'prefix',
        id: 'avr_id',
        client: {} as any,
        receiver: {} as any,
      });

      const mockListenToTopic = jest.spyOn(listener, 'listenToTopic');
      mockListenToTopic.mockImplementationOnce(async () => {});

      listener.listenToZone('switch', ReceiverSettings.Power, 1);

      expect(mockListenToTopic).toHaveBeenCalledWith('prefix/switch/avr_id_main_zone_power/command');
    });
  });

  describe('listenToTopic()', () => {
    it('should call subscribeAsync()', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/device/command', Buffer.from('REFRESH'));
        },
        subscribeAsync: jest.fn(),
      });
      const client = await connectAsync('mqtt://foo:123');
      const listener = new MqttListener({
        prefix: 'denon',
        id: 'denon',
        client,
        receiver: {} as any,
      });
      const mockSubscribe = jest.spyOn(client, 'subscribeAsync');

      await listener.listenToTopic('prefix/switch/avr_id_main_zone_power/command');
      expect(mockSubscribe).toHaveBeenCalledWith('prefix/switch/avr_id_main_zone_power/command');
    });
  });

  describe('listen()', () => {
    it('should call receiver.query() when REFRESH received on /device/command', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/device/command', Buffer.from('REFRESH'));
        },
        subscribeAsync: jest.fn(),
      });
      const mockSend = jest.fn();
      (Telnet as any as jest.Mock).mockReturnValue({
        connect: jest.fn(),
        send: mockSend,
      });
      const client = await connectAsync('mqtt://foo:123');
      const receiverConfig = {
        name: 'Home Theater',
        id: 'denon',
        ip: '192.168.1.1234',
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
      const mockQuery = jest.spyOn(receiver, 'query');

      await receiver.connect();
      await listener.listen();
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should call handleMessage()', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        on: (event: string, cb: (topic: string, message: Buffer) => void) => {
          cb('denon/switch/denon_main_zone_power/command', Buffer.from('{ "raw": "ON", "text": "ON" }'));
        },
        subscribeAsync: jest.fn(),
      });
      const mockSend = jest.fn();
      (Telnet as any as jest.Mock).mockReturnValue({
        connect: jest.fn(),
        send: mockSend,
      });
      const client = await connectAsync('mqtt://foo:123');
      const receiverConfig = {
        name: 'Home Theater',
        id: 'denon',
        ip: '192.168.1.1234',
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
      const mockHandleMessage = jest.spyOn(listener, 'handleMessage');

      await receiver.connect();
      await listener.listen();
      expect(mockHandleMessage).toHaveBeenCalledWith(ReceiverSettings.Power, '{ "raw": "ON", "text": "ON" }', 1);
    });
  });
});
