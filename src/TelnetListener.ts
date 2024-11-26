import { CommandMessage, MainParser, ReceiverSettings, ZoneParser } from 'denon-state-manager';
import { Telnet } from 'telnet-client';

import { MqttUpdate } from './MqttUpdate';

export interface ICommandHandler {
  handle: (data: string | null) => Promise<boolean>;
}

export class TelnetListener {
  private client: Telnet;
  private parsers: Array<MainParser | ZoneParser> = [];

  constructor(client: Telnet) {
    this.client = client;
  }

  public handle(data: string): MqttUpdate | undefined {
    for (let zone = 1; zone <= this.parsers.length; zone++) {
      const result = this.parsers[zone - 1].parse(data);
      if (result.handled && result.value) {
        return {
          key: result.key ?? ReceiverSettings.None,
          value: result.value,
          zone,
        };
      }
    }
  }

  async read(cb: (result: MqttUpdate) => Promise<void>): Promise<void> {
    try {
      const data = await this.client.nextData();
      const lines = data?.split('\r') ?? [];

      for await (const line of lines) {
        if (line !== '') {
          console.debug('Received:', line);
          const result = this.handle(line);
          if (result) {
            await cb(result);
          } else {
            console.debug('Unhandled:', line);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}
