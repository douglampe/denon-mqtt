export class ReceiverState {
  public state: Record<string, string> = {};

  updateState(key: string, value: string): boolean {
    if (this.state[key] !== value) {
      this.state[key] = value;
      return true;
    }
    return false;
  }
}
