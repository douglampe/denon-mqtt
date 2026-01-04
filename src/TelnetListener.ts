import { MainParser, ReceiverSettings, ReceiverState, ZoneParser } from 'denon-state-manager';
import { Telnet } from 'telnet-client';

import { MqttManager } from './MqttManager';
import { MqttUpdate } from './MqttUpdate';

export class TelnetListener {
  private client: Telnet;
  private parsers: Array<MainParser | ZoneParser> = [];
  private states: ReceiverState[] = [];
  private ip: string;

  constructor(client: Telnet, zones: number, ip: string) {
    this.client = client;
    this.ip = ip;

    for (let i = 0; i < zones; i++) {
      this.addZone();
    }
  }

  public addZone() {
    const state = new ReceiverState();
    this.states.push(state);

    if (this.parsers.length === 0) {
      this.parsers.push(new MainParser(state));
    } else {
      this.parsers.push(new ZoneParser(state, `Z${this.states.length}`));
    }
  }

  public handle(data: string): MqttUpdate | undefined {
    for (let zone = 1; zone <= this.parsers.length; zone++) {
      const result = this.parsers[zone - 1].parse(data);
      if (result.handled && result.value) {
        return {
          key: result.key ?? ReceiverSettings.None,
          value: result.value,
          zone,
          ip: this.ip,
        };
      }
    }
  }

  async read(mqttManager: MqttManager): Promise<void> {
    try {
      const data = await this.client.nextData();
      const lines = data?.split('\r') ?? [];

      for await (const line of lines) {
        if (line !== '') {
          console.debug(`[TELNET:${this.ip}]<-${line}`);
          const result = this.handle(line);
          if (result) {
            await mqttManager.publish(result);
            const state = this.states[result.zone - 1];
            state.updateState(result.key, result.value);
            await mqttManager.publishState(state, result.zone);
          } else {
            console.debug(`[TELNET:${this.ip}]!-Unhandled: ${line}`);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}
