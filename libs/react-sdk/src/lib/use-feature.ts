import { Features } from '@featureboard/js-sdk'
import React from 'react'
import { FeatureBoardContext } from './featureboard-provider'

export function useFeature<T extends keyof Features>(
    featureKey: T,
    defaultValue: Features[T],
): Features[T] {
    const fbContext = React.useContext(FeatureBoardContext)
    const [value, setValue] = React.useState(
        fbContext?.client.getFeatureValue(featureKey, defaultValue) ||
            defaultValue,
    )

    if (!fbContext?.client) {
        throw new Error('Ensure FeatureBoardProvider is set')
    }

    React.useEffect(() => {
        return fbContext.client.subscribeToFeatureValue(
            featureKey,
            defaultValue,
            (value) => setValue(value),
        )
    })

    return value
}
