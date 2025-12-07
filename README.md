# Setup Delivery Station Action

GitHub Action to download and install the [Delivery Station](https://github.com/delivery-station/ds) CLI with optional plugins.

## Features

- ✅ Cross-platform support (Linux, macOS, Windows)
- ✅ Multiple architectures (amd64, arm64)
- ✅ Binary caching for faster workflows
- ✅ Automatic plugin installation
- ✅ Version pinning or latest release

## Usage

### Basic Setup

```yaml
- name: Setup DS
  uses: delivery-station/setup-ds-action@v1
```

### Install Specific Version

```yaml
- name: Setup DS
  uses: delivery-station/setup-ds-action@v1
  with:
    version: 'v1.0.0'
```

### Install with Plugins

```yaml
- name: Setup DS with plugins
  uses: delivery-station/setup-ds-action@v1
  with:
    version: 'latest'
    plugins: 'porter,scanner,builder'
```

### Custom Registry

```yaml
- name: Setup DS with custom registry
  uses: delivery-station/setup-ds-action@v1
  with:
    plugins: 'my-plugin'
    registry: 'ghcr.io/my-org'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Version of DS to install (e.g., `v1.0.0` or `latest`) | No | `latest` |
| `plugins` | Comma-separated list of plugin names to install | No | `` |
| `registry` | OCI registry for plugins (if not using default) | No | `` |
| `token` | GitHub token for API requests (to avoid rate limits) | No | `${{ github.token }}` |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | The version of DS that was installed |
| `path` | Path to the DS binary directory |
| `cache-hit` | Whether the DS binary was restored from cache (`true` or `false`) |

## Complete Workflow Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup DS
      uses: delivery-station/setup-ds-action@v1
      with:
        version: 'v1.0.0'
        plugins: 'porter'
    
    - name: Verify installation
      run: |
        ds version
        ds plugin list
    
    - name: Use DS
      run: ds pull my-artifact:latest
```

## Matrix Example (Multiple Platforms)

```yaml
name: Cross-Platform Test

on: [push]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
    - name: Setup DS
      uses: delivery-station/setup-ds-action@v1
      with:
        version: 'latest'
    
    - name: Test DS
      run: ds version
```

## Supported Platforms

- Linux: amd64, arm64
- macOS: amd64 (Intel), arm64 (Apple Silicon)
- Windows: amd64

## Cache Behavior

The action automatically caches the downloaded DS binary based on version. Subsequent runs with the same version will restore from cache, significantly speeding up workflow execution.

## License

MIT

## Support

For issues and questions:
- [DS Repository](https://github.com/delivery-station/ds)
- [Action Issues](https://github.com/delivery-station/setup-ds-action/issues)
