import { Command } from 'commander';
import prompts from 'prompts';
import ora from 'ora';
import chalk from 'chalk';
import { logger } from '../lib/logger.js';
import { loadConfig, configExists } from '../lib/config.js';
import {
    fetchRegistry,
    getComponent,
    getAvailableComponents,
    resolveComponentDependencies,
    getNpmDependencies,
} from '../lib/registry.js';
import { installComponent, installUtils, isComponentInstalled } from '../lib/installer.js';

export const addCommand = new Command('add')
    .description('Add components to your project')
    .argument('[components...]', 'Component names to add')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('-o, --overwrite', 'Overwrite existing files')
    .option('-a, --all', 'Install all available components')
    .action(async (components: string[], options) => {
        logger.blank();

        // Check for config
        if (!(await configExists())) {
            logger.error('No pushui.config.ts found. Run `pushui init` first.');
            process.exit(1);
        }

        const config = await loadConfig();
        const spinner = ora('Fetching component registry...').start();

        try {
            const registry = await fetchRegistry(config.registry);
            spinner.stop();

            const availableComponents = getAvailableComponents(registry);

            // If --all flag, install all components
            if (options.all) {
                components = availableComponents;
            }

            // If no components specified, show interactive selector
            if (components.length === 0) {
                const installed = await Promise.all(
                    availableComponents.map(async (name) => ({
                        name,
                        installed: await isComponentInstalled(name),
                    }))
                );

                const { selected } = await prompts({
                    type: 'multiselect',
                    name: 'selected',
                    message: 'Select components to add',
                    choices: installed.map(({ name, installed }) => ({
                        title: installed ? `${name} ${chalk.dim('(installed)')}` : name,
                        value: name,
                        selected: false,
                    })),
                    hint: '- Space to select, Enter to confirm',
                });

                if (!selected || selected.length === 0) {
                    logger.info('No components selected.');
                    return;
                }

                components = selected;
            }

            // Validate components exist
            const invalidComponents = components.filter((c) => !availableComponents.includes(c));
            if (invalidComponents.length > 0) {
                logger.error(`Unknown components: ${invalidComponents.join(', ')}`);
                logger.blank();
                logger.info('Available components:');
                logger.list(availableComponents);
                process.exit(1);
            }

            // Resolve all dependencies
            const allComponents = new Set<string>();
            for (const name of components) {
                const deps = resolveComponentDependencies(name, registry);
                deps.forEach((d) => allComponents.add(d));
            }

            const componentsToInstall = Array.from(allComponents);

            // Confirm installation
            if (!options.yes && componentsToInstall.length > components.length) {
                logger.info(`Installing ${componentsToInstall.length} components (including dependencies):`);
                logger.list(componentsToInstall);
                logger.blank();

                const { confirm } = await prompts({
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Continue?',
                    initial: true,
                });

                if (!confirm) {
                    logger.info('Installation cancelled.');
                    return;
                }
            }

            // Install utils first (dependency for all components)
            await installUtils(config);

            // Install each component
            logger.blank();
            logger.title(`Installing ${componentsToInstall.length} component(s)...`);
            logger.blank();

            let installedCount = 0;
            for (const componentName of componentsToInstall) {
                const component = getComponent(registry, componentName);
                if (!component) continue;

                const componentSpinner = ora(`Installing ${componentName}...`).start();

                try {
                    const files = await installComponent(componentName, component, config, {
                        overwrite: options.overwrite,
                        registryUrl: config.registry,
                    });

                    if (files.length > 0) {
                        componentSpinner.succeed(`Installed ${componentName}`);
                        installedCount++;
                    } else {
                        componentSpinner.info(`${componentName} (no new files)`);
                    }
                } catch (error) {
                    componentSpinner.fail(`Failed to install ${componentName}`);
                    if (error instanceof Error) {
                        logger.error(error.message);
                    }
                }
            }

            // Show npm dependencies
            const { dependencies, devDependencies } = getNpmDependencies(componentsToInstall, registry);

            logger.blank();
            logger.success(`Installed ${installedCount} component(s)`);

            if (dependencies.length > 0 || devDependencies.length > 0) {
                logger.blank();
                logger.title('Install required dependencies:');
                logger.blank();

                if (dependencies.length > 0) {
                    logger.command(`npm install ${dependencies.join(' ')}`);
                }
                if (devDependencies.length > 0) {
                    logger.command(`npm install -D ${devDependencies.join(' ')}`);
                }
            }

            logger.blank();
        } catch (error) {
            spinner.fail('Failed to fetch registry');
            if (error instanceof Error) {
                logger.error(error.message);
            }
            process.exit(1);
        }
    });
