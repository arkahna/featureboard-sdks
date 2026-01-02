// Main Provider export
export { FeatureBoardProvider } from './featureboard-provider'

// Utility exports
export { extractAudiences } from './audience-extractor'

// Type exports
export type {
    FeatureBoardProviderMetadata,
    FeatureBoardProviderOptions,
    PropertyMapping,
} from './types'

// Re-export commonly needed types from dependencies for convenience
export type {
    ExternalStateStore,
    FeatureBoardApiConfig,
    ServerClient,
} from '@featureboard/node-sdk'
export type {
    EvaluationContext,
    ProviderStatus,
    ResolutionDetails,
} from '@openfeature/server-sdk'
