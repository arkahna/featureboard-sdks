# @featureboard/openfeature-node-provider

OpenFeature Provider for FeatureBoard - enables using FeatureBoard with the OpenFeature SDK for Node.js server-side applications.

## Installation

```bash
npm install @featureboard/openfeature-node-provider @openfeature/server-sdk
```

```bash
pnpm add @featureboard/openfeature-node-provider @openfeature/server-sdk
```

```bash
yarn add @featureboard/openfeature-node-provider @openfeature/server-sdk
```

## Quick Start

```typescript
import { OpenFeature } from '@openfeature/server-sdk'
import { FeatureBoardProvider } from '@featureboard/openfeature-node-provider'

// Create and register the provider
const provider = new FeatureBoardProvider({
  environmentApiKey: 'your-environment-api-key',
})

await OpenFeature.setProviderAndWait(provider)

// Get a client and evaluate flags
const client = OpenFeature.getClient()

const isEnabled = await client.getBooleanValue('my-feature', false, {
  audiences: ['premium', 'org:acme'],
})
```

## Audience Mapping

The core challenge when using FeatureBoard with OpenFeature is mapping OpenFeature's `EvaluationContext` to FeatureBoard's audiences. This provider offers four strategies, applied in priority order:

### Strategy 1: Custom Mapper Function (Highest Priority)

Full control over audience extraction:

```typescript
const provider = new FeatureBoardProvider({
  environmentApiKey: 'your-key',
  audienceMapper: (context) => {
    const audiences: string[] = []

    if (context.targetingKey) {
      audiences.push(context.targetingKey)
    }
    if (context.organization) {
      audiences.push(`org:${context.organization}`)
    }
    if (context.roles && Array.isArray(context.roles)) {
      for (const role of context.roles) {
        audiences.push(`role:${role}`)
      }
    }

    return audiences
  },
})
```

### Strategy 2: Explicit Audiences Array

Pass audiences directly in the context:

```typescript
const value = await client.getBooleanValue('feature', false, {
  audiences: ['premium', 'org:acme', 'role:admin'],
})
```

### Strategy 3: Property Map (Declarative)

Configure property-to-audience mappings:

```typescript
const provider = new FeatureBoardProvider({
  environmentApiKey: 'your-key',
  audiencePropertyMap: {
    // Template: replace {value} with property value
    organizationId: 'org:{value}', // organizationId: 'acme' → 'org:acme'
    tier: 'tier:{value}', // tier: 'premium' → 'tier:premium'

    // Direct value
    segment: '{value}', // segment: 'beta' → 'beta'

    // Function for complex logic
    isPremium: (v) => (v ? 'premium' : null),
    subscriptionLevel: (level) => (level >= 3 ? 'enterprise' : 'basic'),
  },
})

// Usage
const value = await client.getBooleanValue('feature', false, {
  organizationId: 'acme',
  tier: 'gold',
})
```

### Strategy 4: Default Mappings (Fallback)

If no explicit configuration is provided, sensible defaults are applied:

| Context Property | Audience Format          |
| ---------------- | ------------------------ |
| `targetingKey`   | As-is (e.g., `user-123`) |
| `userId`         | `user:{value}`           |
| `organizationId` | `org:{value}`            |
| `teamId`         | `team:{value}`           |
| `role`           | `role:{value}`           |
| `tier`           | `tier:{value}`           |
| `segment`        | `segment:{value}`        |

## Configuration Options

```typescript
interface FeatureBoardProviderOptions {
  /** FeatureBoard environment API key (required) */
  environmentApiKey: string

  /** Update strategy: 'manual' | 'polling' | 'on-request' */
  updateStrategy?: 'manual' | 'polling' | 'on-request'

  /** Polling interval in ms (for 'polling' strategy) */
  intervalMs?: number

  /** Max age in ms before refresh (for 'on-request' strategy) */
  maxAgeMs?: number

  /** External state store for fallback initialization */
  externalStateStore?: ExternalStateStore

  /** Custom API endpoint */
  api?: FeatureBoardApiConfig | string

  /** Declarative property-to-audience mapping */
  audiencePropertyMap?: PropertyMapping

  /** Custom audience extraction function */
  audienceMapper?: (context: EvaluationContext) => string[]
}
```

