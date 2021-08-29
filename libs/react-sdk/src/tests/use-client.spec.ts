import { EffectiveFeatureValue } from '@featureboard/contracts'
import { timeout } from '@featureboard/js-sdk/src/timeout'
import { act, renderHook } from '@testing-library/react-hooks'
import fetchMock from 'fetch-mock'
import { useClient } from '../use-client'

let fetch: fetchMock.FetchMockSandbox

beforeEach(() => {
    fetch = fetchMock.sandbox()
    // Default to internal server error
    fetch.catch(500)
})

describe('useClient hook', () => {
    it('returns undefined when client has not yet initalised', async () => {
        fetch.get('https://client.featureboard.app/effective?audiences=', {
            status: 500,
        })
        const { result } = renderHook(() =>
            useClient({ apiKey: '<apikey>', audiences: [], fetch }),
        )

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve))
        })

        expect(result.current.client).toBeUndefined()
    })

    it('returns initError when client fails to initialised', async () => {
        fetch.get('https://client.featureboard.app/effective?audiences=', {
            status: 500,
        })
        timeout.set = ((cb: any) => setTimeout(cb, 0)) as any

        const { result } = renderHook(() =>
            useClient({ apiKey: '<apikey>', audiences: [], fetch }),
        )

        await act(async () => {
            // Retries on error 4 times
            await new Promise((resolve) => setTimeout(resolve))
            await new Promise((resolve) => setTimeout(resolve))
            await new Promise((resolve) => setTimeout(resolve))
            await new Promise((resolve) => setTimeout(resolve))
            await new Promise((resolve) => setTimeout(resolve))
        })

        expect(result.current.initError).toBe(
            'Failed to initialise FeatureBoard SDK (Internal Server Error): -',
        )
    })

    it('after initError can instruct sdk to reload', async () => {
        fetch.getOnce('https://client.featureboard.app/effective?audiences=', {
            status: 500,
        })
        const { result } = renderHook(() =>
            useClient({ apiKey: '<apikey>', audiences: [], fetch }),
        )
        const originalClient = result.current.client

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve))
        })

        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetch.getOnce(
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: values,
            },
            { overwriteRoutes: true },
        )

        act(() => {
            result.current.reconnect()
        })

        expect(result.current.initError).toBeUndefined()
        // Reconnect will not have a chance to complete yet
        expect(result.current.client).toBe(originalClient)

        // After a re-render
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve))
        })

        // The client should have been updated
        expect(result.current.client).not.toBe(originalClient)
    })

    it('does not re-initialise when audiences do not change', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
        })

        const { result, rerender } = renderHook(
            (props: { audiences?: string[] }) =>
                useClient({
                    apiKey: '<apikey>',
                    audiences: props.audiences || [],
                    fetch,
                }),
            { initialProps: {} },
        )

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve))
        })
        const originalClient = result.current.client
        await act(async () => {
            rerender()
        })

        expect(result.current.initError).toBeUndefined()
        expect(result.current.client).toBe(originalClient)
    })

    it('re-initialises when audiences change', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
        })
        const values1: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-value-1',
            },
        ]
        fetch.getOnce(
            'https://client.featureboard.app/effective?audiences=audience-1',
            {
                status: 200,
                body: values1,
            },
        )

        const { result, rerender } = renderHook(
            (props: { audiences?: string[] }) =>
                useClient({
                    apiKey: '<apikey>',
                    audiences: props.audiences || [],
                    fetch,
                }),
            { initialProps: {} },
        )

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve))
        })
        const originalClient = result.current.client
        await act(async () => {
            rerender({ audiences: ['audience-1'] })
            // await new Promise((resolve) => setTimeout(resolve))
        })

        expect(result.current.initError).toBeUndefined()
        expect(result.current.client).not.toBe(originalClient)
        const sdkValue = result.current.client?.getFeatureValue(
            'my-feature',
            'default-val',
        )
        expect(sdkValue).toEqual('service-value-1')
    })

    it('returns initial client when audiences change but new sdk has not initialised', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
        })
        fetch.getOnce(
            'https://client.featureboard.app/effective?audiences=audience-1',
            new Promise(() => {}),
        )

        const { result, rerender } = renderHook(
            (props: { audiences?: string[] }) =>
                useClient({
                    apiKey: '<apikey>',
                    audiences: props.audiences || [],
                    fetch,
                }),
            { initialProps: {} },
        )

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve))
        })
        const originalClient = result.current.client
        await act(async () => {
            rerender({ audiences: ['audience-1'] })
            await new Promise((resolve) => setTimeout(resolve))
        })

        expect(result.current.initError).toBeUndefined()
        expect(result.current.client).toBe(originalClient)
    })
})
