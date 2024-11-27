import { ReceiverState } from 'denon-state-manager';
import { connectAsync, MqttClient } from 'mqtt/*';

import { MqttBroadcaster } from './MqttBroadcaster';
import { MqttListener } from './MqttListener';
import { MqttUpdate } from './MqttUpdate';
import { ReceiverConfig } from './ReceiverConfig';
import { ReceiverManager } from './ReceiverManager';

export interface MqttManagerOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  prefix: string;
  id: string;
  receiver: ReceiverConfig;
}

export class MqttManager {
  private broadcaster: MqttBroadcaster;

  constructor(
    private mqttClient: MqttClient,
    private options: MqttManagerOptions,
  ) {}

  async connect(receiver: ReceiverManager) {
    this.broadcaster = new MqttBroadcaster({
      prefix: this.options.prefix,
      id: this.options.receiver.id,
      client: this.mqttClient,
    });

    const mqttListener = new MqttListener({
      prefix: this.options.prefix,
      id: this.options.id,
      client: this.mqttClient,
      receiver,
    });
    await mqttListener.listen();
  }

  publish(update: MqttUpdate) {
    return this.broadcaster.publish(update);
  }

  publishState(state: ReceiverState, zone: number) {
    return this.broadcaster.publishState(state, zone);
  }

  disconnect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.mqttClient.end((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
