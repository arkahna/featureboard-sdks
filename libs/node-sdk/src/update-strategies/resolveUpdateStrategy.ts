import type { FeatureBoardApiConfig } from '@featureboard/js-sdk'
import { createManualUpdateStrategy } from './createManualUpdateStrategy'
import { createOnRequestUpdateStrategy } from './createOnRequestUpdateStrategy'
import { createPollingUpdateStrategy } from './createPollingUpdateStrategy'
import type {
    AllConfigUpdateStrategy,
    UpdateStrategies,
} from './update-strategies'
import { maxAgeDefault, pollingIntervalDefault } from './update-strategies'

export function resolveUpdateStrategy(
    updateStrategy: UpdateStrategies['kind'] | UpdateStrategies | undefined,
    environmentApiKey: string,
    api: FeatureBoardApiConfig,
): AllConfigUpdateStrategy {
    const resolvedUpdateStrategy: UpdateStrategies =
        toUpdateStrategyOptions(updateStrategy)

    // if (resolvedUpdateStrategy.kind === 'live') {
    //     return createLiveUpdateStrategy(
    //         environmentApiKey,
    //         api.ws,
    //         resolvedUpdateStrategy.options
    //             ? resolvedUpdateStrategy.options
    //             : {},
    //     )
    // }
    if (resolvedUpdateStrategy.kind === 'polling') {
        return createPollingUpdateStrategy(
            environmentApiKey,
            api.http,
            resolvedUpdateStrategy.options?.intervalMs ||
                pollingIntervalDefault,
        )
    }
    if (resolvedUpdateStrategy.kind === 'on-request') {
        return createOnRequestUpdateStrategy(
            environmentApiKey,
            api.http,
            resolvedUpdateStrategy.options?.maxAgeMs || maxAgeDefault,
        )
    }
    if (resolvedUpdateStrategy.kind === 'manual') {
        return createManualUpdateStrategy(environmentApiKey, api.http)
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
