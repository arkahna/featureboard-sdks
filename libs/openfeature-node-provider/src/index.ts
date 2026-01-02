// Main Provider export
export { FeatureBoardProvider } from './featureboard-provider'

// Utility exports
export { extractAudiences } from './audience-extractor'

// Type exports
export type {
    FeatureBoardProviderOptions,
    FeatureBoardProviderMetadata,
    PropertyMapping,
} from './types'

// Re-export commonly needed types from dependencies for convenience
export type {
    EvaluationContext,
    ResolutionDetails,
    ProviderStatus,
} from '@openfeature/server-sdk'
export type {
    ServerClient,
    ExternalStateStore,
    FeatureBoardApiConfig,
} from '@featureboard/node-sdk'
