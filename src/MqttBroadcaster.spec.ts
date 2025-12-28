import { ReceiverSettings, ReceiverState } from 'denon-state-manager';
import { connectAsync } from 'mqtt';

import { MqttBroadcaster } from './MqttBroadcaster';

interface GetTopicTestData {
  component: string;
  id: string;
  zone: number;
  topic: string;
}

jest.mock('mqtt', () => {
  return {
    connectAsync: jest.fn(),
  };
});

describe('MqttBroadcaster', () => {
  const mockPublish = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getTopic()', () => {
    it.each([
      {
        component: 'switch',
        id: 'power',
        zone: 1,
        topic: 'prefix/switch/avr_id_main_zone_power/state',
      },
      {
        component: 'volume',
        id: 'volume',
        zone: 2,
        topic: 'prefix/volume/avr_id_zone2_volume/state',
      },
      {
        component: 'select',
        id: 'source',
        zone: 2,
        topic: 'prefix/select/avr_id_zone2_source/state',
      },
    ])('should return $topic', async (data: GetTopicTestData) => {
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        prefix: 'prefix',
        id: 'avr_id',
        client,
      });

      const result = broadcaster.getTopic(data.component, data.id, data.zone);

      expect(result).toEqual(data.topic);
    });
  });

  describe('getStateWithKeys()', () => {
    it('should return object with keys', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        publish: mockPublish,
      });
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        ...MqttBroadcaster.DefaultOptions,
        client,
      });

      const state = new ReceiverState();
      state.updateState(ReceiverSettings.Volume, { raw: '50' });
      state.updateState(ReceiverSettings.ChannelVolume, { raw: '', dictionary: { FL: '50', FR: '50', C: '50', SL: '50', SR: '50' } });
      const result = broadcaster.getStateWithKeys(state.state);
      expect(result).toEqual({
        Volume: '50',
        ChannelVolume: { FL: '50', FR: '50', C: '50', SL: '50', SR: '50' },
      });
    });
  });

  describe('publish()', () => {
    it('should log error and exit of no value in update', async () => {
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        prefix: 'prefix',
        id: 'avr_id',
        client,
      });

      const mockLog = jest.spyOn(console, 'error');

      await broadcaster.publish({ zone: 1 } as any);

      expect(mockLog).toHaveBeenCalledWith('update.value is undefined');
    });

    it.each([
      { key: ReceiverSettings.Power, zone: 1, value: { raw: 'ON', text: 'ON' }, topic: 'prefix/switch/avr_id_main_zone_power/state' },
      { key: ReceiverSettings.Source, zone: 1, value: { raw: 'DVD', text: 'DVD' }, topic: 'prefix/select/avr_id_main_zone_source/state' },
      { key: ReceiverSettings.Volume, zone: 1, value: { raw: '55', numeric: 55 }, topic: 'prefix/volume/avr_id_main_zone_volume/state' },
    ])('should publish to state $topic', async (testData) => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        publish: mockPublish,
      });
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        prefix: 'prefix',
        id: 'avr_id',
        client,
      });
      await broadcaster.publish(testData);
      expect(mockPublish).toHaveBeenCalledWith(testData.topic, testData.value.raw);
    });

    it.each([
      { key: ReceiverSettings.Power, zone: 1, value: { raw: 'ON' }, topic: 'prefix/switch/avr_id_main_zone_power/state' },
      { key: ReceiverSettings.Source, zone: 1, value: { raw: 'DVD' }, topic: 'prefix/select/avr_id_main_zone_source/state' },
      { key: ReceiverSettings.Volume, zone: 1, value: { raw: '55' }, topic: 'prefix/volume/avr_id_main_zone_volume/state' },
    ])('should log error if value is mising for key $key', async (testData) => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        publish: mockPublish,
      });
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        prefix: 'prefix',
        id: 'avr_id',
        client,
      });

      const mockLog = jest.spyOn(console, 'error');

      await broadcaster.publish(testData);

      expect(mockLog).toHaveBeenCalledWith(
        `Could not parse message payload from value for setting ${ReceiverSettings[testData.key]}: {"raw":"${testData.value.raw}"}`,
      );
    });

    it('should log error and exit of update key not supported', async () => {
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        prefix: 'prefix',
        id: 'avr_id',
        client,
      });

      const mockLog = jest.spyOn(console, 'error');

      await broadcaster.publish({ key: ReceiverSettings.ECOMode, zone: 1, value: { raw: 'foo' } });

      expect(mockLog).toHaveBeenCalledWith('Could not parse message payload from value for setting ECOMode: {"raw":"foo"}');
    });
  });

  describe('publishState()', () => {
    it('should call send for main zone', async () => {
      const state = new ReceiverState();
      state.updateState(ReceiverSettings.Volume, { raw: '55', numeric: 55 });
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        publish: mockPublish,
      });
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        ...MqttBroadcaster.DefaultOptions,
        client,
      });
      await broadcaster.publishState(state, 1);
      expect(mockPublish).toHaveBeenCalledWith(
        `${MqttBroadcaster.DefaultOptions.prefix}/sensor/${MqttBroadcaster.DefaultOptions.id}_main_zone_state/state`,
        '{"Volume":55}',
      );
    });
  });

  it('should call send for zone 2', async () => {
    const state = new ReceiverState();
    state.updateState(ReceiverSettings.Volume, { raw: '55', numeric: 55 });

    (connectAsync as jest.Mock).mockResolvedValueOnce({
      publish: mockPublish,
    });
    const client = await connectAsync('mqtt://foo:123');
    const broadcaster = new MqttBroadcaster({
      ...MqttBroadcaster.DefaultOptions,
      client,
    });
    await broadcaster.publishState(state, 2);
    expect(mockPublish).toHaveBeenCalledWith(
      `${MqttBroadcaster.DefaultOptions.prefix}/sensor/${MqttBroadcaster.DefaultOptions.id}_zone2_state/state`,
      '{"Volume":55}',
    );
  });

  it('should call send for zone 3', async () => {
    const state = new ReceiverState();
    state.updateState(ReceiverSettings.Volume, { raw: '55', numeric: 55 });

    (connectAsync as jest.Mock).mockResolvedValueOnce({
      publish: mockPublish,
    });
    const client = await connectAsync('mqtt://foo:123');
    const broadcaster = new MqttBroadcaster({
      ...MqttBroadcaster.DefaultOptions,
      client,
    });
    await broadcaster.publishState(state, 3);
    expect(mockPublish).toHaveBeenCalledWith(
      `${MqttBroadcaster.DefaultOptions.prefix}/sensor/${MqttBroadcaster.DefaultOptions.id}_zone3_state/state`,
      '{"Volume":55}',
    );
  });
});
