import { EffectiveFeatureValue } from '@featureboard/contracts'

export interface ExternalStateStore {
    /**
     * Gets a stable copy of the feature values.
     * Will only be used during the initialisation if retriving the feature values from the API would fail.
     * */
    all(): Promise<Record<string, EffectiveFeatureValue['value'] | undefined>>
    /**
     * Update is called whenever an effective feature value is updated.
     * It can be used to keep the external state store accuret.
     * */
    update(
        store: Record<string, EffectiveFeatureValue['value'] | undefined>,
    ): void | PromiseLike<any>
}
