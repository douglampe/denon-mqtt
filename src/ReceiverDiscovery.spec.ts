import { ReceiverDiscovery } from './ReceiverDiscovery';
import { Telnet } from 'telnet-client';

jest.mock('telnet-client', () => ({
  Telnet: jest.fn(),
}));

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

const mockTelnetInstance = {
  connect: jest.fn(),
  destroy: jest.fn(),
  nextData: jest.fn(),
};

const createReceiver = () => new ReceiverDiscovery('denon', '192.168.1.1234');

beforeEach(() => {
  jest.clearAllMocks();
  (Telnet as any as jest.Mock).mockImplementation(() => mockTelnetInstance);
});

describe('constructor()', () => {
  it('should initialize config with defaults', () => {
    const receiver = createReceiver();
    expect((receiver as any).config).toEqual({
      id: 'denon',
      ip: '192.168.1.1234',
      name: 'UNKNOWN',
      sources: [],
      zones: [],
    });
  });
});

describe('init()', () => {
  it('should connect telnet client with expected options', async () => {
    const receiver = createReceiver();
    await receiver.init();

    expect(mockTelnetInstance.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        host: '192.168.1.1234',
        timeout: 5000,
      }),
    );
  });
});

describe('disconnect()', () => {
  it('should destroy telnet connection', async () => {
    const receiver = createReceiver();
    await receiver.init();
    await receiver.disconnect();

    expect(mockTelnetInstance.destroy).toHaveBeenCalled();
  });
});

describe('discoverName()', () => {
  it('should parse receiver name from  and set in config', async () => {
    const receiver = createReceiver();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<?xml version="1.0" encoding="utf-8"?><FriendlyName>Home Theater</FriendlyName>',
    });

    await receiver.discoverName();

    expect((receiver as any).config.name).toBe('Home Theater');
  });
});

describe('discoverZones()', () => {
  it('should discover zones with names from XML', async () => {
    const receiver = createReceiver();

    mockFetch.mockResolvedValue({
      ok: true,
      text: async () =>
        '<?xml version="1.0" encoding="utf-8"?><ZoneRename><MainZone>Main Zone</MainZone><Zone2>Zone 2</Zone2><Zone3>Zone 3</Zone3></ZoneRename>',
    });

    await receiver.discoverZones();

    expect((receiver as any).config.zones).toEqual([
      { index: '1', name: 'Main Zone', sources: [] },
      { index: '2', name: 'Zone 2', sources: [] },
      { index: '3', name: 'Zone 3', sources: [] },
    ]);
  });
});

describe('discoverSources()', () => {
  it('should discover sources and associate them with zones', async () => {
    const receiver = createReceiver();
    (receiver as any).config.zones = [{ index: '1', name: 'Main', sources: [] }];

    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => `<?xml version="1.0" encoding="utf-8"?>
      <SourceList>
        <Zone zone="1" index="1">
          <Source index="1"><Name>Fire TV</Name></Source>
          <Source index="2"><Name>VCR</Name></Source>
          <Source index="3"><Name>Blu-ray</Name></Source>
          <Source index="4"><Name>XBox</Name></Source>
          <Source index="5"><Name>Karaoke</Name></Source>
          <Source index="6"><Name>TV Audio</Name></Source>
          <Source index="7"><Name>AUX1</Name></Source>
          <Source index="8"><Name>pi</Name></Source>
          <Source index="9"><Name>Alexa</Name></Source>
          <Source index="10"><Name>Phono</Name></Source>
          <Source index="11"><Name>Tuner</Name></Source>
          <Source index="13"><Name>HEOS Music</Name></Source>
        </Zone>
        <Zone zone="2" index="13">
          <Source index="1"><Name>Fire TV</Name></Source>
          <Source index="2"><Name>VCR</Name></Source>
          <Source index="3"><Name>Blu-ray</Name></Source>
          <Source index="4"><Name>XBox</Name></Source>
          <Source index="5"><Name>Karaoke</Name></Source>
          <Source index="6"><Name>TV Audio</Name></Source>
          <Source index="8"><Name>pi</Name></Source>
          <Source index="9"><Name>Alexa</Name></Source>
          <Source index="10"><Name>Phono</Name></Source>
          <Source index="11"><Name>Tuner</Name></Source>
          <Source index="13"><Name>HEOS Music</Name></Source>
          <Source index="19"><Name>Source</Name></Source>
        </Zone>
      </SourceList>`,
    });

    await receiver.discoverSources();

    expect((receiver as any).config.sources[0]).toEqual({ index: '1', code: 'UNKNOWN', display: 'Fire TV' });
    expect((receiver as any).config.zones[0].sources).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '13']);
  });
});

describe('getSelectedSources()', () => {
  it('should return selected source names', async () => {
    const receiver = createReceiver();
    (receiver as any).config.zones = [{}, {}];

    mockFetch.mockResolvedValue({
      ok: true,
      text: async () =>
        '<?xml version="1.0" encoding="utf-8"?><listHomeMenu><MainZone><ZoneName>Living</ZoneName><SourceName>Fire TV</SourceName></MainZone><Zone2><ZoneName>Rumpus</ZoneName><SourceName>HEOS Music</SourceName></Zone2><Zone3><ZoneName>Porch</ZoneName><SourceName>HEOS Music</SourceName></Zone3></listHomeMenu>',
    });

    const result = await receiver.getSelectedSources();

    expect(result).toEqual(['Fire TV', 'HEOS Music']);
  });
});

describe('setSource()', () => {
  it('should throw error when fetch fails', async () => {
    const receiver = createReceiver();
    await receiver.init();

    mockFetch.mockResolvedValue({ status: 500 });

    await expect(receiver.setSource('10')).rejects.toThrow('Error setting source to index 10');
  });

  it('should succeed on 200 response', async () => {
    const receiver = createReceiver();
    mockFetch.mockResolvedValue({ status: 200 });

    await expect(receiver.setSource('10')).resolves.toBeUndefined();
  });
});

describe('getSourceCode()', () => {
  it('updates source code from telnet response', async () => {
    const receiver = createReceiver();
    (receiver as any).config.sources = [{ index: '10', display: 'TV', code: 'UNKNOWN' }];

    mockTelnetInstance.nextData.mockResolvedValue('SIHDMI1\r');

    await receiver.init();
    await receiver.getSourceCode('10');

    expect((receiver as any).config.sources[0].code).toBe('HDMI1');
  });
});

describe('waitForReponse()', () => {
  it('should return response with matching prefix', async () => {
    const receiver = createReceiver();

    mockTelnetInstance.nextData.mockResolvedValueOnce('XYZ\r').mockResolvedValueOnce('SIDVD\r');

    await receiver.init();
    const result = await receiver.waitForReponse('SI');

    expect(result).toBe('SIDVD');
  });

  it('throws if prefix is never received', async () => {
    const receiver = createReceiver();
    mockTelnetInstance.nextData.mockResolvedValue('ABC\r');

    await receiver.init();

    await expect(receiver.waitForReponse('SI')).rejects.toThrow('No response received');
  });
});

describe('fetchAvrData()', () => {
  it('should fetch and parse XML', async () => {
    const receiver = createReceiver();

    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => '<?xml version="1.0" encoding="utf-8"?><Foo>Bar</Foo>',
    });

    const result = await receiver.fetchAvrData(3);

    expect(result.root()?.text()).toBe('Bar');
  });

  it('should throw on fetch error', async () => {
    const receiver = createReceiver();
    mockFetch.mockResolvedValue({ ok: false });

    await expect(receiver.fetchAvrData(3)).rejects.toThrow('Error retrieving configuration');
  });
});
