import { BaseParser } from './BaseParser';
import { ParserResult } from './ParserResult';
import { StateHandler } from './StateHandler';
import { ICommandHandler } from './TelnetListener';

export class MainParser extends BaseParser implements ICommandHandler {
  constructor(stateHandler: StateHandler) {
    super(stateHandler);
    this.prefixMap = {};
    this.populateMap();
  }

  populateMap(): void {
    [
      { prefix: 'SI', key: 'main_zone_source' },
      { prefix: 'SV', key: 'video_select' },
      { prefix: 'SD', key: 'sd' },
      { prefix: 'DC', key: 'digital_input' },
      { prefix: 'MS', key: 'surround_mode' },
    ].map((i) => this.addPassthroughParser(i));

    [
      { prefix: 'PW', key: 'power' },
      { prefix: 'ZM', key: 'main_zone_power' },
      { prefix: 'MU', key: 'main_zone_mute' },
    ].map((i) => this.addLowerCaseParser(i));

    [{ prefix: 'MV', key: 'main_zone_max_vol', firstPart: 'MAX' }].map((i) => this.addDelimitedParser(i));

    [
      { prefix: 'Z2', key: 'zone_2_power', list: ['ON', 'OFF'] },
      { prefix: 'Z3', key: 'zone_3_power', list: ['ON', 'OFF'] },
    ].map((i) => this.addListParser(i));

    [
      { prefix: 'SL', key: 'main_zone_sleep', ending: 'P' },
      { prefix: 'SB', key: 'main_zone_standby', ending: 'Y' },
      { prefix: 'EC', key: 'main_zone_eco_mode', ending: 'O' },
    ].map((i) => this.addLongPrefixParser(i));

    this.addParser('CV', (data: string) => {
      if (data !== 'END') {
        const parts = data.split(' ');
        const channel = parts[0].toLowerCase();
        const volume = parts.length > 1 ? parts[1] : '';
        return {
          handled: true,
          key: `main_zone_ch_${channel}_vol`,
          value: volume,
        };
      }
      return {
        handled: false,
      };
    });

    this.addParser('MV', (data: string) => {
      const volume = parseInt(data);
      if (!isNaN(volume)) {
        return {
          handled: true,
          key: 'main_zone_vol',
          value: volume.toString(),
          zone: 1,
        };
      }
      return {
        handled: false,
      };
    });

    this.addParser('PS', (data: string) => {
      if (data !== 'END') {
        const lastSpaceIndex = data.lastIndexOf(' ');
        const key = lastSpaceIndex > -1 ? data.substring(0, lastSpaceIndex).toLowerCase().replace(' ', '_') : data.toLowerCase();
        const value = lastSpaceIndex > -1 ? data.substring(lastSpaceIndex + 1) : '';
        return {
          handled: true,
          key: `main_zone_parameter_${key}`,
          value,
        };
      }
      return {
        handled: false,
      };
    });

    this.addParser('SS', (data: string) => {
      if (data.startsWith('LEV') && data !== 'LEV END') {
        const parts = data.substring(3).split(' ');
        const channel = parts[0].toLowerCase();
        const level = parts.length > 1 ? parts[1] : '';
        return {
          handled: true,
          key: `main_zone_ss_${channel}_level`,
          value: level,
        };
      }
      if (data.startsWith('SPC') && data !== 'SPC END') {
        const parts = data.substring(3).split(' ');
        const channel = parts[0].toLowerCase();
        const level = parts.length > 1 ? parts[1] : '';
        return {
          handled: true,
          key: `main_zone_ss_${channel}_speaker`,
          value: level,
        };
      }
      return {
        handled: false,
      };
    });
  }
}
