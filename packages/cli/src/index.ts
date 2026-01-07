#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';

const program = new Command();

program
    .name('pushui')
    .description('Add predesigned UI components to your Wix CLI project')
    .version('1.0.0');

// Register commands
program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(listCommand);

// Error handling
program.exitOverride();

try {
    await program.parseAsync(process.argv);
} catch (error) {
    if (error instanceof Error && error.message !== 'process.exit') {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
    }
}