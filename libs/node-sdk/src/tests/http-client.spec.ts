import { FeatureConfiguration } from '@featureboard/contracts'
import { featureBoardHostedService } from '@featureboard/js-sdk'
import fetchMock from 'fetch-mock'
import { MemoryFeatureStore } from '../feature-store'
import { createServerClient } from '../server-client'

let fetch: fetchMock.FetchMockSandbox

beforeEach(() => {
    fetch = fetchMock.sandbox()
    // Default to internal server error
    fetch.catch(500)
})

describe('http client', () => {
    it('calls featureboard /all endpoint on creation', async () => {
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

        const httpClient = createServerClient({
            environmentApiKey: 'env-api-key',
            fetch,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
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

        await httpClient.updateFeatures()
    })

    // Below tests are testing behaviour around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since

    it('Attaches last modified header to update requests', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetch.getOnce('https://client.featureboard.app/all', {
            status: 200,
            body: values,
            headers: {
                'Last-Modified': lastModified,
            },
        })

        const httpClient = createServerClient({
            environmentApiKey: 'env-api-key',
            fetch,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

        fetch.getOnce(
            {
                url: 'https://client.featureboard.app/all',
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
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetch.getOnce('https://client.featureboard.app/all', {
            status: 200,
            body: values,
            headers: {
                'Last-Modified': lastModified,
            },
        })

        const httpClient = createServerClient({
            environmentApiKey: 'env-api-key',
            fetch,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

        const newValues: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'new-service-default-value',
            },
        ]
        fetch.getOnce(
            {
                url: 'https://client.featureboard.app/all',
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
            httpClient
                .request([])
                .getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-service-default-value')
    })

    it('can start with last known good config', async () => {
        createServerClient({
            environmentApiKey: 'env-api-key',
            fetch,
            api: featureBoardHostedService,
            store: new MemoryFeatureStore([
                {
                    featureKey: 'my-feature',
                    audienceExceptions: [],
                    defaultValue: 'service-default-value',
                },
            ]),
            updateStrategy: { kind: 'manual' },
        })
    })
})
