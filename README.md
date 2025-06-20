# FeatureBoard SDKs

This repository contains FeatureBoard SDKs for different languages and platforms.

## SDKs

### Legacy SDKs

- [.NET SDK](libs/dotnet-sdk/README.md)
- [JavaScript SDK](libs/js-sdk/README.md)
- [NodeJS SDK](libs/node-sdk/README.md)
- [React SDK](libs/react-sdk/README.md)

### OpenFeature Provider (New)

- [OpenFeature Provider](libs/openfeature-provider/README.md) - OpenFeature-compliant provider for FeatureBoard
  - ✅ React SDK (via `@openfeature/react-sdk`)
  - 🔄 Additional language support coming soon

## Development Tools

### Code Generators

- [CLI](apps/cli/README.md) - Command-line interface for code generation
- [NX plugin](libs/nx-plugin/README.md) - Nx workspace integration

### End-to-End Testing

Comprehensive e2e testing for the OpenFeature React SDK integration. See [e2e testing documentation](docs/playwright-testing.md) for details.

## Development

### Prerequisites

- Node.js 18+
- pnpm
- .NET SDK (for .NET SDK development)

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm nx run-many --target=build --all

# Run tests
pnpm nx run-many --target=test --all
```

### Running E2E Tests

```bash
# Run e2e tests for OpenFeature React SDK
pnpm nx run e2e
```

## What is FeatureBoard?

FeatureBoard is the future of Feature Management and is tailored for SaaS teams on the hunt for a simplified yet highly potent feature toggling solution. FeatureBoard enhances team productivity by allowing everyone to manage software features seamlessly, not just developers.

Go to [our website](https://featureboard.app) to find out more.

## Documentation

Installation and usage instructions can be found on our [docs site](https://docs.featureboard.app).
