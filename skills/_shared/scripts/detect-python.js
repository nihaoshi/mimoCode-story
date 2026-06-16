#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');

const USAGE = `Usage: node detect-python.js

Detect available Python interpreter on the system.
Tries: python3 → python → py

Output: path to available Python interpreter`;

function tryPython(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const candidates = ['python3', 'python', 'py'];
  
  for (const cmd of candidates) {
    if (tryPython(cmd)) {
      console.log(cmd);
      process.exit(0);
    }
  }
  
  console.error('Error: No Python interpreter found');
  process.exit(1);
}

main();
