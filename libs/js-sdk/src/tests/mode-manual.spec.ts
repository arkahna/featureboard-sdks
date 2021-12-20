import { EffectiveFeatureValue } from '@featureboard/contracts'
import fetchMock from 'fetch-mock'
import { createBrowserClient } from '../client'

let fetch: fetchMock.FetchMockSandbox

beforeEach(() => {
    fetch = fetchMock.sandbox()
    // Default to internal server error
    fetch.catch(500)
})

describe('Manual update mode', () => {
    it('fetches initial values', async () => {
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

        const client = createBrowserClient({
            environmentApiKey: 'fake-key',
            audiences: [],
            updateStrategy: 'manual',
            fetch,
        })

        expect(
            client.client.getFeatureValue('my-feature', 'default-value'),
        ).toEqual('service-default-value')
    })

    it('can manually update values', async () => {
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

        const client = createBrowserClient({
            environmentApiKey: 'fake-key',
            audiences: [],
            updateStrategy: 'manual',
            fetch,
        })

        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        fetch.getOnce(
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: newValues,
            },
            { overwriteRoutes: true },
        )
        await client.updateFeatures()

        expect(
            client.client.getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-service-default-value')
    })

    it('close', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetch.get('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
        })

        const client = createBrowserClient({
            environmentApiKey: 'fake-key',
            audiences: [],
            updateStrategy: 'manual',
            fetch,
        })

        client.close()
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
