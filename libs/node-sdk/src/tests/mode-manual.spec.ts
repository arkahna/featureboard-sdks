import { FeatureConfiguration } from '@featureboard/contracts'
import { FetchMock } from '@featureboard/js-sdk/src/tests/fetch-mock'
import { describe, expect, it } from 'vitest'
import { createServerClient } from '../server-client'

describe('Manual update mode', () => {
    it('fetches initial values', async () => {
        const fetchMock = new FetchMock()
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
            updateStrategy: 'manual',
            fetchInstance: fetchMock.instance,
        })
        expect(client.initialised).toBe(false)
        await client.waitForInitialised()

        const value = client
            .request([])
            .getFeatureValue('my-feature', 'default-value')
        expect(value).toEqual('service-default-value')
    })

    it('can manually update values', async () => {
        const fetchMock = new FetchMock()
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
            updateStrategy: 'manual',
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
        await client.updateFeatures()

        expect(
            client.request([]).getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-service-default-value')
    })

    it('can manually update audience exception values', async () => {
        const fetchMock = new FetchMock()
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [
                    { audienceKey: 'aud', value: 'aud-value' },
                ],
                defaultValue: 'service-default-value',
            },
        ]
        fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
            status: 200,
            body: JSON.stringify(values),
        })

        const client = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: 'manual',
            fetchInstance: fetchMock.instance,
        })
        await client.waitForInitialised()

        const newValues: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [
                    { audienceKey: 'aud', value: 'new-aud-value' },
                ],
                defaultValue: 'new-service-default-value',
            },
        ]
        fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
            status: 200,
            body: JSON.stringify(newValues),
        })
        await client.updateFeatures()

        expect(
            client
                .request(['aud'])
                .getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-aud-value')
    })

    it('close', async () => {
        const fetchMock = new FetchMock()
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
            updateStrategy: 'manual',
            fetchInstance: fetchMock.instance,
        })

        client.close()
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
