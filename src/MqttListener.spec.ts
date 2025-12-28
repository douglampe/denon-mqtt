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

describe('MqttListener', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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
        zones: [],
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
  });
});
