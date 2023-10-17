import { EffectiveFeatureValue } from '@featureboard/contracts'
import { Features } from '.'
import { createClientInternal } from './create-client'
import { EffectiveFeatureStateStore } from './effective-feature-state-store'
import { FeatureBoardClient } from './features-client'

/**
 * Creates a FeatureBoard client which can be used to manually set feature values rather than using the FeatureBoard service
 */
export function createManualClient(initialState: {
    audiences: string[]
    values: {
        [K in keyof Features]: Features[K]
    }
}): FeatureBoardClient & {
    set<T extends keyof Features>(featureKey: T, value: Features[T]): void
} {
    const stateStore = new EffectiveFeatureStateStore(
        initialState.audiences,
        Object.keys(initialState.values)
            .map((key) => ({
                featureKey: key,
                value: initialState.values[key],
            }))
            .filter(
                (
                    value,
                ): value is {
                    featureKey: string
                    value: EffectiveFeatureValue['value']
                } => value.value !== undefined,
            ),
    )
    const client = createClientInternal(stateStore)

    return {
        ...client,
        set(featureKey, value) {
            stateStore.set(featureKey as string, value)
        },
    }
}
