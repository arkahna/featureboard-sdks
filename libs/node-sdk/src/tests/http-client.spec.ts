import { FeatureConfiguration } from '@featureboard/contracts'
import { featureBoardHostedService } from '@featureboard/js-sdk'
import { FetchMock } from '@featureboard/js-sdk/src/tests/fetch-mock'
import { describe, expect, it } from 'vitest'
import { MemoryFeatureStore } from '../feature-store'
import { createServerClient } from '../server-client'

describe('http client', () => {
    it('calls featureboard /all endpoint on creation', async () => {
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

        const httpClient = createServerClient({
            environmentApiKey: 'env-api-key',
            fetchInstance: fetchMock.instance,
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
        fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
            status: 200,
            body: JSON.stringify(newValues),
        })

        await httpClient.updateFeatures()
    })

    // Below tests are testing behaviour around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since

    it('Attaches last modified header to update requests', async () => {
        const fetchMock = new FetchMock()
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
            status: 200,
            body: JSON.stringify(values),
            headers: {
                'Last-Modified': lastModified,
            },
        })

        const httpClient = createServerClient({
            environmentApiKey: 'env-api-key',
            fetchInstance: fetchMock.instance,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

        fetchMock.matchOnce(
            'get',
            {
                url: 'https://client.featureboard.app/all',
                headers: { 'If-Modified-Since': lastModified },
            },
            {
                status: 304,
            },
        )

        await httpClient.updateFeatures()
    })

    it('Handles updates from server', async () => {
        const fetchMock = new FetchMock()
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
            status: 200,
            body: JSON.stringify(values),
            headers: {
                'Last-Modified': lastModified,
            },
        })

        const httpClient = createServerClient({
            environmentApiKey: 'env-api-key',
            fetchInstance: fetchMock.instance,
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
        fetchMock.matchOnce(
            'get',
            {
                url: 'https://client.featureboard.app/all',
                headers: { 'If-Modified-Since': lastModified },
            },
            {
                status: 200,
                body: JSON.stringify(newValues),
            },
        )

        await httpClient.updateFeatures()

        const value = httpClient
            .request([])
            .getFeatureValue('my-feature', 'default-value')
        expect(value).toEqual('new-service-default-value')
    })

    it.todo('can start with last known good config', async () => {
        const fetchMock = new FetchMock()
        createServerClient({
            environmentApiKey: 'env-api-key',
            fetchInstance: fetchMock.instance,
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
