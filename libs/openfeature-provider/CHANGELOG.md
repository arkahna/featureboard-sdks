# Changelog

All notable changes to the FeatureBoard OpenFeature Provider will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-XX

### Added

- Initial implementation of FeatureBoardOpenFeatureProvider
- Support for all OpenFeature evaluation methods:
  - `resolveBooleanEvaluation`
  - `resolveStringEvaluation`
  - `resolveNumberEvaluation`
  - `resolveObjectEvaluation`
- Provider lifecycle management with `initialize()` and `onClose()` methods
- Event emission for provider status changes (Ready, Error, Stale, Reconciling)
- Type safety with TypeScript
- Comprehensive error handling with appropriate error codes and reasons
- Support for FeatureBoard's polling and manual update strategies
- Configuration options for audiences and initial values
- Integration with FeatureBoard's browser client
- Provider ready state management
- Graceful handling of type mismatches and evaluation errors

### Features

- **Full OpenFeature Compatibility**: Implements the complete OpenFeature Provider interface for web clients
- **FeatureBoard Integration**: Direct integration with FeatureBoard's JavaScript SDK
- **Event-Driven**: Emits standard OpenFeature events for state changes
- **Error Resilience**: Returns default values with appropriate error reasons when evaluation fails
- **TypeScript Support**: Full type safety and IntelliSense support
- **Flexible Configuration**: Support for different update strategies and targeting options

### Documentation

- Comprehensive README with usage examples
- TypeScript type definitions
- React usage examples
- Configuration documentation
- Event handling examples

### Technical Details

- Compatible with @openfeature/web-sdk v1.0.0+
- Requires @featureboard/js-sdk as peer dependency
- Supports ES2020+ browsers
- No runtime dependencies beyond peer dependencies