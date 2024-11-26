#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const pkgInfo = require('../package.json');
const { CLIParser } = require('../dist/src/CLIParser.js');

CLIParser.run({ ...pkgInfo, args: process.argv })
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
