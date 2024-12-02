import { connectAsync, MqttClient } from 'mqtt';

import { MqttManager } from './MqttManager';
import { ReceiverConfig } from './ReceiverConfig';
import { ReceiverManager } from './ReceiverManager';

export interface OrchestratorOptions {
  receivers: ReceiverConfig[];
  mqtt: string;
  port: string;
  username: string;
  password: string;
  prefix: string;
}

export class Orchestrator {
  private mqttClient: MqttClient;
  private mqttManagers: MqttManager[] = [];
  private receiverManagers: ReceiverManager[] = [];

  constructor(private options: OrchestratorOptions) {}

  async init() {
    this.mqttClient = await connectAsync(`mqtt://${this.options.mqtt}:${this.options.port}`, {
      username: this.options.username,
      password: this.options.password,
    });

    console.debug('Connected to MQTT');

    this.mqttClient.on('error', (err) => {
      console.error(err);
      process.exit();
    });

    for await (const config of this.options.receivers) {
      await this.addReceiver(config);
    }
  }

  async addReceiver(receiver: ReceiverConfig) {
    console.debug(`Adding receiver ${receiver.name}`);

    const mqttManager = new MqttManager(this.mqttClient, {
      host: this.options.mqtt,
      port: parseInt(this.options.port),
      username: this.options.username,
      password: this.options.password,
      prefix: this.options.prefix,
      id: receiver.id,
      receiver,
    });

    this.mqttManagers.push(mqttManager);

    const receiverManager = new ReceiverManager(receiver, mqttManager);

    this.receiverManagers.push(receiverManager);

    await mqttManager.connect(receiverManager);

    await receiverManager.connect();

    await receiverManager.query();
  }

  async start() {
    while (true) {
      await Promise.all(this.receiverManagers.map((r) => r.read()));
    }
  }

  async cleanup() {
    const promises = [] as Promise<void>[];

    for await (const mqttManager of this.mqttManagers) {
      promises.push(mqttManager.disconnect());
    }

    for await (const receiverManager of this.receiverManagers) {
      promises.push(receiverManager.disconnect());
    }

    await Promise.all(promises);
  }

  public static async run(options: OrchestratorOptions) {
    console.debug('Starting...');

    if (options.receivers.length === 0) {
      throw new Error('At least one AVR config must be provided');
    }

    const orchestrator = new Orchestrator(options);

    await orchestrator.init();

    await orchestrator.start();

    Orchestrator.handleExit(() => {
      console.debug('Cleaning up...');

      orchestrator
        .cleanup()
        .then(() => {
          process.exit();
        })
        .catch(() => {
          process.exit();
        });
    });
  }

  static handleExit(callback: () => void) {
    function exitHandler(options: { exit?: boolean; cleanup?: boolean }, exitCode?: number) {
      if (options.cleanup) {
        callback();
      }
      if (exitCode || exitCode === 0) console.log(exitCode);
      if (options.exit) process.exit();
    }

    // do something when app is closing
    process.on('exit', exitHandler.bind(null, { cleanup: true }));

    // catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, { exit: true }));

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
    process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

    // catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
  }
}
