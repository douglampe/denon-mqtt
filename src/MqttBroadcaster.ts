import { ReceiverSettings, ReceiverState, StateUpdate, StateValue } from 'denon-state-manager';
import { MqttClient } from 'mqtt/*';

import { MqttUpdate } from './MqttUpdate';

export interface MqttBroadcasterOptions {
  prefix: string;
  id: string;
  client: MqttClient;
}

export class MqttBroadcaster {
  public static DefaultOptions = {
    prefix: 'denon',
    id: 'denon',
  };

  constructor(private options: MqttBroadcasterOptions) {}

  public getTopic(component: string, id: string, zone: number) {
    const zonePrefix = zone == 1 ? 'main_zone' : `zone${zone}`;
    return `${this.options.prefix}/${component}/${this.options.id}_${zonePrefix}_${id}/state`;
  }

  public getStateWithKeys(state: { [key in ReceiverSettings]?: StateValue }) {
    const stateWithKeys: Record<string, string | number | Record<string, string>> = {};

    for (const [key, value] of Object.entries(state)) {
      const name = ReceiverSettings[key as keyof typeof ReceiverSettings];
      const processedValue = value.dictionary ?? value.numeric ?? value.text ?? value.raw;
      if (processedValue) {
        stateWithKeys[name] = processedValue;
      }
    }

    return stateWithKeys;
  }

  public async publish(update: MqttUpdate): Promise<void> {
    let component: string | undefined;
    let message: string | undefined;
    const key = update.key ?? ReceiverSettings.None;
    const id = ReceiverSettings[key].toLowerCase();

    if (!update.value) {
      console.error('update.value is undefined');
      return;
    }

    switch (update.key) {
      case ReceiverSettings.Power:
      case ReceiverSettings.Mute:
        component = 'switch';
        message = update.value.text ?? '';
        break;
      case ReceiverSettings.Source:
        component = 'select';
        message = update.value.text ?? '';
        break;
      case ReceiverSettings.Volume:
        component = 'volume';
        message = update.value.numeric?.toString() ?? '';
        break;
    }

    if (message === '') {
      throw new Error(`Could not parse message payload from value for setting ${ReceiverSettings[key]}: ${JSON.stringify(update.value)}`);
    }

    if (component && message) {
      const topic = this.getTopic(component, id, update.zone);

      console.debug(`Sending message to topic ${topic}: ${message}`);
      this.options.client.publish(topic, message);
    }
  }

  public async publishState(state: ReceiverState, zone: number): Promise<void> {
    const message = JSON.stringify(this.getStateWithKeys(state.state));

    const topic = this.getTopic('sensor', 'state', zone);

    console.debug(`Sending message to topic ${topic}: ${message}`);
    this.options.client.publish(topic, message);

    return Promise.resolve();
  }
}
