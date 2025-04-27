import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';

import { Orchestrator, OrchestratorOptions } from './Orchestrator';

export class CliParser {
  public static isTest: boolean;
  public static log: (message: any) => void = console.log;

  public static async run(options: { name: string; version: string; args: string[] }) {
    const program = new Command();

    if (CliParser.isTest) {
      program.exitOverride().configureOutput({
        writeOut: CliParser.log,
        writeErr: CliParser.log,
        getOutHelpWidth: () => 160,
        getErrHelpWidth: () => 160,
      });
    }

    program.name(options.name).version(options.version, '-i, --info', 'Display current version number');

    program
      .option('-f, --file <file>', 'Get configuration from JSON file', process.env.DMQTT_FILE)
      .option('-m, --mqtt <url>', 'MQTT URL', process.env.DMQTT_HOST ?? 'localhost')
      .option('-u, --username <username>', 'MQTT Username', process.env.DMQTT_USER ?? 'user')
      .option('-p, --password <password>', 'MQTT Password', process.env.DMQTT_PASSWORD ?? 'password')
      .option('--port', 'MQTT Port <port>', process.env.DMQTT_PORT ?? '1883')
      .option('--prefix', 'MQTT Topic Prefix <prefix>', process.env.DMQTT_PREFIX ?? 'denon')
      .option('-a, --avr <list>', 'Comma-separated list of AVR IP addresses', process.env.DMQTT_IP)
      .option('--name <list>', 'Comma-separated list of AVR friendly names', process.env.DMQTT_NAME ?? 'Home Theater')
      .option('--id <list>', 'Comma-separated list of AVR unique IDs', process.env.DMQTT_ID ?? 'denon')
      .option('--zones <list>', 'Comma-separated list of | separated AVR zone names', process.env.DMQTT_ZONES ?? 'Main|Zone 2')
      .action(CliParser.start);

    await program.parseAsync(options.args);
  }

  public static async start(_opts: any, command: Command) {
    const opts = command.optsWithGlobals();

    const options: OrchestratorOptions = {
      ...(opts as OrchestratorOptions),
      receivers: [],
    };

    if (opts.file) {
      const file = path.resolve(opts.file);
      const stat = await fs.stat(file);
      if (!stat.isFile()) {
        throw new Error(`File ${opts.file} not found (path: ${file})`);
      }

      try {
        const json = await fs.readFile(file);
        const fileConfig = JSON.parse(json.toString());
        for (const config of fileConfig) {
          options.receivers.push(config);
        }
      } catch (err) {
        throw new Error(`Error parsing file ${opts.file}: ${err}`);
      }
    } else {
      const avrHosts = opts.avr.split(',');
      const avrNames = opts.name.split(',');
      const avrIds = opts.id.split(',');
      const zonesLists = opts.zones.split(',');
      const zones = zonesLists.map((z: any) => z.split('|'));

      if (avrHosts.length + avrNames.length + avrIds.length + zones.length !== avrHosts.length * 4) {
        throw new Error('--avr, --name, --id, and --zones lists must be the same length.');
      }

      for (let i = 0; i < avrHosts.length; i++) {
        options.receivers.push({
          id: avrIds[i],
          name: avrNames[i],
          ip: avrHosts[i],
          zones: zones[i],
        });
      }
    }

    return Orchestrator.run(options);
  }
}
