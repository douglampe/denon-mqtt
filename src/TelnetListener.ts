import { Telnet } from 'telnet-client';

export interface ICommandHandler {
  handle: (data: string | null) => Promise<boolean>;
}

export class TelnetListener {
  private client: Telnet;
  private handlers: Array<ICommandHandler> = [];

  constructor(client: Telnet) {
    this.client = client;
  }

  public addHandler(handler: ICommandHandler): void {
    this.handlers.push(handler);
  }

  async read(): Promise<void> {
    const data = await this.client.nextData();
    const lines = data?.split('\r') ?? [];

    for (const line of lines) {
      let handled = false;
      for await (const handler of this.handlers) {
        if (line !== '') {
          console.debug('Received:', line);
          handled = await handler.handle(line);
          if (handled) {
            break;
          }
        }
      }
      if (!handled && line != '') {
        console.debug('Unhandled:', line);
      }
    }
  }
}
