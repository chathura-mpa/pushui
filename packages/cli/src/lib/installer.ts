import fs from 'fs-extra';
import path from 'path';
import { type PushUIConfig } from '../types/config.js';
import { type Component, type InstalledRegistry, type InstalledComponent } from '../types/registry.js';
import { fetchComponentFile, resolveComponentDependencies, type Registry } from './registry.js';
import { transformComponent, toKebabCase } from './transformer.js';
import { getComponentPath, getLibPath } from './config.js';
import { logger } from './logger.js';

// Installed components tracking file
const INSTALLED_FILE = '.pushui/installed.json';

/**
 * Install a component to the target directory
 */
export async function installComponent(
    componentName: string,
    component: Component,
    config: PushUIConfig,
    options: {
        overwrite?: boolean;
        registryUrl?: string;
        skipPrompt?: boolean;
    } = {}
): Promise<string[]> {
    const componentPath = getComponentPath(config);
    const installedFiles: string[] = [];

    await fs.ensureDir(componentPath);

    for (const file of component.files) {
        const fileName = typeof file === 'string' ? file : file.path;
        const fileType = typeof file === 'string' ? 'component' : file.type;
        const isOptional = typeof file === 'string' ? false : file.optional;

        // Skip optional files based on config
        if (fileType === 'style' && config.style.strategy === 'tailwind-only') {
            continue;
        }
        if (fileType === 'story' && !config.storybook.enabled) {
            continue;
        }

        const targetFileName = fileName.startsWith(componentName)
            ? fileName
            : `${toKebabCase(componentName)}${path.extname(fileName)}`;
        const targetPath = path.join(componentPath, targetFileName);

        // Check if file exists
        if ((await fs.pathExists(targetPath)) && !options.overwrite) {
            logger.warn(`Skipping ${targetFileName} (already exists)`);
            continue;
        }

        try {
            // Fetch the file content
            const content = await fetchComponentFile(componentName, fileName, options.registryUrl);

            // Transform the content
            const transformedContent = transformComponent(content, config);

            // Write the file
            await fs.writeFile(targetPath, transformedContent);
            installedFiles.push(targetPath);
            logger.file(targetPath);
        } catch (error) {
            if (!isOptional) {
                throw error;
            }
            // Skip optional files that fail to fetch
        }
    }

    // Track installation
    await trackInstallation(componentName, component, installedFiles);

    return installedFiles;
}

/**
 * Install the utils file if not present
 */
export async function installUtils(config: PushUIConfig): Promise<boolean> {
    const libPath = getLibPath(config);
    const utilsPath = path.join(libPath, 'utils.ts');

    if (await fs.pathExists(utilsPath)) {
        return false; // Already exists
    }

    await fs.ensureDir(libPath);

    const utilsContent = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

    await fs.writeFile(utilsPath, utilsContent);
    logger.success(`Created ${utilsPath}`);
    return true;
}

/**
 * Track installed components
 */
async function trackInstallation(
    componentName: string,
    component: Component,
    files: string[]
): Promise<void> {
    const cwd = process.cwd();
    const installedPath = path.join(cwd, INSTALLED_FILE);

    let installed: InstalledRegistry = { components: {} };

    if (await fs.pathExists(installedPath)) {
        try {
            installed = await fs.readJson(installedPath);
        } catch {
            // Ignore read errors, start fresh
        }
    }

    const installedComponent: InstalledComponent = {
        name: componentName,
        version: component.version || '1.0.0',
        installedAt: new Date().toISOString(),
        files,
    };

    installed.components[componentName] = installedComponent;

    await fs.ensureDir(path.dirname(installedPath));
    await fs.writeJson(installedPath, installed, { spaces: 2 });
}

/**
 * Get installed components
 */
export async function getInstalledComponents(): Promise<InstalledRegistry> {
    const cwd = process.cwd();
    const installedPath = path.join(cwd, INSTALLED_FILE);

    if (!(await fs.pathExists(installedPath))) {
        return { components: {} };
    }

    try {
        return await fs.readJson(installedPath);
    } catch {
        return { components: {} };
    }
}

/**
 * Check if a component is installed
 */
export async function isComponentInstalled(componentName: string): Promise<boolean> {
    const installed = await getInstalledComponents();
    return componentName in installed.components;
}
