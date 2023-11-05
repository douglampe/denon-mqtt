export interface StateHandler {
  updateState: (key: string, value: string) => Promise<void>;
}
