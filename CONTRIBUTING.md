# Contributing to MPA UI Library

Thank you for your interest in contributing to the MPA UI Library! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ui-blueprint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run without building (Development Mode)**
   ```bash
   # Option 1: Use tsx directly
   cd packages/cli
   npx tsx src/index.ts --help
   
   # Option 2: Use the development script
   ./mpa-dev.sh --help
   ```

4. **OR Build and link (Production Mode)**
   ```bash
   npm run build
   cd packages/cli
   npm link
   ```

## Project Structure

```
ui-blueprint/
├── packages/
│   ├── cli/           # CLI tool source code
│   │   ├── src/       # TypeScript source files
│   │   ├── dist/      # Compiled JavaScript (generated)
│   │   └── package.json
│   └── ui/            # UI components package
├── registry/          # Component registry
│   ├── components/    # Component definitions
│   └── index.json     # Registry index
├── README.md          # Main documentation
└── package.json       # Root package.json (monorepo)
```

## Development Workflow

### Adding a New Component

1. **Create the component file**
   - Add your component in `registry/components/`
   - Follow existing component patterns
   - Include proper TypeScript types

2. **Update the registry**
   - Add an entry to `registry/index.json`
   - Include component metadata (name, dependencies, files)

3. **Test locally**
   ```bash
   # In a test project
   mpa add your-component-name
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add [component-name] component"
   git push origin your-branch-name
   ```

### Making Changes to the CLI

1. **Edit source files** in `packages/cli/src/`
2. **Rebuild** with `npm run build`
3. **Test** your changes using `npm link`
4. **Commit** following the commit message conventions below

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add dropdown component
fix: resolve button hover state issue
docs: update installation instructions
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them

3. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Ensure all tests pass

5. **Code Review**
   - Address any feedback from reviewers
   - Make requested changes

6. **Merge**
   - Once approved, your PR will be merged

## Testing

Before submitting a PR, ensure:

1. **The CLI builds successfully**
   ```bash
   npm run build
   ```

2. **Components can be added to a test project**
   ```bash
   mpa add your-component
   ```

3. **No TypeScript errors**
   ```bash
   npm run build
   ```

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Questions?

If you have questions or need help:
- Check the [README.md](README.md)
- Ask in team discussions
- Reach out to the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
