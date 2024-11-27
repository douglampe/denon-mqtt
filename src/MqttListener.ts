import { MessageFormatter, ReceiverSettings, StateValue } from 'denon-state-manager';
import { MqttClient } from 'mqtt';

import { ListenerConfig } from './ListenerConfig';
import { ReceiverManager } from './ReceiverManager';

export interface MqttListenerOptions {
  prefix: string;
  id: string;
  client: MqttClient;
  receiver: ReceiverManager;
}

export class MqttListener {
  private listenerConfigs: Record<string, ListenerConfig> = {};

  constructor(private options: MqttListenerOptions) {}

  public getTopic(component: string, id: string, zone: number) {
    const zonePrefix = zone == 1 ? 'main_zone' : `zone${zone}`;
    return `${this.options.prefix}/${component}/${this.options.id}_${zonePrefix}_${id}/command`;
  }

  public async listenToZone(component: string, command: ReceiverSettings, zone: number) {
    const topic = this.getTopic(component, ReceiverSettings[command].toLowerCase(), zone);
    this.listenerConfigs[topic] = { command, zone };

    await this.options.client.subscribeAsync(topic);
    console.debug(`Listening to topic ${topic}`);
  }

  public async listen() {
    for (let i = 1; i <= this.options.receiver.options.zones.length; i++) {
      const zone = this.options.receiver.options.zones[i - 1];

      console.debug(`Configuring receiver ${this.options.receiver.options.name} zone ${zone}`);

      const promises = [];
      promises.push(this.listenToZone('device', ReceiverSettings.None, i));
      promises.push(this.listenToZone('switch', ReceiverSettings.Power, i));
      promises.push(this.listenToZone('switch', ReceiverSettings.Mute, i));
      promises.push(this.listenToZone('select', ReceiverSettings.Source, i));
      promises.push(this.listenToZone('volume', ReceiverSettings.Volume, i));

      await Promise.allSettled(promises);
    }

    this.options.client.on('message', async (topic, message) => {
      const body = message.toString();
      console.debug(`MQTT Message on topic ${topic}:`, body);

      if (topic === this.getTopic('device', 'none', 1) && body === 'REFRESH') {
        await this.handleMessage(ReceiverSettings.None, 'REFRESH', 1);
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
      await this.options.receiver.send(avrCommand);
    } else {
      console.debug(`No message translation found for command ${ReceiverSettings[command]} for zone ${zone} or error parsing value:`, value);
    }
  }
}
