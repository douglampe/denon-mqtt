import { BaseParser } from './BaseParser';
import { ParserResult } from './ParserResult';
import { StateHandler } from './StateHandler';
import { ICommandHandler } from './TelnetListener';

export class ZoneParser extends BaseParser implements ICommandHandler {
  constructor(stateHandler: StateHandler) {
    super(stateHandler);
  }

  public async handle(data: string) {
    if (data === '') {
      return false;
    }

    if (data.startsWith('Z2') || data.startsWith('Z3')) {
      const zone = parseInt(data.substring(1, 2));
      const zonePrefix = zone == 1 ? 'main_zone' : `zone_${zone}`;

      const result = this.parseZone(data.substring(2));
      if (result.handled) {
        await this.updateState(`${zonePrefix}_${result.key}`, result.value!);
      }
      return result.handled;
    }
    return false;
  }

  parseZone(data: string): ParserResult {
    if (data === 'ON' || data === 'OFF') {
      return {
        handled: true,
        key: 'power',
        value: data.toLowerCase(),
      };
    }
    if (data.startsWith('CV')) {
      const suffix = data.substring(2);
      const parts = suffix.split(' ');
      const channel = parts[0].toLowerCase();
      const volume = parts.length > 1 ? parts[1] : '';
      return {
        handled: true,
        key: `ch_${channel}_vol`,
        value: volume,
      };
    }
    if (data.startsWith('MU')) {
      const suffix = data.substring(2);
      return {
        handled: true,
        key: 'mute',
        value: suffix.toLowerCase(),
      };
    }
    if (data.startsWith('CS')) {
      const suffix = data.substring(2);
      return {
        handled: true,
        key: 'channel_setting',
        value: suffix,
      };
    }
    if (data.startsWith('HPF')) {
      const suffix = data.substring(3);
      return {
        handled: true,
        key: 'hpf',
        value: suffix,
      };
    }
    if (data.startsWith('QUICK')) {
      const suffix = data.substring(5);
      return {
        handled: true,
        key: 'quick_select',
        value: suffix.toLowerCase(),
      };
    }
    const volume = parseInt(data);
    if (!isNaN(volume)) {
      return {
        handled: true,
        key: 'volume',
        value: volume.toString(),
      };
    }
    return {
      handled: true,
      key: 'source',
      value: data,
    };
  }
}
