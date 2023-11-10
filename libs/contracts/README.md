# FeatureBoard Contracts

TypeScript type definitions for FeatureBoard SDKs.

![npm](https://img.shields.io/npm/v/%40featureboard%2Fcontracts?logo=npm) ![npm](https://img.shields.io/npm/dt/%40featureboard%2Fcontracts?logo=npm) ![GitHub Workflow](https://img.shields.io/github/actions/workflow/status/arkahna/featureboard-sdks/main.yml?logo=github)


## Installation


```bash
npm add @featureboard/contracts
```
```bash
yarn add @featureboard/contracts
```
```bash
pnpm add @featureboard/contracts
```

## Example

```typescript
export interface EffectiveFeatureValue {
  featureKey: string
  value: string | boolean | number
}
```

## Why TypeScript type definitions?

We provide TypeScript type definitions to establish consistent interfaces between our client and server SDKs, facilitating seamless integration with universal JavaScript application frameworks such as Remix and Next.js.

The advantages of using TypeScript type definitions are:

- **Type safety**: TypeScript helps catch type-related errors during development, reducing the chance of runtime errors.
- **Code quality**: Strong typing enhances code quality, making it more self-documenting, understandable, and maintainable.
- **Tooling support**: TypeScript-aware editors and IDEs provide better autocompletion, code navigation, and error checking, leading to increased productivity.
- **Interoperability**: TypeScript definitions enable seamless integration with other TypeScript projects.

## Release notes

Our changelog can be found on [Github](https://github.com/arkahna/featureboard-sdks/blob/main/libs/contracts/CHANGELOG.md).
