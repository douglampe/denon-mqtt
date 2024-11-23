import { ReceiverState, StateManager } from 'denon-state-manager';

import { MqttBroadcaster } from './MqttBroadcaster';
import { ICommandHandler } from './TelnetListener';

export class StateParser implements ICommandHandler {
  private broadcaster: MqttBroadcaster;
  private stateManager: StateManager;

  constructor(broadcaster: MqttBroadcaster) {
    this.broadcaster = broadcaster;
    this.stateManager = new StateManager({ mainState: new ReceiverState(), zone2State: new ReceiverState(), zone3State: new ReceiverState() });
  }

  public async handle(data: string): Promise<boolean> {
    this.stateManager.handleCommand(data);
    if (await this.handleUpdate(this.stateManager.mainState)) {
      return true;
    } else if (this.stateManager.zone2State && (await this.handleUpdate(this.stateManager.zone2State, 2))) {
      return true;
    } else if (this.stateManager.zone3State && (await this.handleUpdate(this.stateManager.zone3State, 3))) {
      return true;
    }

    return false;
  }

  private async handleUpdate(state: ReceiverState, zone?: number): Promise<boolean> {
    if (state.isUpdated()) {
      const command = state.popUpdated();
      if (command) {
        command.value.zone = zone;
        await this.broadcaster.updateState(command);
        return true;
      }
    }
    return false;
  }
}
