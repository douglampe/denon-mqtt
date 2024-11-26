#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const pkgInfo = require('../package.json');
const { CliParser } = require('../dist/CliParser.js');

CliParser.run({ ...pkgInfo, args: process.argv })
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });