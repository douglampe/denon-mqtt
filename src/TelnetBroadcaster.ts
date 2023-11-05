import { Telnet } from 'telnet-client';

export class TelnetBroadcaster {
  constructor(private client: Telnet) {}

  async send(data: string): Promise<void> {
    await this.client.send(data);
    console.debug('Sent:', data);
  }

  async init(): Promise<void> {
    await this.send('SI?');
    await this.send('PW?');
    await this.send('MV?');
    await this.send('CV?');
    await this.send('MU?');
    await this.send('ZM?');
    await this.send('SR?');
    await this.send('SD?');
    await this.send('DC?');
    await this.send('SV?');
    await this.send('SLP?');
    await this.send('MS?');
    await this.send('Z2?');
    await this.send('Z2MU?');
    await this.send('Z2CS?');
    await this.send('Z2CV?');
    await this.send('Z2HPF?');
    await this.send('Z2QUICK ?');
    await this.send('Z3?');
    await this.send('Z3MU?');
    await this.send('Z3CS?');
    await this.send('Z3CV?');
    await this.send('Z3HPF?');
    await this.send('Z3QUICK ?');
    await this.send('SSSPC ?');
    await this.send('PSCLV ?');
    await this.send('PSSWL ?');
    await this.send('SSLEV ?');
  }
}
