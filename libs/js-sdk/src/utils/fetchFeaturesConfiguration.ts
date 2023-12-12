import type { EffectiveFeatureValue } from '@featureboard/contracts'
import { SpanStatusCode } from '@opentelemetry/api'
import type { EffectiveFeatureStateStore } from '../effective-feature-state-store'
import { getEffectiveEndpoint } from '../update-strategies/getEffectiveEndpoint'
import { version } from '../version'
import { addDebugEvent } from './add-debug-event'
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
) {
    const effectiveEndpoint = getEffectiveEndpoint(
        featureBoardEndpoint,
        audiences,
    )
    return getTracer().startActiveSpan(
        'fetchEffectiveFeatures(http)',
        { attributes: { audiences, etag } },
        async (span) => {
            try {
                const response = await fetch(effectiveEndpoint, {
                    method: 'GET',
                    headers: {
                        'x-environment-key': environmentApiKey,
                        'x-sdk-version': version,
                        ...(etag ? { 'if-none-match': etag } : {}),
                    },
                })

                if (response.status !== 200 && response.status !== 304) {
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: `Failed to get latest flags: Service returned error ${response.status} (${response.statusText})`,
                    })

                    throw new Error(
                        `Failed to get latest flags: Service returned error ${response.status} (${response.statusText})`,
                    )
                }

                // Expect most times will just get a response from the HEAD request saying no updates
                if (response.status === 304) {
                    return etag
                }

                const currentEffectiveValues: EffectiveFeatureValue[] =
                    await response.json()

                const newAudiences = getCurrentAudiences()
                if (!compareArrays(newAudiences, audiences)) {
                    addDebugEvent(
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
                addDebugEvent('Feature updates received', {
                    audiences,
                    unavailableFeatures,
                })

                return response.headers.get('etag') || undefined
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
