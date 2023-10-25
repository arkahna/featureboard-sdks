import type { FeatureBoardClient } from '@featureboard/js-sdk'

export interface ServerClient {
    /**
     * Gets a client SDK for a request
     *
     * @argument request The audiences for this request
     * @returns Promise<FeatureBoardClient> when update strategy is on-request, otherwise FeatureBoardClient
     *
     * Note: If FeatureBoardClient.subscribeToFeatureValue() is used in Node SDK, it will only call back once. It will
     * immediately call back with the current value and will not subscribe to the feature in the state store.
     **/
    request(
        audiences: string[],
    ): FeatureBoardClient & PromiseLike<FeatureBoardClient>

    /** Returns true once the FeatureBoard SDK has a valid set of values */
    initialised: boolean

    /**
     * Waits for ServerClient to be initialised
     *
     * @throws {Error} If the initialisation process fails an error is thrown
     */
    waitForInitialised(): Promise<boolean>

    /** Manually triggers an update to the feature state */
    updateFeatures(): PromiseLike<void>

    close(): void
}
