import type { PushUIConfig } from '../types/config.js';

/**
 * Placeholder tokens used in component templates
 */
const PLACEHOLDERS = {
    ALIAS_COMPONENTS: '__ALIAS_COMPONENTS__',
    ALIAS_LIB: '__ALIAS_LIB__',
    COMPONENT_NAME: '__COMPONENT_NAME__',
    IMPORT_CSS: '// __IMPORT_CSS__',
} as const;

/**
 * Transform component content by replacing placeholders with config values
 */
export function transformComponent(content: string, config: PushUIConfig): string {
    let result = content;

    // Replace alias placeholders
    result = result.replace(new RegExp(PLACEHOLDERS.ALIAS_COMPONENTS, 'g'), config.aliases.components);
    result = result.replace(new RegExp(PLACEHOLDERS.ALIAS_LIB, 'g'), config.aliases.lib);

    // Handle CSS import based on style strategy
    if (config.style.strategy === 'tailwind+css') {
        // CSS imports are kept as-is (they're actual imports, not placeholders)
    } else {
        // Remove CSS import placeholder comment
        result = result.replace(new RegExp(`${PLACEHOLDERS.IMPORT_CSS}.*\n?`, 'g'), '');
    }

    return result;
}

/**
 * Transform a component name to PascalCase
 */
export function toPascalCase(str: string): string {
    return str
        .split(/[-_\s]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Transform a component name to kebab-case
 */
export function toKebabCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

/**
 * Transform CSS content for Tailwind v4
 */
export function transformCssForTailwindV4(content: string): string {
    // Tailwind v4 uses @theme instead of @layer base for custom properties
    // This function can be extended to handle v3 -> v4 migrations if needed
    return content;
}

/**
 * Generate the CSS import statement for a component
 */
export function generateCssImport(componentName: string): string {
    return `import './${toKebabCase(componentName)}.css';`;
}
