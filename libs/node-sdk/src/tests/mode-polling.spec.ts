import { FeatureConfiguration } from '@featureboard/contracts'
import { FetchMock } from '@featureboard/js-sdk/src/tests/fetch-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { interval } from '../interval'
import { createServerClient } from '../server-client'

beforeEach(() => {
    interval.set = setInterval
    interval.clear = clearInterval
})

describe('Polling update mode', () => {
    it('fetches initial values', async () => {
        const fetchMock = new FetchMock()
        interval.set = vi.fn(() => {}) as any
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
            status: 200,
            body: JSON.stringify(values),
        })

        const client = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: 'polling',
            fetchInstance: fetchMock.instance,
        })
        await client.waitForInitialised()

        const value = client
            .request([])
            .getFeatureValue('my-feature', 'default-value')
        expect(value).toEqual('service-default-value')
    })

    it('sets up interval correctly', async () => {
        const fetchMock = new FetchMock()
        const handle = {}
        interval.set = vi.fn(() => {
            return handle
        }) as any
        interval.clear = vi.fn(() => {})

        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
            status: 200,
            body: JSON.stringify(values),
        })

        const client = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: 'polling',
            fetchInstance: fetchMock.instance,
        })
        client.close()

        expect(interval.set).toBeCalled()
        expect(interval.clear).toBeCalledWith(handle)
    })

    it.only('fetches updates when interval fires', async () => {
        const fetchMock = new FetchMock()
        const setMock = vi.fn(() => {})
        interval.set = setMock as any

        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
            status: 200,
            body: JSON.stringify(values),
        })

        const client = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: 'polling',
            fetchInstance: fetchMock.instance,
        })
        await client.waitForInitialised()

        const newValues: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'new-service-default-value',
            },
        ]
        fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
            status: 200,
            body: JSON.stringify(newValues),
        })

        const pollCallback = (setMock.mock.calls[0] as any)[0]
        await pollCallback()

        const value = client
            .request([])
            .getFeatureValue('my-feature', 'default-value')
        expect(value).toEqual('new-service-default-value')
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
