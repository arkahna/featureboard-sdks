import WS from 'isomorphic-ws'
import { createBrowserHttpClient } from './browser-http-client'
import { createBrowserWsClient } from './browser-ws-client'
import { EffectiveFeatureState, EffectiveFeatureValues } from './effective-feature-state'
import { FeatureBoardApiConfig } from './featureboard-api-config'
import { featureBoardHostedService } from './featureboard-service-urls'
import { FeatureBoardClient } from './features-client'
import { UpdateStrategies } from './update-strategies'

export interface FeatureBoardServiceOptions {
    /** Connect to a self hosted instance of FeatureBoard */
    api?: FeatureBoardApiConfig

    initialValues?: EffectiveFeatureValues | undefined

    /**
     * The method your feature state is updated
     *
     * manual - will not proactively update
     * live - uses websockets for near realtime updates
     * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
     */
    updateStrategy?: UpdateStrategies

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
    init(
        environmentApiKey: string,
        audiences: string[],
        { updateStrategy, api, initialValues, fetch: fetchImpl }: FeatureBoardServiceOptions = {},
    ) {
        const resolvedUpdateStrategy: UpdateStrategies = !updateStrategy
            ? { kind: 'live' }
            : typeof updateStrategy === 'string'
            ? {
                  kind: updateStrategy,
              }
            : updateStrategy
        const effectiveFeatureState = new EffectiveFeatureState(audiences, initialValues)

        if (resolvedUpdateStrategy.kind === 'live') {
            const defaultWebsocketFactory = (address: string): any => new WS(address) as any
            return createBrowserWsClient(environmentApiKey, audiences, {
                api: api || featureBoardHostedService,
                liveOptions: {
                    websocketFactory: defaultWebsocketFactory,
                    ...resolvedUpdateStrategy.options,
                },
                state: effectiveFeatureState,
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
