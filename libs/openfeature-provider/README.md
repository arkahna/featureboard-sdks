# @featureboard/openfeature-provider

FeatureBoard integration for OpenFeature.

This package provides a FeatureBoard provider for the OpenFeature specification, allowing you to use FeatureBoard feature flags with any OpenFeature-compatible client.

## Installation

```bash
npm install @featureboard/openfeature-provider @openfeature/web-sdk
```

For React applications, also install the React SDK:

```bash
npm install @openfeature/react-sdk
```

## Basic Usage

### JavaScript/TypeScript

```typescript
import { OpenFeature } from '@openfeature/web-sdk'
import { FeatureBoardProvider } from '@featureboard/openfeature-provider'

// Create a FeatureBoard provider
const provider = new FeatureBoardProvider({
  environmentKey: 'your-environment-key',
})

// Register the provider with OpenFeature
OpenFeature.setProvider(provider)

// Use OpenFeature client
const client = OpenFeature.getClient()
const value = client.getBooleanValue('my-feature', false)
```

### React

```tsx
import React from 'react'
import { OpenFeature } from '@openfeature/web-sdk'
import { OpenFeatureProvider, useFlag } from '@openfeature/react-sdk'
import { FeatureBoardProvider } from '@featureboard/openfeature-provider'

// Initialize the provider
const provider = new FeatureBoardProvider({
  environmentKey: 'your-environment-key',
})

OpenFeature.setProvider(provider)

// Use in components
function MyComponent() {
  const { value: isEnabled } = useFlag('my-feature', false)

  return <div>{isEnabled ? <NewFeatureComponent /> : <LegacyComponent />}</div>
}

// Wrap your app
function App() {
  return (
    <OpenFeatureProvider>
      <MyComponent />
    </OpenFeatureProvider>
  )
}
```

## API Reference

### FeatureBoardProvider

The main provider class that implements the OpenFeature provider interface.

#### Constructor

```typescript
new FeatureBoardProvider(config: FeatureBoardProviderConfig)
```

#### Configuration

- `environmentKey` (required): Your FeatureBoard environment key
- `options` (optional): Additional FeatureBoard client options

#### Methods

- `initialize()`: Initialize the provider and wait for FeatureBoard client to be ready
- `resolveBooleanEvaluation()`: Resolve boolean feature flags
- `resolveStringEvaluation()`: Resolve string feature flags
- `resolveNumberEvaluation()`: Resolve number feature flags
- `resolveObjectEvaluation()`: Resolve object feature flags
- `onClose()`: Clean up resources when the provider is closed

#### Events

The provider emits standard OpenFeature events:

- `ProviderEvents.Ready`: When the provider is ready to serve flags
- `ProviderEvents.Error`: When an error occurs during initialization

## Examples

See the `examples/` directory for complete usage examples:

- `basic-usage.ts`: Basic JavaScript/TypeScript usage
- `react-usage.tsx`: React integration with hooks

## Development

### Building

```bash
pnpm nx package openfeature-provider
```

### Testing

```bash
pnpm nx test openfeature-provider
```

## License

MIT
