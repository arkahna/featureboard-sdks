import { EffectiveFeatureValue } from '@featureboard/contracts'
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from '../client'
import { MemoryEffectiveFeatureStore } from '../effective-feature-store'
import { featureBoardHostedService } from '../featureboard-service-urls'
import { FetchMock } from './fetch-mock'

describe('http client', () => {
    it('can wait for initialisation', async () => {
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

        const value = httpClient.client.getFeatureValue(
            'my-feature',
            'default-value',
        )

        expect(httpClient.initialised).toEqual(false)
        expect(value).toEqual('default-value')
    })

    it('can wait for initialisation', async () => {
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

        await httpClient.waitForInitialised()

        const value = httpClient.client.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(httpClient.initialised).toEqual(true)
        expect(value).toEqual('service-default-value')
    })

    it('can trigger manual update', async () => {
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

        await httpClient.waitForInitialised()

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

        const value = httpClient.client.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(value).toEqual('new-service-default-value')
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
        await httpClient.waitForInitialised()

        let matched = false
        fetchMock.matchOnce((path, init) => {
            if (
                init?.method?.toLowerCase() === 'get' &&
                path ===
                    'https://client.featureboard.app/effective?audiences=' &&
                init.headers &&
                init.headers['if-modified-since'] === lastModified
            ) {
                matched = true
                return {
                    status: 304,
                }
            }

            console.warn('Request Mismatch', path, init, lastModified)
            return undefined
        })

        await httpClient.updateFeatures()

        expect(matched).toEqual(true)
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
        await httpClient.waitForInitialised()

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
                headers: { 'if-modified-since': lastModified },
            },
            {
                status: 200,
                body: JSON.stringify(newValues),
            },
        )

        await httpClient.updateFeatures()

        const value = httpClient.client.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(value).toEqual('new-service-default-value')
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

        const value = client.client.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(client.initialised).toEqual(false)
        expect(value).toEqual('service-default-value')
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

        const value = httpClient.client.getFeatureValue(
            'my-feature',
            'default-value',
        )
        expect(value).toEqual('new-service-default-value')
    })
})
