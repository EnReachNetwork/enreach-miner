#!/usr/bin/env node
import { Command } from 'commander';
import {registerHelloCommand} from "./commands/hello.js";

const program = new Command();

program
    .name('miner')
    .description('CLI application built with Commander.js')
    .version('0.0.1');

registerHelloCommand(program);


program.parse();
