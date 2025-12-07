# Contributing to setup-ds-action

Thank you for your interest in contributing to the Setup Delivery Station Action!

## Development Setup

1. Clone the repository
```bash
git clone https://github.com/delivery-station/setup-ds-action.git
cd setup-ds-action
```

2. Install dependencies
```bash
npm install
```

3. Make your changes to `src/index.ts` (TypeScript)

4. Build the action
```bash
npm run build  # Compiles TypeScript + bundles with ncc
```

5. Test locally by using the action in a workflow

## Building

The action is written in **TypeScript** and uses [@vercel/ncc](https://github.com/vercel/ncc) to compile into a single distributable file.

**Build process:**
1. TypeScript compiles `src/index.ts` → `lib/index.js`
2. ncc bundles `lib/index.js` → `dist/index.js` (all dependencies included)

**Build commands:**
- `npm run build` - Full build (compile + bundle)
- `npm run compile` - TypeScript compilation only
- `npm run package` - ncc bundling only

Always run `npm run build` before committing to ensure the `dist/` directory is up to date.

## Testing

Test the action in a real workflow:

```yaml
- uses: ./
  with:
    version: 'latest'
```

## Pull Request Process

1. Ensure all changes are built (`npm run build`)
2. Update README.md if adding new features
3. Test on multiple platforms if changing platform detection logic
4. Submit a PR with a clear description of changes

## Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code patterns
- Keep functions small and focused

## Release Process

Releases are managed by maintainers using semantic versioning and GitHub releases.
