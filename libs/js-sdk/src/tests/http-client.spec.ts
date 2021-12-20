import { EffectiveFeatureValue } from '@featureboard/contracts'
import fetchMock from 'fetch-mock'
import { createBrowserClient } from '../client'
import { MemoryEffectiveFeatureStore } from '../effective-feature-store'
import { featureBoardHostedService } from '../featureboard-service-urls'

let fetch: fetchMock.FetchMockSandbox

beforeEach(() => {
    fetch = fetchMock.sandbox()
    // Default to internal server error
    fetch.catch(500)
})

describe('http client', () => {
    it('calls featureboard /effective endpoint on creation', async () => {
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

        const httpClient = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetch,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
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

        await httpClient.updateFeatures()
    })

    // Below tests are testing behaviour around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since

    it('Attaches last modified header to update requests', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetch.getOnce('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
            headers: {
                'Last-Modified': lastModified,
            },
        })

        const httpClient = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetch,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

        fetch.getOnce(
            {
                url: 'https://client.featureboard.app/effective?audiences=',
                headers: { 'If-Modified-Since': lastModified },
            },
            {
                status: 304,
            },
            { overwriteRoutes: true },
        )

        await httpClient.updateFeatures()
    })

    it('Handles updates from server', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetch.getOnce('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
            headers: {
                'Last-Modified': lastModified,
            },
        })

        const httpClient = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetch,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        fetch.getOnce(
            {
                url: 'https://client.featureboard.app/effective?audiences=',
                headers: { 'If-Modified-Since': lastModified },
            },
            {
                status: 200,
                body: newValues,
            },
            { overwriteRoutes: true },
        )

        await httpClient.updateFeatures()

        expect(
            httpClient.client.getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-service-default-value')
    })

    it('can start with last known good config', async () => {
        const lastModified = new Date().toISOString()
        fetch.getOnce('https://client.featureboard.app/effective?audiences=', {
            status: 500,
            headers: {
                'Last-Modified': lastModified,
            },
        })
        const client = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetch,
            api: featureBoardHostedService,
            store: new MemoryEffectiveFeatureStore([
                {
                    featureKey: 'my-feature',
                    value: 'service-default-value',
                },
            ]),
            updateStrategy: { kind: 'manual' },
        })

        expect(
            client.client.getFeatureValue('my-feature', 'default-value'),
        ).toEqual('service-default-value')
    })

    it('Handles updating audience', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetch.getOnce('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
            headers: {
                'Last-Modified': lastModified,
            },
        })

        const httpClient = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetch,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        fetch.getOnce(
            {
                url: 'https://client.featureboard.app/effective?audiences=test-audience',
            },
            {
                status: 200,
                body: newValues,
            },
            { overwriteRoutes: true },
        )

        await httpClient.updateAudiences(['test-audience'])

        expect(
            httpClient.client.getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-service-default-value')
    })
})
