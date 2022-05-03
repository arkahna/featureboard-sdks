import { EffectiveFeatureValue } from '@featureboard/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBrowserClient } from '../client'
import { interval } from '../interval'
import { FetchMock } from './fetch-mock'

beforeEach(() => {
    interval.set = setInterval
    interval.clear = clearInterval
})

describe('Polling update mode', () => {
    it('fetches initial values', async () => {
        const fetchMock = new FetchMock()

        interval.set = vi.fn(() => {}) as any
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetchMock.matchOnce(
            'get',
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: JSON.stringify(values),
            },
        )

        const connection = createBrowserClient({
            environmentApiKey: 'fake-key',
            audiences: [],
            updateStrategy: 'polling',
            fetchInstance: fetchMock.instance,
        })

        await connection.waitForInitialised()

        const value = connection.client.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(value).toEqual('service-default-value')
    })

    it('sets up interval correctly', async () => {
        const fetchMock = new FetchMock()
        const handle = {}
        interval.set = vi.fn(() => {
            return handle
        }) as any
        interval.clear = vi.fn(() => {})

        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetchMock.match(
            'get',
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: JSON.stringify(values),
            },
        )

        const connection = createBrowserClient({
            environmentApiKey: 'fake-key',
            audiences: [],
            updateStrategy: 'polling',
            fetchInstance: fetchMock.instance,
        })
        connection.close()

        expect(interval.set).toBeCalled()
        expect(interval.clear).toBeCalledWith(handle)
    })

    it('fetches updates when interval fires', async () => {
        const fetchMock = new FetchMock()

        const setMock = vi.fn(() => {})
        interval.set = setMock as any

        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetchMock.matchOnce(
            'get',
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: JSON.stringify(values),
            },
        )

        const client = createBrowserClient({
            environmentApiKey: 'fake-key',
            audiences: [],
            updateStrategy: 'polling',
            fetchInstance: fetchMock.instance,
        })
        await client.waitForInitialised()

        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        fetchMock.matchOnce(
            'get',
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: JSON.stringify(newValues),
            },
        )

        const pollCallback = (setMock.mock.calls[0] as any)[0]
        await pollCallback()

        const value = client.client.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(value).toEqual('new-service-default-value')
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
