import { ParserResult } from './ParserResult';
import { StateHandler } from './StateHandler';
import { ICommandHandler } from './TelnetListener';

export class BaseParser implements ICommandHandler {
  protected prefixMap: Record<string, Array<(data: string) => ParserResult>>;
  protected state: Record<string, string> = {};

  constructor(protected stateHandler: StateHandler) {}

  static parsePassthrough(key: string, value: string): ParserResult {
    return {
      handled: true,
      key,
      value,
    };
  }

  static parseLowerCase(key: string, data: string): ParserResult {
    return {
      handled: true,
      key,
      value: data.toLowerCase(),
    };
  }

  static parseDelimited(key: string, data: string, firstPart: string): ParserResult {
    if (data.startsWith(firstPart)) {
      const parts = data.split(' ');
      return {
        handled: true,
        key,
        value: parts.length > 1 ? parts[1] : '',
      };
    }
    return {
      handled: false,
    };
  }

  static parseList(key: string, data: string, list: string[]): ParserResult {
    if (list.indexOf(data) > -1) {
      return {
        handled: true,
        key,
        value: data,
      };
    }
    return {
      handled: false,
    };
  }

  static parseLongPrefix(key: string, data: string, ending: string) {
    if (data.startsWith(ending)) {
      return {
        handled: true,
        key,
        value: data.substring(ending.length),
      };
    }
    return {
      handled: false,
    };
  }

  addParser(key: string, parser: (data: string) => ParserResult) {
    let parsers: Array<(data: string) => ParserResult> = this.prefixMap[key];
    if (!parsers) {
      parsers = new Array<(data: string) => ParserResult>();
      this.prefixMap[key] = parsers;
    }
    parsers.push(parser);
  }

  addPassthroughParser(options: { prefix: string; key: string }) {
    this.addParser(options.prefix, (data: string) => {
      return BaseParser.parsePassthrough(options.key, data);
    });
  }

  addLowerCaseParser(options: { prefix: string; key: string }) {
    this.addParser(options.prefix, (data: string) => {
      return BaseParser.parseLowerCase(options.key, data);
    });
  }

  addDelimitedParser(options: { prefix: string; key: string; firstPart: string }) {
    this.addParser(options.prefix, (data: string) => {
      return BaseParser.parseDelimited(options.key, data, options.firstPart);
    });
  }

  addListParser(options: { prefix: string; key: string; list: string[] }) {
    this.addParser(options.prefix, (data: string) => {
      return BaseParser.parseList(options.key, data, options.list);
    });
  }

  addLongPrefixParser(options: { prefix: string; key: string; ending: string }) {
    this.addParser(options.prefix, (data: string) => {
      return BaseParser.parseLongPrefix(options.key, data, options.ending);
    });
  }

  public async handle(data: string): Promise<boolean> {
    if (data.length > 2) {
      const prefix = data.substring(0, 2);
      const suffix = data.substring(2);
      const parsers = this.prefixMap[prefix];
      if (parsers !== undefined) {
        for (const parser of parsers) {
          const parserResult = parser(suffix);
          if (parserResult.handled) {
            await this.updateState(parserResult.key!, parserResult.value!);
            return true;
          }
        }
      }
    }

    return false;
  }

  protected async updateState(key: string, value: string) {
    if (this.state[key] !== value) {
      this.state[key] = value;
      await this.stateHandler.updateState(key, value);
    }
  }
}
