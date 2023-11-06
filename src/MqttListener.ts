import { MqttClient } from 'mqtt';

import { CommandMessage } from './CommandMessage';
import { ReceiverState } from './ReceiverState';
import { TelnetBroadcaster } from './TelnetBroadcaster';

export interface MqttListenerOptions {
  id: string;
  client: MqttClient;
  broadcaster: TelnetBroadcaster;
}

export class MqttListener {
  private commandTopic: string;
  private commands: Record<string, (message: CommandMessage) => string | undefined> = {};

  public static DefaultOptions = {
    id: 'denon',
  };

  constructor(private options: MqttListenerOptions) {
    this.commandTopic = `${this.options.id}/command`;

    this.addCommand('turn_on', (message: CommandMessage) => {
      return 'PWON';
    });
    this.addCommand('turn_off', (message: CommandMessage) => {
      return 'PWOFF';
    });

    this.addCommand('main_zone_source', (message: CommandMessage) => {
      return `SI${message.value}`;
    });
    this.addCommand('video_select', (message: CommandMessage) => {
      return `SV${message.value}`;
    });
    this.addCommand('sd', (message: CommandMessage) => {
      return `SD${message.value}`;
    });
    this.addCommand('digital_input', (message: CommandMessage) => {
      return `DC${message.value}`;
    });
    this.addCommand('surround_mode', (message: CommandMessage) => {
      return `MS${message.value}`;
    });
    this.addCommand('power', (message: CommandMessage) => {
      return `PW${message.value}`;
    });
    this.addCommand('main_zone_power', (message: CommandMessage) => {
      return `ZM${message.value}`;
    });
    this.addCommand('main_zone_mute', (message: CommandMessage) => {
      return `MU${message.value}`;
    });
    this.addCommand('main_zone_vol', (message: CommandMessage) => {
      return `MV${message.value}`;
    });

    this.setupZone('Z2');
    this.setupZone('Z3');
  }

  addCommand(key: string, handler: (message: CommandMessage) => string | undefined) {
    this.commands[key] = handler;
  }

  setupZone(zone: string) {
    const zoneNumber = zone.substring(1);
    const prefix = `zone_${zoneNumber}`;

    this.addCommand(`${prefix}_power`, (message: CommandMessage) => {
      return `${zone}${message.value}`;
    });
    this.addCommand(`${prefix}_volume`, (message: CommandMessage) => {
      return `${zone}${message.value}`;
    });
    this.addCommand(`${prefix}_mute`, (message: CommandMessage) => {
      return `${zone}MU${message.value}`;
    });
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
    const handler = this.commands[message.command];
    if (handler) {
      const command = handler(message);
      if (command) {
        await this.options.broadcaster.send(command);
      }
    }
    else {
      console.debug('No handler for command:', message.command);
    }
  }
}
