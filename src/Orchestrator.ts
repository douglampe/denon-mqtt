import { connectAsync } from 'mqtt';
import { Telnet } from 'telnet-client';

import { MainParser } from './MainParser';
import { MqttBroadcaster } from './MqttBroadcaster';
import { TelnetBroadcaster } from './TelnetBroadcaster';
import { TelnetListener } from './TelnetListener';
import { ZoneParser } from './ZoneParser';

import dotenv from 'dotenv';

export class Orchestrator {
  public static async run() {
    dotenv.config();

    console.debug('Starting...');

    const mqttHost = process.env.MQTT_HOST ?? 'localhost';
    const mqttPort = parseInt(process.env.MQTT_PORT ?? '1883');

    const mqttClient = await connectAsync(`mqtt://${mqttHost}:${mqttPort}`);

    console.debug('Connected to MQTT');

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

    const telnetListener = new TelnetListener(telnetClient);
    const telnetBroadcaster = new TelnetBroadcaster(telnetClient);

    await telnetBroadcaster.init();

    const mqttBroadcaster = new MqttBroadcaster({
      ...MqttBroadcaster.DefaultOptions,
      client: mqttClient,
    });

    telnetListener.addHandler(new MainParser(mqttBroadcaster));
    telnetListener.addHandler(new ZoneParser(mqttBroadcaster));

    while (true) {
      await telnetListener.read();
    }
  }
}
