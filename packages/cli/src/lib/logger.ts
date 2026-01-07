import chalk from 'chalk';

/**
 * Simple logger utility for consistent CLI output
 */
export const logger = {
    info: (message: string) => {
        console.log(chalk.blue('ℹ'), message);
    },

    success: (message: string) => {
        console.log(chalk.green('✓'), message);
    },

    warn: (message: string) => {
        console.log(chalk.yellow('⚠'), message);
    },

    error: (message: string) => {
        console.log(chalk.red('✖'), message);
    },

    log: (message: string) => {
        console.log(message);
    },

    blank: () => {
        console.log();
    },

    // For command suggestions
    command: (cmd: string) => {
        console.log(chalk.cyan(`  $ ${cmd}`));
    },

    // For file paths
    file: (filePath: string) => {
        console.log(chalk.dim(`  → ${filePath}`));
    },

    // For headers/titles
    title: (text: string) => {
        console.log(chalk.bold(text));
    },

    // For lists
    list: (items: string[]) => {
        items.forEach((item) => {
            console.log(chalk.dim('  •'), item);
        });
    },
};
