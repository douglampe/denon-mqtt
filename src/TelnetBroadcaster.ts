import { Telnet } from 'telnet-client';

export class TelnetBroadcaster {
  constructor(private client: Telnet) {}

  async send(data: string): Promise<void> {
    try {
      await this.client.send(data);
      console.debug('Sent:', data.replace(/\r/g, '\r\n'));
    } catch (err) {
      console.error(err);
    }
  }

  async query(): Promise<void> {
    await this.send(
      'SI?\rPW?\rMV?\rCV?\rMU?\rZM?\rSR?\rSD?\rDC?\rSV?\rSLP?\rMS?\rZ2?\rZ2MU?\rZ2CS?\rZ2CV?\rZ2HPF?\rZ2QUICK ?\rZ3?\rZ3MU?\rZ3CS?\rZ3CV?\rZ3HPF?\rZ3QUICK ?\rSSSPC ?\rPSCLV ?\rPSSWL ?\rSSLEV ?',
    );
  }
}
