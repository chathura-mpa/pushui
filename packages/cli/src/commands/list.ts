import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { logger } from '../lib/logger.js';
import { loadConfig } from '../lib/config.js';
import { fetchRegistry, getAvailableComponents } from '../lib/registry.js';
import { isComponentInstalled } from '../lib/installer.js';

export const listCommand = new Command('list')
    .alias('ls')
    .description('List available components')
    .option('-i, --installed', 'Show only installed components')
    .action(async (options) => {
        logger.blank();

        const config = await loadConfig();
        const spinner = ora('Fetching component registry...').start();

        try {
            const registry = await fetchRegistry(config.registry);
            spinner.stop();

            const components = getAvailableComponents(registry);

            // Check installation status for each
            const componentStatus = await Promise.all(
                components.map(async (name) => {
                    const installed = await isComponentInstalled(name);
                    const component = registry.components[name];
                    return {
                        name,
                        installed,
                        description: component.description || '',
                        version: component.version || '',
                    };
                })
            );

            // Filter if --installed flag
            const filteredComponents = options.installed
                ? componentStatus.filter((c) => c.installed)
                : componentStatus;

            if (filteredComponents.length === 0) {
                if (options.installed) {
                    logger.info('No components installed yet.');
                    logger.blank();
                    logger.log('Run `pushui add` to install components.');
                } else {
                    logger.info('No components available in registry.');
                }
                return;
            }

            logger.title('Available Components');
            logger.blank();

            // Display components
            for (const { name, installed, description, version } of filteredComponents) {
                const status = installed ? chalk.green('✓') : chalk.dim('○');
                const versionStr = version ? chalk.dim(` v${version}`) : '';
                const descStr = description ? chalk.dim(` - ${description}`) : '';

                console.log(`  ${status} ${name}${versionStr}${descStr}`);
            }

            // Summary
            const installedCount = componentStatus.filter((c) => c.installed).length;
            const totalCount = componentStatus.length;

            logger.blank();
            logger.log(
                chalk.dim(`${installedCount} installed, ${totalCount - installedCount} available`)
            );
            logger.blank();

            if (installedCount < totalCount) {
                logger.log(chalk.dim('Run `pushui add <component>` to install'));
                logger.blank();
            }
        } catch (error) {
            spinner.fail('Failed to fetch registry');
            if (error instanceof Error) {
                logger.error(error.message);
            }
            process.exit(1);
        }
    });
