import { MessageFormatter, ReceiverSettings, StateValue } from 'denon-state-manager';
import { MqttClient } from 'mqtt';

import { ReceiverManager } from './ReceiverManager';

export interface MqttListenerOptions {
  prefix: string;
  id: string;
  client: MqttClient;
  receiver: ReceiverManager;
}

const TopicMap: Record<string, ReceiverSettings> = {
  none: ReceiverSettings.None,
  channel_setting: ReceiverSettings.ChannelSetting,
  channel_volume: ReceiverSettings.ChannelVolume,
  digital_input: ReceiverSettings.DigitalInput,
  eco_mode: ReceiverSettings.ECOMode,
  main_power: ReceiverSettings.MainPower,
  max_volume: ReceiverSettings.MaxVolume,
  mute: ReceiverSettings.Mute,
  parameters: ReceiverSettings.Parameters,
  power: ReceiverSettings.Power,
  sd: ReceiverSettings.SD,
  sleep: ReceiverSettings.Sleep,
  source: ReceiverSettings.Source,
  ss_levels: ReceiverSettings.SSLevels,
  ss_speakers: ReceiverSettings.SSSpeakers,
  standby: ReceiverSettings.Standby,
  surround_mode: ReceiverSettings.SurroundMode,
  video_select: ReceiverSettings.VideoSelect,
  video_select_source: ReceiverSettings.VideoSelectSource,
  hpf: ReceiverSettings.HPF,
  quick_select: ReceiverSettings.QuickSelect,
  volume: ReceiverSettings.Volume,
};

export class MqttListener {
  constructor(private options: MqttListenerOptions) {}

  public async listenToZone(zone: number) {
    const zonePrefix = zone == 1 ? 'main_zone' : `zone${zone}`;
    const topic = `${this.options.prefix}/${this.options.id}/${zonePrefix}/command`;

    await this.options.client.subscribeAsync(topic);
    console.debug(`Listening to topic ${topic}`);
  }

  public async listen() {
    const deviceTopic = `${this.options.prefix}/${this.options.id}/device/command`;
    await this.options.client.subscribeAsync(deviceTopic);

    for (let i = 1; i <= this.options.receiver.options.zones.length; i++) {
      const zone = this.options.receiver.options.zones[i - 1];

      console.debug(`Configuring receiver ${this.options.receiver.options.name} zone ${i} (${zone.name})`);

      await this.listenToZone(i);
    }

    this.options.client.on('message', async (topic, message) => {
      if (!topic.startsWith(`${this.options.prefix}/${this.options.id}/`)) {
        return;
      }
      
      const body = message.toString();
      console.debug(`[MQTT:${topic}]<-`, body);

      if (topic === deviceTopic) {
        if (body === 'REFRESH') {
          await this.options.receiver.query();
        }
        return;
      }

      const zoneSegment = topic.split('/')[2];
      const zone = zoneSegment === 'main_zone' ? 1 : parseInt(zoneSegment.substring(4));

      this.handleMessage(zone, body)
        .then()
        .catch((error) => console.error(error));
    });
  }

  async handleMessage(zone: number, body: string) {
    const payload = JSON.parse(body) as Record<string, StateValue>;

    if (payload.refresh) {
      await this.options.receiver.queryZone(zone);
    }

    for (const [key, value] of Object.entries(payload)) {
      if (key !== 'refresh') {
        const setting = TopicMap[key];
        console.debug(`Parsing setting ${setting} and value ${JSON.stringify(value)}`);
        const avrCommand = zone === 1 ? MessageFormatter.getCommand(setting, value) : MessageFormatter.getCommand(setting, value, zone);
        if (avrCommand) {
          await this.options.receiver.send(avrCommand);
        } else {
          console.error(`No message translation found for command ${ReceiverSettings[setting]} for zone ${zone} or error parsing value:`, value);
        }
      }
    }
  }
}
