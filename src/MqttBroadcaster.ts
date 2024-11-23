import { ReceiverSettings, StateUpdate } from 'denon-state-manager';

export interface StateHandlerOptions {
  prefix: string;
  name: string;
  id: string;
  cb: (topic: string, message: string) => Promise<void>;
}

export class MqttBroadcaster {
  private topic: string;

  public static DefaultOptions = {
    prefix: 'denon',
    name: 'Denon-Receiver',
    id: 'denon',
  };

  constructor(private options: StateHandlerOptions) {
    this.topic = `${this.options.prefix}/${this.options.id}/state`;
  }

  public async updateState(update: StateUpdate): Promise<void> {
    const message = `\{\"${ReceiverSettings[update.key]}\": ${JSON.stringify(update.value)}\}`;
    console.debug(`Sending message to topic ${this.topic}: ${message}`);
    await this.options.cb(this.topic, message);
  }
}
