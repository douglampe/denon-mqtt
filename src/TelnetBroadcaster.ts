import { MessageFormatter } from 'denon-state-manager';
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

  async query(zone: number): Promise<void> {
    let commands = MessageFormatter.getZoneStatusRequestCommands(zone);

    await this.send(commands.join('\r'));
  }
}
