import { Telnet } from 'telnet-client';
import { TelnetListener } from './TelnetListener';
import { ReceiverSettings } from 'denon-state-manager';

jest.mock('telnet-client', () => {
  return {
    Telnet: function () {
      return {
        nextData: jest.fn(),
      };
    },
  };
});

describe('TelnetListener', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('addZone()', () => {
    it('should add 2 parsers (one for each zone)', () => {
      const client = new Telnet();
      const listener = new TelnetListener(client, 2);

      expect((listener as any).parsers.length).toEqual(2);
    });
  });

  describe('handle()', () => {
    it.each([
      {
        data: 'ZMON',
        result: { key: ReceiverSettings.Power, value: { raw: 'ON', text: 'ON' }, zone: 1 },
      },
      {
        data: 'SLPOFF',
        result: { key: ReceiverSettings.Sleep, value: { raw: 'OFF', text: 'OFF' }, zone: 1 },
      },
    ])('should parse $data', (testData) => {
      const client = new Telnet();
      const listener = new TelnetListener(client, 2);

      const result = listener.handle(testData.data);
    });
  });

  describe('read()', () => {
    it('should publish state', async () => {
      const client = new Telnet();
      const listener = new TelnetListener(client, 2);
      const mqttManager = {
        publish: jest.fn(),
        publishState: jest.fn(),
      } as any;

      const mockNextData = jest.spyOn(client, 'nextData');

      mockNextData.mockResolvedValueOnce('PWON');

      await listener.read(mqttManager);

      expect(mqttManager.publish).toHaveBeenCalled();
    });
  });
});
