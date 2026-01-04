import { Telnet } from 'telnet-client';

import { MqttManager } from './MqttManager';
import { ReceiverConfig } from './ReceiverConfig';
import { TelnetBroadcaster } from './TelnetBroadcaster';
import { TelnetListener } from './TelnetListener';

export class ReceiverManager {
  private telnetClient: Telnet;
  private listener: TelnetListener;
  private broadcaster: TelnetBroadcaster;
  private exiting: boolean;

  constructor(
    public options: ReceiverConfig,
    private mqttManager: MqttManager,
  ) {}

  public async connect() {
    const telnetClient = new Telnet();
    await telnetClient.connect({
      host: this.options.ip,
      negotiationMandatory: false,
      timeout: 5000,
      irs: '\r',
      ors: '\r',
      sendTimeout: undefined,
    });

    console.log(`Connected to Receiver "${this.options.name} on ${this.options.ip}`);

    this.listener = new TelnetListener(telnetClient, this.options.zones.length, this.options.ip);

    this.broadcaster = new TelnetBroadcaster(telnetClient, this.options.ip);
  }

  public async query() {
    for (let i = 1; i <= this.options.zones.length; i++) {
      await this.broadcaster.query(i);
    }
  }

  public async queryZone(zone: number) {
    await this.broadcaster.query(zone);
  }

  public async read() {
    await this.listener.read(this.mqttManager);

    if (!this.exiting) {
      await this.read();
    }
  }

  public send(data: string) {
    return this.broadcaster.send(data);
  }

  public disconnect() {
    this.exiting = true;
    return this.telnetClient.destroy();
  }
}
