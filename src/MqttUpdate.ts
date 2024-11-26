import { ReceiverSettings, StateValue } from 'denon-state-manager';

export interface MqttUpdate {
  key: ReceiverSettings;
  value: StateValue;
  zone: number;
}
