import type { EffectiveFeatureValue } from '@featureboard/contracts'

/** Plain JavaScript FeatureBoard state representation */
export interface FeatureBoardEffectiveStateJS {
    audiences: string[]
    effectiveValues: EffectiveFeatureValue[]
}
