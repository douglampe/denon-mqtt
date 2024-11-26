import { ReceiverSettings, ReceiverState, StateManager } from 'denon-state-manager';
import { connectAsync } from 'mqtt';

import { MqttBroadcaster } from './MqttBroadcaster';

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

  describe('getStateWithKeys()', () => {
    it('should return object with keys', async () => {
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        publishAsync: mockPublish,
      });
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        ...MqttBroadcaster.DefaultOptions,
        client,
      });
      const state = new ReceiverState();
      state.updateState(ReceiverSettings.Volume, { raw: '50' });
      const result = broadcaster.getStateWithKeys(state.state);
      expect(result).toEqual({
        Volume: { raw: '50' },
      });
    });
  });

  describe('publishState()', () => {
    it('should call send for main zone', async () => {
      const state = new ReceiverState();
      (connectAsync as jest.Mock).mockResolvedValueOnce({
        publishAsync: mockPublish,
      });
      const client = await connectAsync('mqtt://foo:123');
      const broadcaster = new MqttBroadcaster({
        ...MqttBroadcaster.DefaultOptions,
        client,
      });
      await broadcaster.publishState(state, { key: ReceiverSettings.Volume, value: { raw: '50', numeric: 50 } }, 1);
      expect(mockPublish).toHaveBeenCalledWith(
        `${MqttBroadcaster.DefaultOptions.prefix}/volume/${MqttBroadcaster.DefaultOptions.id}_main_zone_volume/state`,
        '50',
      );
    });
  });

  it('should call send for zone 2', async () => {
    const state = new ReceiverState();
    (connectAsync as jest.Mock).mockResolvedValueOnce({
      publishAsync: mockPublish,
    });
    const client = await connectAsync('mqtt://foo:123');
    const broadcaster = new MqttBroadcaster({
      ...MqttBroadcaster.DefaultOptions,
      client,
    });
    await broadcaster.publishState(state, { key: ReceiverSettings.Volume, value: { raw: '50', numeric: 50 } }, 2);
    expect(mockPublish).toHaveBeenCalledWith(`${MqttBroadcaster.DefaultOptions.prefix}/volume/${MqttBroadcaster.DefaultOptions.id}_zone2_volume/state`, '50');
  });

  it('should call send for main zone', async () => {
    const state = new ReceiverState();
    (connectAsync as jest.Mock).mockResolvedValueOnce({
      publishAsync: mockPublish,
    });
    const client = await connectAsync('mqtt://foo:123');
    const broadcaster = new MqttBroadcaster({
      ...MqttBroadcaster.DefaultOptions,
      client,
    });
    await broadcaster.publishState(state, { key: ReceiverSettings.Volume, value: { raw: '50', numeric: 50 } }, 3);
    expect(mockPublish).toHaveBeenCalledWith(`${MqttBroadcaster.DefaultOptions.prefix}/volume/${MqttBroadcaster.DefaultOptions.id}_zone3_volume/state`, '50');
  });
});
