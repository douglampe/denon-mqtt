import { BaseParser } from './BaseParser';

describe('BaseParser', () => {
  describe('Static Methods', () => {
    describe('parsePassthrough', () => {
      it('should return key and value and handled: true', () => {
        expect(BaseParser.parsePassthrough('foo', 'bar')).toEqual({ key: 'foo', value: 'bar', handled: true });
      });
    });

    describe('parseLowerCase', () => {
      it('should return key and value converted to lowercase and handled: true', () => {
        expect(BaseParser.parseLowerCase('foo', 'BAR')).toEqual({ key: 'foo', value: 'bar', handled: true });
      });
    });

    describe('parseDelimited', () => {
      it('should return key and value split with space delimiter and handled: true if beginning of value matches firstPart', () => {
        expect(BaseParser.parseDelimited('foo', 'bar123 456', 'bar')).toEqual({ key: 'foo', value: '456', handled: true });
      });

      it('should return handled: false if beginning of value does not match firstPart', () => {
        expect(BaseParser.parseDelimited('foo', 'bar123 456', 'baz')).toEqual({ handled: false });
      });
    });

    describe('parseList', () => {
      it('should return key and value and handled: true if value is found in list', () => {
        expect(BaseParser.parseList('foo', 'bar', ['bar'])).toEqual({ key: 'foo', value: 'bar', handled: true });
      });

      it('should return handled: false if value is not found in list', () => {
        expect(BaseParser.parseList('foo', 'bar', ['baz'])).toEqual({ handled: false });
      });
    });

    describe('parseLongPrefix', () => {
      it('should return key and last portion of value following ending value and handled: true if value starts with ending value', () => {
        expect(BaseParser.parseLongPrefix('foo', 'bar123', 'bar')).toEqual({ key: 'foo', value: '123', handled: true });
      });

      it('should return handled: false if value does not start with ending', () => {
        expect(BaseParser.parseLongPrefix('foo', 'bar', 'baz')).toEqual({ handled: false });
      });
    });
  });
});
