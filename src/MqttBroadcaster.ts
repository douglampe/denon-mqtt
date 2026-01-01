import { ReceiverSettings, ReceiverState, StateValue } from 'denon-state-manager';
import { MqttClient } from 'mqtt/*';

import { MqttUpdate } from './MqttUpdate';

export interface MqttBroadcasterOptions {
  prefix: string;
  id: string;
  client: MqttClient;
}

const ReceiverSettingsMap: Record<string, string> = {
  None: 'none',
  ChannelSetting: 'channel_setting',
  ChannelVolume: 'channel_volume',
  DigitalInput: 'digital_input',
  ECOMode: 'eco_mode',
  MainPower: 'main_power',
  MaxVolume: 'max_volume',
  Mute: 'mute',
  Parameters: 'parameters',
  Power: 'power',
  SD: 'sd',
  Sleep: 'sleep',
  Source: 'source',
  SSLevels: 'ss_levels',
  SSSpeakers: 'ss_speakers',
  Standby: 'standby',
  SurroundMode: 'surround_mode',
  VideoSelect: 'video_select',
  VideoSelectSource: 'video_select_source',
  HPF: 'hpf',
  QuickSelect: 'quick_select',
  Volume: 'volume',
};

export class MqttBroadcaster {
  public static DefaultOptions = {
    prefix: 'denon',
    id: 'denon',
  };

  constructor(private options: MqttBroadcasterOptions) {}

  public getTopic(zone: number) {
    const zonePrefix = zone == 1 ? 'main_zone' : `zone${zone}`;
    return `${this.options.prefix}/${this.options.id}/${zonePrefix}/state`;
  }

  public getStateWithKeys(state: { [key in ReceiverSettings]?: StateValue }) {
    const stateWithKeys: Record<string, string | number | Record<string, string>> = {};

    for (const [key, value] of Object.entries(state)) {
      const name = ReceiverSettings[key as keyof typeof ReceiverSettings];
      const processedValue = value.dictionary ?? value.numeric ?? value.text ?? value.raw;
      if (processedValue) {
        stateWithKeys[ReceiverSettingsMap[name]] = processedValue;
      }
    }

    return stateWithKeys;
  }

  public async publish(update: MqttUpdate): Promise<void> {
    const key = update.key ?? ReceiverSettings.None;
    const id = ReceiverSettingsMap[ReceiverSettings[key]];

    if (!id) {
      console.error(`Cannot map setting ${key}`);
      return;
    }

    if (!update.value) {
      console.error('update.value is undefined');
      return;
    }

    const payload: Record<string, any> = {};

    switch (key) {
      case ReceiverSettings.Volume:
      case ReceiverSettings.MaxVolume:
        payload[id] = update.value.numeric;
        break;
      case ReceiverSettings.Parameters:
      case ReceiverSettings.ChannelVolume:
      case ReceiverSettings.ChannelSetting:
      case ReceiverSettings.SSSpeakers:
      case ReceiverSettings.SSLevels:
        payload[id] = { key: update.value.key, value: update.value.value };
        break;
      default:
        payload[id] = update.value.raw;
        break;
    }

    const topic = this.getTopic(update.zone);

    const message = JSON.stringify(payload);

    console.debug(`[MQTT:${topic}] ${message}`);
    this.options.client.publish(topic, message);
  }

  public async publishState(state: ReceiverState, zone: number): Promise<void> {
    const message = JSON.stringify({ state: this.getStateWithKeys(state.state) });

    const topic = this.getTopic(zone);

    console.debug(`[MQTT:${topic}] ${message}`);
    this.options.client.publish(topic, message);

    return Promise.resolve();
  }
}
