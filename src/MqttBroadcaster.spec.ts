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
    it('should return ../main_zone/... for zone 1', async () => {
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        prefix: 'prefix',
        id: 'avr_id',
        client,
      });

      const result = broadcaster.getTopic(1);

      expect(result).toEqual('prefix/avr_id/main_zone/state');
    });

    it('should return ../zone2/... for zone 2', async () => {
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        prefix: 'prefix',
        id: 'avr_id',
        client,
      });

      const result = broadcaster.getTopic(2);

      expect(result).toEqual('prefix/avr_id/zone2/state');
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
        volume: '50',
        channel_volume: { FL: '50', FR: '50', C: '50', SL: '50', SR: '50' },
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
      {
        key: ReceiverSettings.Power,
        zone: 1,
        value: { raw: 'ON', text: 'ON' },
        ip: '192.168.1.123',
        topic: 'prefix/avr_id/main_zone/state',
        payload: JSON.stringify({ power: 'ON' }),
      },
      {
        key: ReceiverSettings.Source,
        zone: 1,
        value: { raw: 'DVD', text: 'DVD' },
        ip: '192.168.1.123',
        topic: 'prefix/avr_id/main_zone/state',
        payload: JSON.stringify({ source: 'DVD' }),
      },
      {
        key: ReceiverSettings.Volume,
        zone: 1,
        value: { raw: '55', numeric: 55 },
        ip: '192.168.1.123',
        topic: 'prefix/avr_id/main_zone/state',
        payload: JSON.stringify({ volume: 55 }),
      },
      {
        key: ReceiverSettings.ChannelSetting,
        zone: 1,
        value: { raw: 'FL 50', key: 'FL', value: '50' },
        ip: '192.168.1.123',
        topic: 'prefix/avr_id/main_zone/state',
        payload: JSON.stringify({ channel_setting: { key: 'FL', value: '50' } }),
      },
      {
        key: ReceiverSettings.Volume,
        zone: 2,
        value: { raw: '55', numeric: 55 },
        ip: '192.168.1.123',
        topic: 'prefix/avr_id/zone2/state',
        payload: JSON.stringify({ volume: 55 }),
      },
    ])('should publish to payload $payload to $topic', async (testData) => {
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
      expect(mockPublish).toHaveBeenCalledWith(testData.topic, testData.payload);
    });

    it('should log error if setting cannot be mapped for zone', async () => {
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

      await broadcaster.publish({ key: 9999 as ReceiverSettings, value: { raw: 'C 55', key: 'C', value: '55' }, zone: 2, ip: '192.168.1.123' });

      expect(mockLog).toHaveBeenCalledWith('Cannot map setting 9999');
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
        prefix: 'prefix',
        id: 'avr_id',
        client,
      });
      await broadcaster.publishState(state, 1);
      expect(mockPublish).toHaveBeenCalledWith('prefix/avr_id/main_zone/state', '{"state":{"volume":55}}');
    });
  });
});
