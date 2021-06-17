# FeatureBoard Client JavaScript SDK

For browser based web applications.

## Getting started

```ts
const { client, close } = await FeatureBoardService.init(
  'env-api-key',
  ['audiences', 'of', 'user'],
  {
    /* options */
  },
)

const featureValue = client.getFeatureValue('my-feature-key', fallbackValue)

const unsubscribe = subscribeToFeatureValue(
  'my-feature-key',
  fallbackValue,
  (onValue) => {
    // Will be called with the initial value and subsiquent updates
  },
)

// Remove subscription
unsubscribe()
```

NOTE: You must specify a fallback value, this value is used when the feature is unavailable in the current environment.

## Options

The optional third argument to init

### initialValues

Provides the SDK with a set of initial flag values, if provided the subscription and update of the feature state will happen in the background. Allowing you to immediately use the SDK

### updateStrategy

Configure how the FeatureBoard SDK gets updated values, default 'live'

#### live

Connects to the FeatureBoard service using web sockets, giving near realtime updates

#### polling

Polls for updates using http. Default polling interval 30 seconds.

### manual

If you would like to control when feature state is updated, or not have updates just choose 'manual'

```ts
const { client, updateFeatures } = await FeatureBoardService.init(
  'env-api-key',
  ['audiences', 'of', 'user'],
  {
    updateStrategy: 'manual',
    /* options */
  },
)

// Triggers an update of the feature state
updateFeatures()
```

## TypeScript

To get type safety on your features you can use [Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to define the features

```ts
declare module '@featureboard/js-sdk' {
  interface Features {
    'my-feature-key': string
  }
}
```
