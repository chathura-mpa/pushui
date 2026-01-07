import fs from 'fs-extra';
import path from 'path';
import { pathToFileURL } from 'url';
import { configSchema, defaultConfig, type PushUIConfig } from '../types/config.js';
import { logger } from './logger.js';

const CONFIG_FILE_NAMES = ['pushui.config.ts', 'pushui.config.js', 'pushui.config.mjs'];

/**
 * Find the config file in the current directory
 */
export async function findConfigFile(cwd: string = process.cwd()): Promise<string | null> {
    for (const fileName of CONFIG_FILE_NAMES) {
        const filePath = path.join(cwd, fileName);
        if (await fs.pathExists(filePath)) {
            return filePath;
        }
    }
    return null;
}

/**
 * Check if config file exists
 */
export async function configExists(cwd: string = process.cwd()): Promise<boolean> {
    return (await findConfigFile(cwd)) !== null;
}

/**
 * Load and validate the config file
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<PushUIConfig> {
    const configPath = await findConfigFile(cwd);

    if (!configPath) {
        logger.warn('No pushui.config.ts found, using defaults');
        return defaultConfig;
    }

    try {
        // For TypeScript files, we need to use dynamic import
        // In production, the config should be transpiled or we use tsx
        const configUrl = pathToFileURL(configPath).href;
        const configModule = await import(configUrl);
        const rawConfig = configModule.default || configModule;

        // Validate with Zod
        const validatedConfig = configSchema.parse(rawConfig);
        return validatedConfig;
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Failed to load config: ${error.message}`);
        }
        logger.warn('Using default configuration');
        return defaultConfig;
    }
}

/**
 * Get the resolved component path
 */
export function getComponentPath(config: PushUIConfig, cwd: string = process.cwd()): string {
    return path.resolve(cwd, config.componentPath);
}

/**
 * Get the resolved lib/utils path
 */
export function getLibPath(config: PushUIConfig, cwd: string = process.cwd()): string {
    // Extract the actual path from the alias (e.g., '@/lib' -> 'src/lib')
    const libAlias = config.aliases.lib;
    const actualPath = libAlias.replace('@/', 'src/');
    return path.resolve(cwd, actualPath);
}
