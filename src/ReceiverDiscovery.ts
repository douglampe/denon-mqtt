import { Telnet } from 'telnet-client';
import { XMLParser } from 'fast-xml-parser';

import { ReceiverConfig } from './ReceiverConfig';

export class ReceiverDiscovery {
  private config: ReceiverConfig;
  private client: Telnet;

  constructor(id: string, ip: string) {
    this.config = {
      id,
      ip,
      name: 'UNKNOWN',
      sources: [],
      zones: [],
    };
  }

  public async init() {
    this.client = new Telnet();

    await this.client.connect({
      host: this.config.ip,
      negotiationMandatory: false,
      timeout: 5000,
      irs: '\r',
      ors: '\r',
      sendTimeout: undefined,
    });
  }

  public async disconnect() {
    await this.client.destroy();
  }

  public async discover() {
    console.debug(`Discovering configuration for AVR at ${this.config.ip}`);

    await this.discoverName();

    await this.discoverZones();

    await this.discoverSources();

    const selectedSources = await this.getSelectedSources();

    await this.init();

    await this.discoverSourceCodes(selectedSources);

    await this.disconnect();

    return this.config;
  }

  async discoverName() {
    const friendlyName = await this.fetchAvrData(3);

    const name = friendlyName.FriendlyName;
    if (name) {
      this.config.name = name;
      this.config.id = name.replace(new RegExp(/\W+/), '_').toLowerCase();
    }
  }

  async discoverZones() {
    const zoneNames = await this.fetchAvrData(6);

    const zoneRename = zoneNames.ZoneRename as Record<string, string>;

    for (const [zoneKey, name] of Object.entries(zoneRename)) {
      const zoneIndex = zoneKey === 'MainZone' ? '1' : zoneKey.substring(4);
      const zone = this.config.zones.find((z) => z.index === zoneIndex);
      if (zone) {
        zone.name = name;
      } else {
        this.config.zones.push({ index: zoneIndex, name, sources: [] });
      }
    }
  }

  async discoverSources() {
    const sourceList = await this.fetchAvrData(7);

    const sourceListRoot = sourceList.SourceList;
    const zones = sourceListRoot?.Zone;

    for (let i = 0; zones && i < zones.length; i++) {
      const discoveredZone = zones[i];
      const zoneIndex = discoveredZone['@_index'];

      const zone = this.config.zones.find((z) => z.index == zoneIndex);

      if (zone && discoveredZone.Source) {
        for (let j = 0; j < discoveredZone.Source.length; j++) {
          const source = discoveredZone.Source[j];
          const display = source.Name;
          const index = source['@_index'];

          if (display && index) {
            zone.sources.push(index);
            const source = this.config.sources.find((s) => s.index === index);
            if (source) {
              source.display = display;
            } else this.config.sources.push({ index, display, code: 'UNKNOWN' });
          }
        }
      }
    }
  }

