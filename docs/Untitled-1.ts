// // Shared

// interface EffectiveConfigUpdateStrategy {
//     state: 'connected' | 'disconnected'
//     connect(state: EffectiveFeaturesState, audiences: string[]): Promise<void>
//     close(): Promise<void>
//     updateFeatures(): PromiseLike<void>
// }

// interface AllConfigUpdateStrategy {
//     state: 'connected' | 'disconnected'
//     connect(state: AllFeaturesState): Promise<void>
//     close(): Promise<void>
//     updateFeatures(): PromiseLike<void>
// }

// // Server

// function createServerClient({}: {
//     /**
//      * The method your feature state is updated
//      *
//      * manual - will not proactively update
//      * live - uses websockets for near realtime updates
//      * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
//      */
//     updateStrategy?: AllConfigUpdateStrategy

//     store?: FeatureStore

//     initialValues?: Record<string, FeatureConfiguration>
// }): ServerClient {}

// // Client
// interface BrowserClient {
//     client: FeatureBoardClient

//     /** Returns true once the FeatureBoard SDK has a valid set of values */
//     initialised: boolean

//     waitForInitialised(): Promise<boolean>

//     /** Will set initialised to false until the new audiences are loaded */
//     updateAudiences(audiences: string[]): PromiseLike<void>

//     /** Manually triggers an update to the feature state */
//     updateFeatures(): PromiseLike<void>

//     /** Closes subscription to the FeatureBoard service */
//     close: () => void
// }
