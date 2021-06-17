import { FeatureBoardClient } from '@featureboard/js-sdk'

export interface ServerConnection {
    /**
     * Gets a client SDK for a request
     *
     * @argument request The audiences for this request
     * @returns Promise<FeatureBoardClient> when update strategy is on-request, otherwise FeatureBoardClient
     **/
    request(
        audiences: string[],
    ): FeatureBoardClient & PromiseLike<FeatureBoardClient>

    /** Manually triggers an update to the feature state */
    updateFeatures(): PromiseLike<void>

    close(): void
}
