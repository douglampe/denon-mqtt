import { ZoneConfig } from './ZoneConfig';

export interface ReceiverConfig {
  name: string;
  id: string;
  ip: string;
  sources: Array<{ index: string; display: string; code: string }>;
  zones: ZoneConfig[];
}
