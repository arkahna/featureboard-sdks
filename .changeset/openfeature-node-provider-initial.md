---
"@featureboard/openfeature-node-provider": minor
---

Initial release of `@featureboard/openfeature-node-provider`

- OpenFeature Provider implementation wrapping `@featureboard/node-sdk`
- Flexible audience mapping from OpenFeature EvaluationContext:
  - Explicit `audiences` array in context
  - Declarative `audiencePropertyMap` configuration
  - Custom `audienceMapper` function for full control
  - Sensible default mappings for common properties
- Support for all FeatureBoard update strategies (manual, polling, on-request)
- Full type support including object values via JSON string parsing
