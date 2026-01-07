import { z } from 'zod';

/**
 * Zod schema for pushui.config.ts validation
 */
export const configSchema = z.object({
    // Where to install components
    componentPath: z.string().default('src/components/ui'),

    // Style configuration
    style: z
        .object({
            // Style strategy: tailwind-only or tailwind+css
            strategy: z.enum(['tailwind-only', 'tailwind+css']).default('tailwind-only'),
            // CSS output path (only used if strategy is tailwind+css)
            cssPath: z.string().optional(),
        })
        .default({}),

    // Path aliases (must match tsconfig paths)
    aliases: z
        .object({
            components: z.string().default('@/components'),
            lib: z.string().default('@/lib'),
        })
        .default({}),

    // Storybook integration
    storybook: z
        .object({
            enabled: z.boolean().default(false),
            path: z.string().default('src/stories'),
            autoGenerate: z.boolean().default(false),
        })
        .default({}),

    // Registry URL (defaults to GitHub raw)
    registry: z.string().optional(),
});

export type PushUIConfig = z.infer<typeof configSchema>;

/**
 * Default configuration values
 */
export const defaultConfig: PushUIConfig = {
    componentPath: 'src/components/ui',
    style: {
        strategy: 'tailwind-only',
    },
    aliases: {
        components: '@/components',
        lib: '@/lib',
    },
    storybook: {
        enabled: false,
        path: 'src/stories',
        autoGenerate: false,
    },
};

/**
 * Helper function for creating typed config
 */
export function defineConfig(config: Partial<PushUIConfig>): PushUIConfig {
    return configSchema.parse(config);
}
