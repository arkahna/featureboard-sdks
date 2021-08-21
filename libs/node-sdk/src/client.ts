import {
    FeatureBoardApiConfig,
    FeatureBoardClient,
    featureBoardHostedService,
} from '@featureboard/js-sdk'
import WS from 'ws'
import { FeatureState } from './feature-state'
import { FeatureStore } from './feature-store'
import { createNodeHttpClient } from './server-http-client'
import { createNodeWsClient } from './server-ws-client'
import { UpdateStrategies } from './update-strategies'

export interface FeatureBoardServiceOptions {
    /** Connect to a self hosted instance of FeatureBoard */
    api?: FeatureBoardApiConfig

    store?: FeatureStore

    /**
     * The method your feature state is updated
     *
     * manual - will not proactively update
     * live - uses websockets for near realtime updates
     * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
     * on-request - checks for updates on every request - see docs for how to enable HTTP caching in node
     */
    updateStrategy?: UpdateStrategies | UpdateStrategies['kind']

    /**
     * Provide an alternate fetch implementation, not used when in live mode
     *
     * @default global fetch
     */
    fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

export interface ClientConnection {
    client: FeatureBoardClient
    close: () => void
}

export const FeatureBoardService = {
    async init(
        environmentApiKey: string,
        {
            updateStrategy,
            api,
            store,
            fetch: fetchImpl,
        }: FeatureBoardServiceOptions = {},
    ) {
        const resolvedUpdateStrategy: UpdateStrategies = !updateStrategy
            ? { kind: 'live' }
            : typeof updateStrategy === 'string'
            ? {
                  kind: updateStrategy,
              }
            : updateStrategy

        const featureState = new FeatureState(store)

        if (resolvedUpdateStrategy.kind === 'live') {
            const defaultWebsocketFactory = (address: string): any =>
                new WS(address) as any
            return createNodeWsClient(environmentApiKey, {
                api: api || featureBoardHostedService,
                liveOptions: {
                    websocketFactory: defaultWebsocketFactory,
                    ...resolvedUpdateStrategy.options,
                },
                state: featureState,
            })
        }

        return await createNodeHttpClient(environmentApiKey, {
            api: api || featureBoardHostedService,
            state: featureState,
            fetch:
                fetchImpl ||
                (typeof fetch !== 'undefined'
                    ? fetch
                    : ((
                          await import('node-fetch')
                      ).default as any as typeof fetch)),
            updateStrategy: resolvedUpdateStrategy,
        })
    },
}
