import { FeatureBoardClient } from './features-client'

export interface ClientConnection {
    client: FeatureBoardClient

    updateAudiences(audiences: string[]): PromiseLike<void>

    /** Manually triggers an update to the feature state */
    updateFeatures(): PromiseLike<void>

    /** Closes subscription to the FeatureBoard service */
    close: () => void
}
