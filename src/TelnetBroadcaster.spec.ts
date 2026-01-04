import { Telnet } from 'telnet-client';
import { TelnetBroadcaster } from './TelnetBroadcaster';

jest.mock('telnet-client', () => {
  return {
    Telnet: function () {
      return {
        send: jest.fn(),
      };
    },
  };
});

describe('TelnetBroadcaster', () => {
  describe('send()', () => {
    it('should call client.send', async () => {
      const client = new Telnet();
      const mockSend = jest.spyOn(client, 'send');
      const broadcaster = new TelnetBroadcaster(client);
      await broadcaster.send('SI?');
      expect(mockSend).toHaveBeenCalledWith('SI?');
    });
  });
  describe('query()', () => {
    it('should call client.send with main zone query commands', async () => {
      const client = new Telnet();
      const mockSend = jest.spyOn(client, 'send');
      const broadcaster = new TelnetBroadcaster(client);
      await broadcaster.query(1);
      expect(mockSend).toHaveBeenCalledWith(
        [
          'SI?',
          'PW?',
          'MV?',
          'CV?',
          'MU?',
          'ZM?',
          'SR?',
          'SD?',
          'DC?',
          'SV?',
          'SLP?',
          'MS?',
          'QUICK ?',
          'STBY?',
          'SSSPC ?',
          'PSCLV ?',
          'PSSWL ?',
          'SSLEV ?',
        ].join('\r'),
      );
    });

    it('should call client.send with zone query commands', async () => {
      const client = new Telnet();
      const mockSend = jest.spyOn(client, 'send');
      const broadcaster = new TelnetBroadcaster(client);
      await broadcaster.query(2);
      expect(mockSend).toHaveBeenCalledWith(['Z2?', 'Z2MU?', 'Z2CS?', 'Z2CV?', 'Z2HPF?', 'Z2QUICK ?'].join('\r'));
    });
  });
});
