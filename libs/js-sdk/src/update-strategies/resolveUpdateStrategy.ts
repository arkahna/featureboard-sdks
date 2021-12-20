import { FeatureBoardApiConfig } from '@featureboard/js-sdk'
import { FetchSignature } from '../utils/FetchSignature'
import { createLiveUpdateStrategy } from './createLiveUpdateStrategy'
import { createManualUpdateStrategy } from './createManualUpdateStrategy'
import { createPollingUpdateStrategy } from './createPollingUpdateStrategy'
import {
    EffectiveConfigUpdateStrategy,
    pollingIntervalDefault,
    UpdateStrategies,
} from './update-strategies'

export function resolveUpdateStrategy(
    updateStrategy: UpdateStrategies['kind'] | UpdateStrategies | undefined,
    environmentApiKey: string,
    api: FeatureBoardApiConfig,
    audiences: string[],
    fetch: FetchSignature,
): EffectiveConfigUpdateStrategy {
    const resolvedUpdateStrategy: UpdateStrategies =
        toUpdateStrategyOptions(updateStrategy)

    if (resolvedUpdateStrategy.kind === 'live') {
        return createLiveUpdateStrategy(
            environmentApiKey,
            api.ws,
            audiences,
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
            audiences,
            fetch,
        )
    }

    if (resolvedUpdateStrategy.kind === 'manual') {
        return createManualUpdateStrategy(
            environmentApiKey,
            api.http,
            audiences,
            fetch,
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
