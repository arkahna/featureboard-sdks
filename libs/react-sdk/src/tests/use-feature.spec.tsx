import { FeatureBoardClient } from '@featureboard/js-sdk'
import { act, renderHook } from '@testing-library/react-hooks'
import { describe, expect, it } from 'vitest'
import { FeatureBoardProvider } from '../featureboard-provider'
import { useFeature } from '../use-feature'

describe('useFeature hook', () => {
    it('returns default value when client has no value', () => {
        const client: FeatureBoardClient = {
            getFeatureValue(_key, defaultValue) {
                return defaultValue
            },
            subscribeToFeatureValue: () => {
                return () => {}
            },
            getEffectiveValues: () => ({ audiences: [], effectiveValues: [] }),
        }
        const { result } = renderHook(
            () => useFeature('feature-key', 'default-val'),
            {
                wrapper: ({ children }) => (
                    <FeatureBoardProvider client={client}>
                        {children}
                    </FeatureBoardProvider>
                ),
            },
        )

        expect(result.current).toBe('default-val')
    })

    it('re-renders hook when client receives new value', () => {
        let updateValue: (value: string | number | boolean) => void

        const client: FeatureBoardClient = {
            getFeatureValue(_key, defaultValue) {
                return defaultValue
            },
            subscribeToFeatureValue: (_key, _defaultValue, onValue) => {
                updateValue = onValue

                return () => {}
            },
            getEffectiveValues: () => ({ audiences: [], effectiveValues: [] }),
        }
        const { result } = renderHook(
            () => useFeature('feature-key', 'default-val'),
            {
                wrapper: ({ children }) => (
                    <FeatureBoardProvider client={client}>
                        {children}
                    </FeatureBoardProvider>
                ),
            },
        )

        act(() => {
            updateValue('new-val')
        })

        expect(result.current).toBe('new-val')
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
