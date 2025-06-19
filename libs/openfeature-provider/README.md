# FeatureBoard OpenFeature Provider

This provider integrates FeatureBoard's feature flag service with OpenFeature's standardized API for web applications.

## Installation

```bash
npm install @featureboard/openfeature-provider @openfeature/web-sdk @openfeature/react-sdk
```

## Basic Usage

### 1. Initialize the Provider

```typescript
import { OpenFeature } from '@openfeature/web-sdk';
import { FeatureBoardOpenFeatureProvider } from '@featureboard/openfeature-provider';

// Initialize FeatureBoard provider with your environment key
const provider = new FeatureBoardOpenFeatureProvider({
    environmentApiKey: 'YOUR_ENVIRONMENT_API_KEY',
    audiences: ['your-audience'], // optional
    updateStrategy: 'polling' // 'polling' or 'manual'
});

// Set the provider globally
OpenFeature.setProvider(provider);

// Or use setProviderAndWait to ensure initialization
try {
    await OpenFeature.setProviderAndWait(provider);
    console.log('FeatureBoard provider initialized');
} catch (error) {
    console.error('Failed to initialize provider:', error);
}
```

### 2. Use with OpenFeature Client

```typescript
// Create a client
const client = OpenFeature.getClient();

// Evaluate flags
const isNewFeatureEnabled = client.getBooleanValue('new-feature', false);
const welcomeMessage = client.getStringValue('welcome-message', 'Hello!');
const maxItems = client.getNumberValue('max-items', 10);
const uiConfig = client.getObjectValue('ui-config', { theme: 'light' });

console.log('New feature enabled:', isNewFeatureEnabled);
```

### 3. Use with React SDK

```tsx
import React from 'react';
import { OpenFeatureProvider, useFlag } from '@openfeature/react-sdk';

function App() {
    return (
        <OpenFeatureProvider>
            <MyComponent />
        </OpenFeatureProvider>
    );
}

function MyComponent() {
    const { value: isEnabled } = useFlag('new-feature', false);
    
    return (
        <div>
            {isEnabled ? (
                <NewFeatureComponent />
            ) : (
                <LegacyComponent />
            )}
        </div>
    );
}
```

## Configuration Options

### FeatureBoardProviderOptions

- `environmentApiKey` (required): Your FeatureBoard environment API key
- `audiences` (optional): Array of audience identifiers for targeting. Defaults to `[]`
- `initialValues` (optional): Initial flag values for testing/offline mode
- `updateStrategy` (optional): How flags are updated (`'polling'` or `'manual'`). Defaults to `'polling'`

### Example with All Options

```typescript
const provider = new FeatureBoardOpenFeatureProvider({
    environmentApiKey: 'fb-env-12345',
    audiences: ['beta-users', 'premium-customers'],
    updateStrategy: 'polling',
    initialValues: [
        { featureKey: 'test-flag', value: true },
        { featureKey: 'welcome-text', value: 'Welcome to the beta!' }
    ]
});
```

## Events

The provider emits standard OpenFeature events:

```typescript
import { ProviderEvents } from '@openfeature/web-sdk';

// Listen for provider ready event
OpenFeature.addHandler(ProviderEvents.Ready, (eventDetails) => {
    console.log('Provider ready:', eventDetails.providerName);
});

// Listen for errors
OpenFeature.addHandler(ProviderEvents.Error, (eventDetails) => {
    console.error('Provider error:', eventDetails.message);
});

// Listen for configuration changes (when flags update)
OpenFeature.addHandler(ProviderEvents.ConfigurationChanged, (eventDetails) => {
    console.log('Flags updated');
});
```

## Error Handling

The provider handles various error conditions gracefully:

- **Type Mismatches**: If a flag returns a different type than expected, the default value is returned with an error reason
- **Network Errors**: If FeatureBoard is unreachable, flags will return default values
- **Initialization Failures**: Provider initialization errors are emitted as events

## TypeScript Support

The provider is written in TypeScript and provides full type safety:

```typescript
import type { FeatureBoardProviderOptions } from '@featureboard/openfeature-provider';

const options: FeatureBoardProviderOptions = {
    environmentApiKey: 'your-key',
    audiences: ['users'],
    updateStrategy: 'polling'
};
```

## Contributing

To contribute to this provider:

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run tests: `pnpm test`
4. Build: `pnpm build`

## License

This project is licensed under the MIT License.