import { FeatureConfiguration } from '@featureboard/contracts'
import { FetchMock } from '@featureboard/js-sdk/src/tests/fetch-mock'
import { describe, expect, it } from 'vitest'
import { createServerClient } from '../server-client'

describe('On request update mode', () => {
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
            updateStrategy: 'on-request',
            fetchInstance: fetchMock.instance,
        })
        await client.waitForInitialised()

        const requestClient = await client.request([])
        const value = requestClient.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(value).toEqual('service-default-value')
    })

    it('throws if request() is not awaited in request mode', async () => {
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
            updateStrategy: 'on-request',
            fetchInstance: fetchMock.instance,
        })

        expect(() =>
            client.request([]).getFeatureValue('my-feature', 'default-value'),
        ).toThrow(
            'request() must be awaited when using on-request update strategy',
        )
    })

    // To reduce load on the FeatureBoard server, we only fetch the values once they are considered old
    // The maxAge can be configured in the client to be 0 to always check for updates
    it('does not fetch update when response is not expired', async () => {
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

        const connection = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: 'on-request',
            fetchInstance: fetchMock.instance,
        })

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

        const client = await connection.request([])
        expect(client.getFeatureValue('my-feature', 'default-value')).toEqual(
            'service-default-value',
        )
    })

    it('fetches update when response is expired', async () => {
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

        const connection = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: { kind: 'on-request', options: { maxAgeMs: 1 } },
            fetchInstance: fetchMock.instance,
        })
        await connection.waitForInitialised()

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

        // Ensure response has expired
        await new Promise((resolve) => setTimeout(resolve, 2))

        const client = await connection.request([])
        expect(client.getFeatureValue('my-feature', 'default-value')).toEqual(
            'new-service-default-value',
        )
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
