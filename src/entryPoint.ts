#!/usr/bin/env node
import dotenv from 'dotenv';

import { CliParser } from './CliParser';

(async () => {
  dotenv.config();

  if (process.argv.length <= 2 && !process.env.DMQTT_IP) {
    throw new Error('Must set DMQTT_IP environment variable or provide command line parameters');
  }

  if (process.argv.length > 2) {
    await CliParser.run({
      name: 'denon-mqtt',
      version: 'dev',
      args: process.argv,
    });
  } else {
    const args = ['node', 'src/entryPoint.ts', '--mqtt', process.env.DMQTT_HOST ?? 'localhost', '--username', 'user', '--password', 'password'];
    if (process.env.DMQTT_FILE) {
      args.push('-f', process.env.DMQTT_FILE);
    } else {
      args.push('--avr', process.env.DMQTT_IP ?? '192.168.1.34');
    }
    await CliParser.run({
      name: 'denon-mqtt',
      version: 'dev',
      args,
    });
  }
})()
  .then()
  .catch((error) => {
    console.error(error);
  });
