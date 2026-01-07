import { z } from 'zod';

/**
 * Component file type
 */
export const componentFileSchema = z.object({
    path: z.string(),
    type: z.enum(['component', 'style', 'story']),
    optional: z.boolean().optional(),
});

export type ComponentFile = z.infer<typeof componentFileSchema>;

/**
 * Component definition in the registry
 */
export const componentSchema = z.object({
    name: z.string(),
    version: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['registry:ui', 'registry:util']),
    files: z.array(z.union([z.string(), componentFileSchema])),
    dependencies: z
        .object({
            npm: z.array(z.string()).optional(),
            components: z.array(z.string()).optional(),
        })
        .optional(),
    devDependencies: z.array(z.string()).optional(),
    registryDependencies: z.array(z.string()).optional(),
});

export type Component = z.infer<typeof componentSchema>;

/**
 * Registry manifest schema
 */
export const registrySchema = z.object({
    version: z.string().optional(),
    components: z.record(componentSchema),
    utils: z.record(componentSchema).optional(),
});

export type Registry = z.infer<typeof registrySchema>;

/**
 * Installed component tracking
 */
export interface InstalledComponent {
    name: string;
    version: string;
    installedAt: string;
    files: string[];
}

export interface InstalledRegistry {
    components: Record<string, InstalledComponent>;
}
