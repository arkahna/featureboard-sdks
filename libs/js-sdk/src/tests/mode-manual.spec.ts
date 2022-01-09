import { EffectiveFeatureValue } from '@featureboard/contracts'
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from '../client'
import { FetchMock } from './fetch-mock'

describe('Manual update mode', () => {
    it('fetches initial values', async () => {
        const fetchMock = new FetchMock()

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
            updateStrategy: 'manual',
            fetchInstance: fetchMock.instance,
        })
        await client.waitForInitialised()

        const value = client.client.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(value).toEqual('service-default-value')
    })

    it('can manually update values', async () => {
        const fetchMock = new FetchMock()

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
            updateStrategy: 'manual',
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
        await client.updateFeatures()

        const value = client.client.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(value).toEqual('new-service-default-value')
    })

    it('close', async () => {
        const fetchMock = new FetchMock()

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
            updateStrategy: 'manual',
            fetchInstance: fetchMock.instance,
        })

        client.close()
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
