import dotenv from 'dotenv';

import { Orchestrator } from './Orchestrator';
import { ReceiverConfig } from './ReceiverConfig';

(async () => {
  dotenv.config();

  const receivers = [
    {
      id: 'denon',
      name: 'Home Theater',
      ip: process.env.AVR_HOST,
    },
  ] as ReceiverConfig[];

  await Orchestrator.run({
    receivers,
    mqtt: process.env.MQTT_HOST ?? 'localhost',
    port: process.env.MQTT_PORT ?? '1883',
    username: process.env.MQTT_USER ?? 'user',
    password: process.env.MQTT_PASSWORD ?? 'password',
    prefix: 'denon',
  });
})()
  .then()
  .catch((error) => {
    console.error(error);
  });
