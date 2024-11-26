import { ZoneConfig } from './ZoneConfig';

export interface ReceiverConfig {
  name: string;
  id: string;
  ip: string;
  zones: ZoneConfig[];
}
