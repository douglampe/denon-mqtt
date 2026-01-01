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

  async query(zones: number): Promise<void> {
    let commands = MessageFormatter.statusRequestCommands;

    if (zones === 1) {
      commands = commands.filter((c) => !c.startsWith('Z'));
    } else if (zones === 2) {
      commands = commands.filter((c) => !c.startsWith('Z3'));
    }

    await this.send(commands.join('\r'));
  }
}
