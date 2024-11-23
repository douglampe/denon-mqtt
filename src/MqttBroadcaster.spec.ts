import { ReceiverSettings } from 'denon-state-manager';

import { MqttBroadcaster } from './MqttBroadcaster';

describe('MqttBroadcaster', () => {
  const mockPublish = jest.fn();
  const broadcaster = new MqttBroadcaster({
    ...MqttBroadcaster.DefaultOptions,
    cb: mockPublish,
  });

  describe('updateState()', () => {
    it('should call send for main zone', async () => {
      await broadcaster.updateState({ key: ReceiverSettings.Volume, value: { raw: '50', numeric: 50 } });
      expect(mockPublish).toHaveBeenCalledWith(
        `${MqttBroadcaster.DefaultOptions.prefix}/${MqttBroadcaster.DefaultOptions.id}/state`,
        '{"Volume": {"raw":"50","numeric":50}}',
      );
    });
  });

  it('should call send for zone 2', async () => {
    await broadcaster.updateState({ key: ReceiverSettings.Volume, value: { raw: '50', numeric: 50, zone: 2 } });
    expect(mockPublish).toHaveBeenCalledWith(
      `${MqttBroadcaster.DefaultOptions.prefix}/${MqttBroadcaster.DefaultOptions.id}/state`,
      '{"Volume": {"raw":"50","numeric":50,"zone":2}}',
    );
  });

  it('should call send for main zone', async () => {
    await broadcaster.updateState({ key: ReceiverSettings.Volume, value: { raw: '50', numeric: 50, zone: 3 } });
    expect(mockPublish).toHaveBeenCalledWith(
      `${MqttBroadcaster.DefaultOptions.prefix}/${MqttBroadcaster.DefaultOptions.id}/state`,
      '{"Volume": {"raw":"50","numeric":50,"zone":3}}',
    );
  });
});
