#!/usr/bin/env node
import dotenv from 'dotenv';

import { CliParser } from './CliParser';

(async () => {
  dotenv.config();

  if (!process.env.AVR_HOST) {
    throw new Error('Must set AVR_HOST environment variable');
  }

  if (process.argv.length > 2) {
    await CliParser.run({
      name: 'denon-mqtt',
      version: 'dev',
      args: process.argv,
    });
  } else {
    await CliParser.run({
      name: 'denon-mqtt',
      version: 'dev',
      args: [
        'node',
        'src/entryPoint.ts',
        '--avr',
        process.env.AVR_HOST ?? '192.168.1.34',
        '--mqtt',
        'localhost',
        '--username',
        'user',
        '--password',
        'password',
        '--zones',
        'Living|Rumpus|Porch',
      ],
    });
  }
})()
  .then()
  .catch((error) => {
    console.error(error);
  });
