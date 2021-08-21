# FeatureBoard Node SDK

## TypeScript

When using TypeScript add an ambient type definition of your features, for example

```
declare module '@featureboard/js-sdk' {
    interface Features {
        'test-feature-1': boolean
        'test-feature-2': string
        'test-feature-2b': string
        'test-feature-3': number
    }
}
```

If you do not want to specify all your features the features you can just add:

```
declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {
    }
}
```

## Usage
