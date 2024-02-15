import {
    TooManyRequestsError,
    type EffectiveFeatureValue,
} from '@featureboard/contracts'
import { SpanStatusCode } from '@opentelemetry/api'
import type { EffectiveFeatureStateStore } from '../effective-feature-state-store'
import { getEffectiveEndpoint } from '../update-strategies/getEffectiveEndpoint'
import { compareArrays } from './compare-arrays'
import { getTracer } from './get-tracer'
import { resolveError } from './resolve-error'

export async function fetchFeaturesConfigurationViaHttp(
    featureBoardEndpoint: string,
    audiences: string[],
    environmentApiKey: string,
    stateStore: EffectiveFeatureStateStore,
    etag: string | undefined,
    getCurrentAudiences: () => string[],
): Promise<string | undefined> {
    const effectiveEndpoint = getEffectiveEndpoint(
        featureBoardEndpoint,
        audiences,
    )
    return getTracer().startActiveSpan(
        'fbsdk-fetch-effective-features-http',
        { attributes: { audiences, etag } },
        async (span) => {
            try {
                const response = await fetch(effectiveEndpoint, {
                    method: 'GET',
                    headers: {
                        'x-environment-key': environmentApiKey,
                        ...(etag ? { 'if-none-match': etag } : {}),
                    },
                })

                if (response.status === 429) {
                    // Too many requests
                    const retryAfterHeader = response.headers.get('Retry-After')
                    const retryAfterInt = retryAfterHeader
                        ? parseInt(retryAfterHeader, 10)
                        : 60
                    const retryAfter =
                        retryAfterHeader && !retryAfterInt
                            ? new Date(retryAfterHeader)
                            : new Date()

                    if (retryAfterInt) {
                        const retryAfterTime =
                            retryAfter.getTime() + retryAfterInt * 1000
                        retryAfter.setTime(retryAfterTime)
                    }

                    throw new TooManyRequestsError(
                        `Failed to get latest features: Service returned ${
                            response.status
                        }${
                            response.statusText ? ' ' + response.statusText : ''
                        }. ${
                            retryAfterHeader
                                ? 'Retry after: ' + retryAfter.toUTCString()
                                : ''
                        }`,
                        retryAfter,
                    )
                }

                if (response.status !== 200 && response.status !== 304) {
                    throw new Error(
                        `Failed to get latest flags: Service returned error ${response.status} (${response.statusText})`,
                    )
                }

                // Expect most times will just get a response from the HEAD request saying no updates
                if (response.status === 304) {
                    span.addEvent('Fetch succeeded without changes')
                    return etag
                }

                const currentEffectiveValues: EffectiveFeatureValue[] =
                    await response.json()

                const newAudiences = getCurrentAudiences()
                if (!compareArrays(newAudiences, audiences)) {
                    span.addEvent(
                        'Audiences changed while fetching, ignoring response',
                        {
                            audiences,
                            newAudiences,
                        },
                    )
                    return etag
                }
                const existing = { ...stateStore.all() }

                for (const featureValue of currentEffectiveValues) {
                    stateStore.set(featureValue.featureKey, featureValue.value)
                    delete existing[featureValue.featureKey]
                }
                const unavailableFeatures = Object.keys(existing)
                unavailableFeatures.forEach((unavailableFeature) => {
                    stateStore.set(unavailableFeature, undefined)
                })
                const newEtag = response.headers.get('etag') || undefined
                span.addEvent('Fetch succeeded with updates', {
                    audiences,
                    unavailableFeatures,
                    newEtag,
                })

                return newEtag
            } catch (error) {
                const err = resolveError(error)
                span.recordException(err)
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: err.message,
                })
                throw err
            } finally {
                span.end()
            }
        },
    )
}
