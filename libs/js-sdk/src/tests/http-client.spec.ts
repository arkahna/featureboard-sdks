import { EffectiveFeatureValue } from '@featureboard/contracts'
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from '../client'
import { MemoryEffectiveFeatureStore } from '../effective-feature-store'
import { featureBoardHostedService } from '../featureboard-service-urls'
import { FetchMock } from './fetch-mock'

describe('http client', () => {
    it('calls featureboard /effective endpoint on creation', async () => {
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

        const httpClient = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetchInstance: fetchMock.instance,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

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

        await httpClient.updateFeatures()
    })

    // Below tests are testing behaviour around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since

    it('Attaches last modified header to update requests', async () => {
        const fetchMock = new FetchMock()
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetchMock.matchOnce(
            'get',
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: JSON.stringify(values),
                headers: {
                    'Last-Modified': lastModified,
                },
            },
        )

        const httpClient = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetchInstance: fetchMock.instance,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

        fetchMock.matchOnce((path, init) =>
            init?.method?.toLocaleLowerCase() === 'get' &&
            path === 'https://client.featureboard.app/effective?audiences=' &&
            init.headers &&
            init.headers['If-Modified-Since'][0] === lastModified
                ? {
                      status: 304,
                  }
                : undefined,
        )

        await httpClient.updateFeatures()
    })

    it('Handles updates from server', async () => {
        const fetchMock = new FetchMock()
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetchMock.matchOnce(
            'get',
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: JSON.stringify(values),
                headers: {
                    'Last-Modified': lastModified,
                },
            },
        )

        const httpClient = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetchInstance: fetchMock.instance,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        fetchMock.matchOnce(
            'get',
            {
                url: 'https://client.featureboard.app/effective?audiences=',
                headers: { 'If-Modified-Since': lastModified },
            },
            {
                status: 200,
                body: JSON.stringify(newValues),
            },
        )

        await httpClient.updateFeatures()

        expect(
            httpClient.client.getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-service-default-value')
    })

    it('can start with last known good config', async () => {
        const fetchMock = new FetchMock()
        const lastModified = new Date().toISOString()
        fetchMock.matchOnce(
            'get',
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 500,
                headers: {
                    'Last-Modified': lastModified,
                },
            },
        )
        const client = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetchInstance: fetchMock.instance,
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
        const fetchMock = new FetchMock()
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        fetchMock.matchOnce(
            'get',
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: JSON.stringify(values),
                headers: {
                    'Last-Modified': lastModified,
                },
            },
        )

        const httpClient = createBrowserClient({
            environmentApiKey: 'env-api-key',
            audiences: [],
            fetchInstance: fetchMock.instance,
            api: featureBoardHostedService,
            updateStrategy: { kind: 'manual' },
        })

        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        fetchMock.matchOnce(
            'get',
            'https://client.featureboard.app/effective?audiences=test-audience',
            {
                status: 200,
                body: JSON.stringify(newValues),
            },
        )

        await httpClient.updateAudiences(['test-audience'])

        expect(
            httpClient.client.getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-service-default-value')
    })
})
