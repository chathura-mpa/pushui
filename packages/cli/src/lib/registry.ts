import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { registrySchema, type Registry, type Component } from '../types/registry.js';
import { logger } from './logger.js';

// Default registry URL - points to GitHub raw
const DEFAULT_REGISTRY_URL =
    'https://raw.githubusercontent.com/chathura-mpa/pushui/main/registry';

// Cache directory for registry
const CACHE_DIR = path.join(os.homedir(), '.pushui', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'registry.json');
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch the registry manifest from remote or cache
 */
export async function fetchRegistry(registryUrl?: string): Promise<Registry> {
    const baseUrl = registryUrl || DEFAULT_REGISTRY_URL;

    // Check cache first
    const cached = await getCachedRegistry();
    if (cached) {
        return cached;
    }

    try {
        const url = `${baseUrl}/index.json`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch registry: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const registry = registrySchema.parse(data);

        // Cache the registry
        await cacheRegistry(registry);

        return registry;
    } catch (error) {
        // Try to use stale cache if fetch fails
        const staleCache = await getCachedRegistry(true);
        if (staleCache) {
            logger.warn('Using cached registry (fetch failed)');
            return staleCache;
        }
        throw error;
    }
}

/**
 * Get cached registry if valid
 */
async function getCachedRegistry(ignoreExpiry = false): Promise<Registry | null> {
    try {
        if (!(await fs.pathExists(CACHE_FILE))) {
            return null;
        }

        const stat = await fs.stat(CACHE_FILE);
        const age = Date.now() - stat.mtimeMs;

        if (!ignoreExpiry && age > CACHE_TTL) {
            return null; // Cache expired
        }

        const data = await fs.readJson(CACHE_FILE);
        return registrySchema.parse(data);
    } catch {
        return null;
    }
}

/**
 * Cache the registry to disk
 */
async function cacheRegistry(registry: Registry): Promise<void> {
    try {
        await fs.ensureDir(CACHE_DIR);
        await fs.writeJson(CACHE_FILE, registry, { spaces: 2 });
    } catch {
        // Ignore cache write errors
    }
}

/**
 * Fetch a component file from the registry
 */
export async function fetchComponentFile(
    componentName: string,
    fileName: string,
    registryUrl?: string
): Promise<string> {
    const baseUrl = registryUrl || DEFAULT_REGISTRY_URL;
    const url = `${baseUrl}/components/${componentName}/${fileName}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName}: ${response.status}`);
    }

    return response.text();
}

/**
 * Get a component from the registry
 */
export function getComponent(registry: Registry, name: string): Component | null {
    return registry.components[name] || null;
}

/**
 * Get all available component names
 */
export function getAvailableComponents(registry: Registry): string[] {
    return Object.keys(registry.components);
}

/**
 * Resolve component dependencies recursively
 */
export function resolveComponentDependencies(
    componentName: string,
    registry: Registry,
    resolved: Set<string> = new Set()
): string[] {
    if (resolved.has(componentName)) {
        return [];
    }

    const component = getComponent(registry, componentName);
    if (!component) {
        return [];
    }

    resolved.add(componentName);

    // Resolve registry dependencies (other components)
    const registryDeps = component.registryDependencies || [];
    for (const dep of registryDeps) {
        resolveComponentDependencies(dep, registry, resolved);
    }

    // Resolve component dependencies
    const componentDeps = component.dependencies?.components || [];
    for (const dep of componentDeps) {
        resolveComponentDependencies(dep, registry, resolved);
    }

    return Array.from(resolved);
}

/**
 * Get all npm dependencies for a set of components
 */
export function getNpmDependencies(
    componentNames: string[],
    registry: Registry
): { dependencies: string[]; devDependencies: string[] } {
    const deps = new Set<string>();
    const devDeps = new Set<string>();

    for (const name of componentNames) {
        const component = getComponent(registry, name);
        if (!component) continue;

        component.dependencies?.npm?.forEach((d) => deps.add(d));
        component.devDependencies?.forEach((d) => devDeps.add(d));
    }

    return {
        dependencies: Array.from(deps),
        devDependencies: Array.from(devDeps),
    };
}