  async discoverSourceCodes(selectedSources: string[]) {
    const selected = selectedSources[0];
    const firstSource = this.config.sources.find((s) => s.index === this.config.zones[0].sources[0]);

    // Change source if it is already the first source.
    if (firstSource?.display === selected) {
      console.debug('Changing source in order to change back and detect code...');

      await Promise.all([this.waitForReponse('SI'), this.setSource(this.config.zones[0].sources[1])]);
    }

    const mainZone = this.config.zones[0];
    // Use main zone since source is an input for other zones but not main zone so will error if we try to set for main
    for (let i = 0; i < mainZone.sources.length; i++) {
      const source = this.config.sources.find((s) => s.index === mainZone.sources[i]);
      if (source) {
        console.debug(`Setting source to ${source.display} (index ${source.index})`);
        await Promise.all([this.getSourceCode(source.index), this.setSource(source.index)]);
      }
    }

    const selectedSource = this.config.sources.find((s) => s.display === selected);

    if (selectedSource && selectedSource.index !== mainZone.sources[mainZone.sources.length - 1]) {
      console.debug(`Setting source back to ${selectedSource.display}...`);

      await this.setSource(selectedSource.index);
    }

    if (this.config.zones.length > 1) {
      // Change source if it is already the last source for zone 2.
      const zone2 = this.config.zones[1];
      const lastZone2Source = this.config.sources.find((s) => s.index === zone2.sources[zone2.sources.length - 1]);

      if (lastZone2Source) {
        if (lastZone2Source?.display === selectedSources[1]) {
          console.debug('Changing zone2 source in order to change back and detect code...');

          await Promise.all([this.waitForReponse('Z2'), this.setSource(this.config.zones[1].sources[1], 2)]);
        }

        // Get last source for zone 2 which should be zone 1 output (SOURCE)
        await Promise.all([this.getSourceCode(lastZone2Source?.index, 2), this.setSource(lastZone2Source.index, 2)]);

        const selectedZone2Source = this.config.sources.find((s) => s.display === selectedSources[1]);

        if (selectedZone2Source && selectedZone2Source.index !== lastZone2Source.index) {
          console.debug(`Setting Zone 2 source back to ${selectedZone2Source.display}...`);

          await Promise.all([this.waitForReponse('Z2'), this.setSource(selectedZone2Source.index, 2)]);
        }
      }
    }

    // Update soure zones from index to codes
    for (const zone of this.config.zones) {
      for (let i = 0; i < zone.sources.length; i++) {
        const source = this.config.sources.find((s) => s.index === zone.sources[i]);
        if (source) {
          zone.sources[i] = source.code;
        }
      }
    }
  }

  async getSelectedSources() {
    const selectedSources: string[] = [];
    const selectedSourcesXml = await this.fetchAvrData(1, 'home');

    for (const [_zoneKey, source] of Object.entries(selectedSourcesXml.listHomeMenu)) {
      const name = (source as any).SourceName;

      console.log(name);
      if (name) {
        selectedSources.push(name);
      }
    }

    console.debug('Current source selections:');
    for (let i = 0; i < selectedSources.length; i++) {
      console.debug(`Zone ${i + 1}: ${selectedSources[i]}`);
    }

    return selectedSources;
  }

  async setSource(index: string, zone = 1) {
    console.debug(`Setting zone ${zone} source to index ${index}`);
    const data = encodeURIComponent(`<Source zone="${zone}" index="${index}"></Source>`);
    const result = await fetch(`https://${this.config.ip}:10443/ajax/globals/set_config?type=7&data=${data}`);

    if (result.status !== 200) {
      await this.disconnect();
      console.error(result);
      throw new Error(`Error setting source to index ${index} for zone ${zone}`);
    }
  }

  async getSourceCode(index: string, zone = 1) {
    const source = this.config.sources.find((s) => s.index === index);

    if (source) {
      const code = await this.waitForReponse(zone === 1 ? 'SI' : `Z${zone}`);

      if (code) {
        source.code = code.substring(2, code.length);
      }
    }
  }

  public async fetchAvrData(type: number, prefix = 'globals') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const result = await fetch(`https://${this.config.ip}:10443/ajax/${prefix}/get_config?type=${type}`);

    if (!result.ok) {
      console.error(result);
      throw new Error(`Error retrieving configuration for type ${type}.`);
    }

    const body = await result.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const xml = await parser.parse(body);
    console.debug(JSON.stringify(xml, null, 2));

    return xml;
  }

  public async waitForReponse(prefix: string) {
    let result: string | null = '';
    let i = 0;
    while (!result?.startsWith(prefix) && i++ < 100) {
      const data = await this.client.nextData();
      const lines = data?.substring(0, data.length - 1).split('\r');
      for (let j = 0; !result?.startsWith(prefix) && lines && j < lines.length; j++) {
        result = lines[j];
      }
    }

    if (!result.startsWith(prefix)) {
      throw new Error(`Error: No response received with prefix ${prefix}.`);
    }

    console.debug(`Received response: ${result}`);

    return result;
  }
}
