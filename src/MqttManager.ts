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
  receiver: ReceiverConfig;
}
export class MqttManager {
  private broadcaster: MqttBroadcaster;
  private receivers: ReceiverManager[] = [];

  constructor(
    private mqttClient: MqttClient,
    private options: MqttManagerOptions,
  ) {}

  async connect() {
    this.broadcaster = new MqttBroadcaster({
      prefix: this.options.prefix,
      id: this.options.receiver.id,
      client: this.mqttClient,
    });

    for await (const receiver of this.receivers) {
      const mqttListener = new MqttListener({
        ...MqttListener.DefaultOptions,
        client: this.mqttClient,
        receiver,
      });
      await mqttListener.listen(receiver.send);
      await receiver.init();
    }

    const mqttBroadcaster = new MqttBroadcaster({
      ...MqttBroadcaster.DefaultOptions,
      client: this.mqttClient,
    });
  }

  publish(update: MqttUpdate) {
    return this.broadcaster.publish(update);
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
