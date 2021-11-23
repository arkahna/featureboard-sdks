import { EffectiveFeatureValue } from '@featureboard/contracts'
import { createBrowserHttpClient } from './browser-http-client'
import { createBrowserWsClient } from './browser-ws-client'
import { createClient } from './create-client'
import { EffectiveFeatureState } from './effective-feature-state'
import {
    EffectiveFeatureStore,
    MemoryEffectiveFeatureStore,
} from './effective-feature-store'
import { FeatureBoardApiConfig } from './featureboard-api-config'
import { featureBoardHostedService } from './featureboard-service-urls'
import { FeatureBoardClient } from './features-client'
import { debugLog } from './log'
import { UpdateStrategies } from './update-strategies'

export interface FeatureBoardServiceOptions {
    /** Connect to a self hosted instance of FeatureBoard */
    api?: FeatureBoardApiConfig

    store?: EffectiveFeatureStore

    /**
     * The method your feature state is updated
     *
     * manual - will not proactively update
     * live - uses websockets for near realtime updates
     * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
     */
    updateStrategy?: UpdateStrategies | UpdateStrategies['kind']

    /**
     * Provide an alternate fetch implementation, only used when not in live mode
     *
     * @default global fetch
     */
    fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

export interface ClientConnection {
    client: FeatureBoardClient

    /** Manually triggers an update to the feature state */
    updateFeatures(): PromiseLike<void>

    /** Closes subscription to the FeatureBoard service */
    close: () => void
}

export const FeatureBoardService = {
    /** Can be used to create a client from values transferred from server side renders, or test values */
    initStatic(
        audiences: string[],
        effectiveFeatureValues: EffectiveFeatureValue[],
    ): FeatureBoardClient {
        return createClient(
            new EffectiveFeatureState(
                audiences,
                new MemoryEffectiveFeatureStore(effectiveFeatureValues),
            ),
        )
    },
    init(
        environmentApiKey: string,
        audiences: string[],
        {
            updateStrategy,
            api,
            store,
            fetch: fetchImpl,
        }: FeatureBoardServiceOptions = {},
    ) {
        const resolvedUpdateStrategy: UpdateStrategies = !updateStrategy
            ? { kind: 'polling' }
            : typeof updateStrategy === 'string'
            ? {
                  kind: updateStrategy,
              }
            : updateStrategy

        debugLog('Initializing FeatureBoard client: %o', {
            updateStrategy: resolvedUpdateStrategy,
        })
        const effectiveFeatureState = new EffectiveFeatureState(
            audiences,
            store,
        )

        if (resolvedUpdateStrategy.kind === 'live') {
            const defaultWebsocketFactory = (address: string): any =>
                new WebSocket(address)

            return createBrowserWsClient(environmentApiKey, audiences, {
                api: api || featureBoardHostedService,
                liveOptions: {
                    websocketFactory: defaultWebsocketFactory,
                    ...resolvedUpdateStrategy.options,
                },
                state: effectiveFeatureState,
                fetch: fetchImpl || fetch,
            })
        }

        return createBrowserHttpClient(environmentApiKey, audiences, {
            api: api || featureBoardHostedService,
            state: effectiveFeatureState,
            fetch: fetchImpl || fetch,
            updateStrategy: resolvedUpdateStrategy,
        })
    },
}