## Update Strategies

### Manual

Features are only updated when explicitly requested:

```typescript
const provider = new FeatureBoardProvider({
  environmentApiKey: 'your-key',
  updateStrategy: 'manual',
})
```

### Polling (Default)

Features are updated at regular intervals:

```typescript
const provider = new FeatureBoardProvider({
  environmentApiKey: 'your-key',
  updateStrategy: 'polling',
  intervalMs: 30000, // 30 seconds (default)
})
```

### On-Request

Features are checked for updates on each request:

```typescript
const provider = new FeatureBoardProvider({
  environmentApiKey: 'your-key',
  updateStrategy: 'on-request',
  maxAgeMs: 30000, // Cache for 30 seconds
})
```

## Usage Examples

### Express.js Middleware

```typescript
import express from 'express'
import { OpenFeature } from '@openfeature/server-sdk'
import { FeatureBoardProvider } from '@featureboard/openfeature-node-provider'

const app = express()

// Initialize provider
const provider = new FeatureBoardProvider({
  environmentApiKey: process.env.FEATUREBOARD_API_KEY!,
  audiencePropertyMap: {
    userId: 'user:{value}',
    organizationId: 'org:{value}',
  },
})

await OpenFeature.setProviderAndWait(provider)
const client = OpenFeature.getClient()

// Feature flag middleware
app.use(async (req, res, next) => {
  const context = {
    targetingKey: req.user?.id,
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
  }

  req.features = {
    newDashboard: await client.getBooleanValue('new-dashboard', false, context),
    maxUploads: await client.getNumberValue('max-uploads', 10, context),
  }

  next()
})
```

### Type Safety Note

FeatureBoard's native SDK supports TypeScript type generation for feature flags. However, OpenFeature uses string keys for flag evaluation, so generated types cannot be enforced at compile time.

If type safety is critical for your use case, consider using `@featureboard/node-sdk` directly instead of through OpenFeature.

## API Reference

### FeatureBoardProvider

The main provider class implementing OpenFeature's `Provider` interface.

#### Constructor

```typescript
new FeatureBoardProvider(options: FeatureBoardProviderOptions)
```

#### Properties

- `metadata.name` - Returns `'FeatureBoard'`
- `status` - Current provider status (NOT_READY, READY, ERROR)
- `events` - Event emitter for provider lifecycle events

#### Methods

- `initialize()` - Initialize the provider (called automatically by OpenFeature)
- `onClose()` - Clean up provider resources
- `resolveBooleanEvaluation()` - Evaluate boolean flag
- `resolveStringEvaluation()` - Evaluate string flag
- `resolveNumberEvaluation()` - Evaluate number flag
- `resolveObjectEvaluation()` - Evaluate object flag

### extractAudiences

Utility function for extracting audiences from OpenFeature context:

```typescript
import { extractAudiences } from '@featureboard/openfeature-node-provider'

const audiences = extractAudiences(
    context,           // EvaluationContext
    propertyMap?,      // Optional PropertyMapping
    customMapper?,     // Optional custom function
)
```

## Troubleshooting

### Provider not ready error

Ensure you're waiting for initialization:

```typescript
// ✅ Correct
await OpenFeature.setProviderAndWait(provider)

// ❌ Wrong - may evaluate before ready
OpenFeature.setProvider(provider)
const value = await client.getBooleanValue('flag', false) // May fail
```

### Audiences not matching

Enable debug logging to see extracted audiences:

```bash
DEBUG=@featureboard/openfeature-node-provider:* node your-app.js
```

### Default values always returned

1. Verify your environment API key is correct
2. Check that the feature key exists in FeatureBoard
3. Confirm audiences match those configured in FeatureBoard

## License

MIT
