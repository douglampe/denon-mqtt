import { ReceiverSettings, StateValue } from 'denon-state-manager';

export interface CommandMessage {
  command: ReceiverSettings;
  value?: StateValue;
  zone?: number;
}
