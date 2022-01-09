import { FeatureBoardApiConfig, FetchSignature } from '@featureboard/js-sdk'
import { createLiveUpdateStrategy } from './createLiveUpdateStrategy'
import { createManualUpdateStrategy } from './createManualUpdateStrategy'
import { createOnRequestUpdateStrategy } from './createOnRequestUpdateStrategy'
import { createPollingUpdateStrategy } from './createPollingUpdateStrategy'
import {
    AllConfigUpdateStrategy,
    maxAgeDefault,
    pollingIntervalDefault,
    UpdateStrategies,
} from './update-strategies'

export function resolveUpdateStrategy(
    updateStrategy: UpdateStrategies['kind'] | UpdateStrategies | undefined,
    environmentApiKey: string,
    api: FeatureBoardApiConfig,
    fetchInstance: FetchSignature,
): AllConfigUpdateStrategy {
    const resolvedUpdateStrategy: UpdateStrategies =
        toUpdateStrategyOptions(updateStrategy)

    if (resolvedUpdateStrategy.kind === 'live') {
        return createLiveUpdateStrategy(
            environmentApiKey,
            api.ws,
            resolvedUpdateStrategy.options
                ? resolvedUpdateStrategy.options
                : {},
        )
    }
    if (resolvedUpdateStrategy.kind === 'polling') {
        return createPollingUpdateStrategy(
            environmentApiKey,
            api.http,
            resolvedUpdateStrategy.options?.intervalMs ||
                pollingIntervalDefault,
            fetchInstance,
        )
    }
    if (resolvedUpdateStrategy.kind === 'on-request') {
        return createOnRequestUpdateStrategy(
            environmentApiKey,
            api.http,
            resolvedUpdateStrategy.options?.maxAgeMs || maxAgeDefault,
            fetchInstance,
        )
    }
    if (resolvedUpdateStrategy.kind === 'manual') {
        return createManualUpdateStrategy(
            environmentApiKey,
            api.http,
            fetchInstance,
        )
    }

    throw new Error('Unknown update strategy: ' + updateStrategy)
}

function toUpdateStrategyOptions(
    updateStrategy: UpdateStrategies['kind'] | UpdateStrategies | undefined,
): UpdateStrategies {
    if (!updateStrategy) {
        return { kind: 'polling' }
    }

    if (typeof updateStrategy === 'string') {
        return {
            kind: updateStrategy,
        }
    }

    return updateStrategy
}
