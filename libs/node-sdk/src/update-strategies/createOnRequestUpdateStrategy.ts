import {
    createEnsureSingleWithBackoff,
    resolveError,
} from '@featureboard/js-sdk'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { getTracer } from '../utils/get-tracer'
import { getAllEndpoint } from './getAllEndpoint'
import { type AllConfigUpdateStrategy } from './update-strategies'

export function createOnRequestUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    maxAgeMs: number,
): AllConfigUpdateStrategy {
    let responseExpires: number | undefined
    let etag: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)

    return {
        async connect(stateStore) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingleWithBackoff(async () => {
                const allEndpoint = getAllEndpoint(httpEndpoint)
                etag = await fetchFeaturesConfigurationViaHttp(
                    allEndpoint,
                    environmentApiKey,
                    stateStore,
                    etag,
                )
            })

            return fetchUpdatesSingle().then(() => {
                responseExpires = Date.now() + maxAgeMs
            })
        },
        close() {
            return Promise.resolve()
        },
        get state() {
            return 'connected' as const
        },
        async updateFeatures() {
            if (fetchUpdatesSingle) {
                await fetchUpdatesSingle()
            }
        },
        async onRequest() {
            return getTracer().startActiveSpan(
                'on-request',
                { attributes: { etag } },
                async (span) => {
                    if (fetchUpdatesSingle) {
                        const now = Date.now()
                        if (!responseExpires || now >= responseExpires) {
                            span.addEvent('onRequestUpdating', {
                                message: 'Response expired, fetching updates',
                                maxAgeMs,
                                expiry: responseExpires,
                            })
                            return fetchUpdatesSingle()
                                .then(() => {
                                    responseExpires = now + maxAgeMs
                                    span.addEvent('onRequestUpdated', {
                                        message:
                                            'Successfully updated features',
                                        maxAgeMs,
                                        newExpiry: responseExpires,
                                    })
                                })
                                .catch((error) => {
                                    span.recordException(resolveError(error))
                                })
                                .finally(() => span.end())
                        }
                        span.addEvent('onRequestNotExpired', {
                            message: 'Response not expired',
                            maxAgeMs,
                            expiry: responseExpires,
                            now,
                        })
                        return Promise.resolve()
                    }
                },
            )
        },
    }
}
