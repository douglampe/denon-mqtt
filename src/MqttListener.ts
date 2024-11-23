import { MessageFormatter, ReceiverSettings } from 'denon-state-manager';
import { MqttClient } from 'mqtt';

import { CommandMessage } from './CommandMessage';
import { TelnetBroadcaster } from './TelnetBroadcaster';

export interface MqttListenerOptions {
  prefix: string;
  id: string;
  client: MqttClient;
  broadcaster: TelnetBroadcaster;
}

export class MqttListener {
  private commandTopic: string;

  public static DefaultOptions = {
    prefix: 'denon',
    id: 'denon',
  };

  constructor(private options: MqttListenerOptions) {
    this.commandTopic = `${this.options.prefix}/${this.options.id}/command`;
  }

  public async listen() {
    await this.options.client.subscribeAsync(this.commandTopic);

    this.options.client.on('message', (_topic, message) => {
      this.handleMessage(message.toString())
        .then()
        .catch((error) => console.error(error));
    });

    console.debug(`Listening to topic ${this.commandTopic}`);
  }

  async handleMessage(body: string) {
    console.debug('MQTT Message:', body);
    const message = JSON.parse(body) as CommandMessage;

    const command = MessageFormatter.getCommand(message.command, message.value, message.zone);

    if (command) {
      await this.options.broadcaster.send(command);
    } else {
      console.debug('No handler for command:', message.command);
    }
  }
}
