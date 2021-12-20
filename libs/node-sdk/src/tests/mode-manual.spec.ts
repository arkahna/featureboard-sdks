import { FeatureConfiguration } from '@featureboard/contracts'
import fetchMock from 'fetch-mock'
import { createServerClient } from '../server-client'

let fetch: fetchMock.FetchMockSandbox

beforeEach(() => {
    fetch = fetchMock.sandbox()
    // Default to internal server error
    fetch.catch(500)
})

describe('Manual update mode', () => {
    it('fetches initial values', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        const client = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: 'manual',
            fetch,
        })

        expect(
            client.request([]).getFeatureValue('my-feature', 'default-value'),
        ).toEqual('service-default-value')
    })

    it('can manually update values', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        const client = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: 'manual',
            fetch,
        })

        const newValues: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'new-service-default-value',
            },
        ]
        fetch.getOnce(
            'https://client.featureboard.app/all',
            {
                status: 200,
                body: newValues,
            },
            { overwriteRoutes: true },
        )
        await client.updateFeatures()

        expect(
            client.request([]).getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-service-default-value')
    })

    it('can manually update audience exception values', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [
                    { audienceKey: 'aud', value: 'aud-value' },
                ],
                defaultValue: 'service-default-value',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        const client = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: 'manual',
            fetch,
        })

        const newValues: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [
                    { audienceKey: 'aud', value: 'new-aud-value' },
                ],
                defaultValue: 'new-service-default-value',
            },
        ]
        fetch.getOnce(
            'https://client.featureboard.app/all',
            {
                status: 200,
                body: newValues,
            },
            { overwriteRoutes: true },
        )
        await client.updateFeatures()

        expect(
            client
                .request(['aud'])
                .getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-aud-value')
    })

    it('close', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetch.get('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        const client = createServerClient({
            environmentApiKey: 'fake-key',
            updateStrategy: 'manual',
            fetch,
        })

        client.close()
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
