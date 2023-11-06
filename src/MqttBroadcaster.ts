import { MqttClient } from 'mqtt';

import { StateHandler } from './StateHandler';

export interface StateHandlerOptions {
  client?: MqttClient;
  prefix: string;
  name: string;
  id: string;
}

export class MqttBroadcaster implements StateHandler {
  private stateTopic: string;

  public static DefaultOptions = {
    prefix: 'denon',
    name: 'Denon-Receiver',
    id: 'denon',
  };

  constructor(private options: StateHandlerOptions) {
    this.stateTopic = `${this.options.id}/state`;
  }

  public async send(topic: string, message: string) {
    console.debug(`Sending message to topic ${topic}: ${message}`);
    await this.options.client?.publishAsync(topic, message);
  }

  public async updateState(key: string, value: string): Promise<void> {
    await this.send(this.stateTopic, `\{\"${key}\": \"${value}\"\}`);
  }
}
