# PushUI

A component library CLI built with Wix Design System patterns and Tailwind CSS.

## Installation

### For Team Members (Recommended)

Add to your project's `.npmrc`:
```
@marketpushapps:registry=https://npm.pkg.github.com
```

Then authenticate once:
```bash
npm login --scope=@marketpushapps --registry=https://npm.pkg.github.com
```

### Usage

Initialize in your Wix CLI project:
```bash
npx @marketpushapps/pushui init
```

Add components:
```bash
npx @marketpushapps/pushui add button
npx @marketpushapps/pushui add card input
```

Or use the interactive selector:
```bash
npx @marketpushapps/pushui add
```

List available components:
```bash
npx @marketpushapps/pushui list
```

## Configuration

After running `init`, a `pushui.config.ts` file will be created:

```typescript
import { defineConfig } from '@marketpushapps/pushui';

export default defineConfig({
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
});
```

## Available Components

- **Button** - Versatile button with multiple variants and sizes
- **Card** - Flexible card container with header, content, and footer
- **Input** - Styled input component with various states

## Development

### Project Structure

```
packages/
├── cli/                 # CLI tool (@marketpushapps/pushui)
│   └── src/
│       ├── commands/    # CLI commands (init, add, list)
│       ├── lib/         # Utilities (config, registry, installer)
│       └── types/       # TypeScript types
└── ui/                  # (Future) Published component library

registry/
├── components/          # Component source files
│   ├── button/
│   ├── card/
│   └── input/
└── index.json          # Registry manifest
```

### Local Development

```bash
# Install dependencies
npm install

# Run CLI directly with tsx
cd packages/cli
npx tsx src/index.ts init
npx tsx src/index.ts add button

# Or use the development script
./pushui-dev.sh init
./pushui-dev.sh add button
```

### Building

```bash
cd packages/cli
npm run build
```

### Publishing

1. Update version in `packages/cli/package.json`
2. Build: `npm run build`
3. Publish: `npm publish`

Or use GitHub Actions (automatic on tag push):
```bash
git tag v1.0.0
git push origin v1.0.0
```

## License

MIT