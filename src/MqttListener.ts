import { MessageFormatter, ReceiverSettings, StateValue } from 'denon-state-manager';
import { MqttClient } from 'mqtt';

import { ListenerConfig } from './ListenerConfig';
import { TelnetBroadcaster } from './TelnetBroadcaster';

export interface MqttListenerOptions {
  prefix: string;
  id: string;
  client: MqttClient;
  broadcaster: TelnetBroadcaster;
  zones: number;
}

export class MqttListener {
  private listenerConfigs: Record<string, ListenerConfig> = {};

  public static DefaultOptions = {
    prefix: 'denon',
    id: 'denon',
    zones: 3,
  };

  constructor(private options: MqttListenerOptions) {}

  public getTopic(component: string, id: string, zone: number) {
    const zonePrefix = zone == 1 ? 'main_zone' : `zone${zone}`;
    return `${this.options.prefix}/${component}/${this.options.id}_${zonePrefix}_${id}/command`;
  }

  public async listenToZone(component: string, command: ReceiverSettings, zone: number) {
    const topic = this.getTopic(component, ReceiverSettings[command].toLowerCase(), zone);
    this.listenerConfigs[topic] = { command, zone };

    try {
      await this.options.client.subscribeAsync(topic);
      console.debug(`Listening to topic ${topic}`);
    } catch (err) {
      console.error(`Error subscribing to topic ${topic}:`, err);
    }
  }

  public async listen() {
    const promises = [];

    for (let i = 1; i <= this.options.zones; i++) {
      promises.push(this.listenToZone('device', ReceiverSettings.None, i));
      promises.push(this.listenToZone('switch', ReceiverSettings.Power, i));
      promises.push(this.listenToZone('switch', ReceiverSettings.Mute, i));
      promises.push(this.listenToZone('select', ReceiverSettings.Source, i));
      promises.push(this.listenToZone('volume', ReceiverSettings.Volume, i));
    }

    await Promise.allSettled(promises);

    this.options.client.on('message', async (topic, message) => {
      const body = message.toString();
      console.debug(`MQTT Message on topic ${topic}:`, body);

      if (topic === this.getTopic('device', 'none', 1) && body === 'REFRESH') {
        await this.handleMessage(ReceiverSettings.None, 'REFRESH', 1);
        await this.options.broadcaster.init();
        return;
      }

      const config = this.listenerConfigs[topic];

      if (config) {
        this.handleMessage(config.command, body, config.zone)
          .then()
          .catch((error) => console.error(error));
      } else {
        console.debug(`No configuration found for topic ${topic}`);
      }
    });
  }

  async handleMessage(command: ReceiverSettings, body: string, zone: number) {
    const value = JSON.parse(body) as StateValue;

    const avrCommand = zone === 1 ? MessageFormatter.getCommand(command, value) : MessageFormatter.getCommand(command, value, zone);

    if (avrCommand) {
      await this.options.broadcaster.send(avrCommand);
    } else {
      console.debug(`No message translation found for command ${ReceiverSettings[command]} for zone ${zone} or error parsing value:`, value);
    }
  }
}
