import { MessageFormatter } from 'denon-state-manager';
import { Telnet } from 'telnet-client';

export class TelnetBroadcaster {
  constructor(private client: Telnet, private ip: string) {}

  async send(data: string): Promise<void> {
    try {
      await this.client.send(data);
      const lines: string[] = [];
      if (data.indexOf('\r') >= 0 && data.indexOf('\r') < data.length - 1) {
        lines.push(...data.split('\r'));
      } else {
        lines.push(data);
      }
      lines.forEach(line => {
        console.log(`[TELNET:${this.ip}]:->${line}`);
      })
    } catch (err) {
      console.error(err);
    }
  }

  async query(zone: number): Promise<void> {
    let commands = MessageFormatter.getZoneStatusRequestCommands(zone);

    await this.send(commands.join('\r'));
  }
}
