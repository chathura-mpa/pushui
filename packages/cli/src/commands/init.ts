import { Command } from 'commander';
import prompts from 'prompts';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../lib/logger.js';
import { configExists } from '../lib/config.js';
import { defaultConfig, type PushUIConfig } from '../types/config.js';

export const initCommand = new Command('init')
    .description('Initialize pushui in your project')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .option('-f, --force', 'Overwrite existing config')
    .action(async (options) => {
        logger.blank();
        logger.title('🚀 Initializing PushUI');
        logger.blank();

        const cwd = process.cwd();

        // Check for package.json
        if (!(await fs.pathExists(path.join(cwd, 'package.json')))) {
            logger.error('No package.json found. Please run this in a project directory.');
            process.exit(1);
        }

        // Check for existing config
        if ((await configExists()) && !options.force) {
            const { overwrite } = await prompts({
                type: 'confirm',
                name: 'overwrite',
                message: 'pushui.config.ts already exists. Overwrite?',
                initial: false,
            });

            if (!overwrite) {
                logger.info('Initialization cancelled.');
                return;
            }
        }

        let config: Partial<PushUIConfig> = {};

        if (!options.yes) {
            // Interactive prompts
            const responses = await prompts([
                {
                    type: 'text',
                    name: 'componentPath',
                    message: 'Where should components be installed?',
                    initial: defaultConfig.componentPath,
                },
                {
                    type: 'select',
                    name: 'styleStrategy',
                    message: 'How do you want to handle styles?',
                    choices: [
                        { title: 'Tailwind only', value: 'tailwind-only' },
                        { title: 'Tailwind + CSS files', value: 'tailwind+css' },
                    ],
                    initial: 0,
                },
                {
                    type: 'confirm',
                    name: 'storybookEnabled',
                    message: 'Enable Storybook integration?',
                    initial: false,
                },
            ]);

            config = {
                componentPath: responses.componentPath,
                style: {
                    strategy: responses.styleStrategy,
                },
                storybook: {
                    enabled: responses.storybookEnabled,
                    autoGenerate: responses.storybookEnabled,
                },
            };
        }

        const spinner = ora('Creating configuration...').start();

        try {
            // Merge with defaults
            const finalConfig = { ...defaultConfig, ...config };

            // Generate config file content
            const configContent = generateConfigFile(finalConfig);
            await fs.writeFile(path.join(cwd, 'pushui.config.ts'), configContent);
            spinner.succeed('Created pushui.config.ts');

            // Create component directory
            const componentDir = path.join(cwd, finalConfig.componentPath);
            await fs.ensureDir(componentDir);
            logger.success(`Created ${finalConfig.componentPath}`);

            // Create lib/utils.ts
            const libPath = path.join(cwd, 'src/lib');
            const utilsPath = path.join(libPath, 'utils.ts');

            if (!(await fs.pathExists(utilsPath))) {
                await fs.ensureDir(libPath);
                await fs.writeFile(utilsPath, generateUtilsFile());
                logger.success('Created src/lib/utils.ts');
            }

            // Create .pushui directory
            await fs.ensureDir(path.join(cwd, '.pushui'));

            logger.blank();
            logger.success('PushUI initialized successfully!');
            logger.blank();
            logger.title('Next steps:');
            logger.blank();
            logger.log('  1. Install required dependencies:');
            logger.command('npm install clsx tailwind-merge class-variance-authority');
            logger.blank();
            logger.log('  2. Add components:');
            logger.command('npx pushui add button');
            logger.blank();
        } catch (error) {
            spinner.fail('Initialization failed');
            if (error instanceof Error) {
                logger.error(error.message);
            }
            process.exit(1);
        }
    });

/**
 * Generate the pushui.config.ts file content
 */
function generateConfigFile(config: PushUIConfig): string {
    return `import { defineConfig } from '@marketpushapps/pushui';

export default defineConfig({
  // Where to install components
  componentPath: '${config.componentPath}',

  // Style configuration
  style: {
    strategy: '${config.style.strategy}',${config.style.strategy === 'tailwind+css'
            ? `
    cssPath: '${config.style.cssPath || 'src/styles/components'}',`
            : ''
        }
  },

  // Path aliases (should match your tsconfig.json paths)
  aliases: {
    components: '${config.aliases.components}',
    lib: '${config.aliases.lib}',
  },

  // Storybook integration
  storybook: {
    enabled: ${config.storybook.enabled},
    path: '${config.storybook.path}',
    autoGenerate: ${config.storybook.autoGenerate},
  },
});
`;
}

/**
 * Generate the utils.ts file content
 */
function generateUtilsFile(): string {
    return `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 * Use this in components: cn('base-classes', conditionalClass && 'class', props.className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
}
