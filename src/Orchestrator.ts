import dotenv from 'dotenv';
import { connect, connectAsync } from 'mqtt';
import { Telnet } from 'telnet-client';

import { MqttBroadcaster } from './MqttBroadcaster';
import { MqttListener } from './MqttListener';
import { StateParser } from './StateParser';
import { TelnetBroadcaster } from './TelnetBroadcaster';
import { TelnetListener } from './TelnetListener';

export class Orchestrator {
  public static async run() {
    dotenv.config();

    console.debug('Starting...');

    const avrHost = process.env.AVR_HOST;

    if (!avrHost) {
      throw new Error('AVR host address must be set as environment variable AVR_HOST');
    }

    const telnetClient = new Telnet();
    await telnetClient.connect({
      host: avrHost,
      negotiationMandatory: false,
      timeout: 5000,
      irs: '\r',
      ors: '\r',
      sendTimeout: undefined,
    });

    console.debug('Connected to Receiver');

    const mqttHost = process.env.MQTT_HOST ?? 'localhost';
    const mqttPort = parseInt(process.env.MQTT_PORT ?? '1883');
    const mqttUser = process.env.MQTT_USER ?? 'user';
    const mqttPassword = process.env.MQTT_PWD ?? 'password';

    const mqttClient = await connectAsync(`mqtt://${mqttHost}:${mqttPort}`, { username: mqttUser, password: mqttPassword });

    Orchestrator.handleExit(() => {
      console.debug('Cleaning up...');
      try {
        mqttClient.end();
      } catch (_error) {}

      telnetClient
        .destroy()
        .then(() => {
          process.exit();
        })
        .catch(() => {
          process.exit();
        });
    });

    const telnetListener = new TelnetListener(telnetClient);
    const telnetBroadcaster = new TelnetBroadcaster(telnetClient);

    const mqttListener = new MqttListener({
      ...MqttListener.DefaultOptions,
      client: mqttClient,
      broadcaster: telnetBroadcaster,
    });

    const mqttBroadcaster = new MqttBroadcaster({
      ...MqttBroadcaster.DefaultOptions,
      client: mqttClient,
    });

    mqttClient.on('error', (err) => {
      console.error(err);
      process.exit();
    });

    console.debug('Connected to MQTT');

    await mqttListener.listen();

    telnetListener.addHandler(new StateParser(mqttBroadcaster));

    await telnetBroadcaster.init();

    while (true) {
      await telnetListener.read();
    }
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
