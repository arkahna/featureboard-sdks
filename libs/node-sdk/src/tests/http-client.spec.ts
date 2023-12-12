import type { FeatureConfiguration } from '@featureboard/contracts'
import { featureBoardHostedService } from '@featureboard/js-sdk'
import { HttpResponse, http } from 'msw'
import { expect, it } from 'vitest'
import { createServerClient } from '../server-client'
import { featureBoardFixture } from '../utils/featureboard-fixture'
import { MockExternalStateStore } from './mock-external-state-store'

it(
    'calls featureboard /all endpoint on creation',
    featureBoardFixture(
        {},
        () => [
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'service-default-value',
                        },
                    ]),
                { once: true },
            ),
        ],
        async () => {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })

            const valueBeforeInit = httpClient
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(httpClient.initialised).toBe(false)
            expect(valueBeforeInit).toBe('default-value')

            await httpClient.waitForInitialised()

            const valueAfterInit = httpClient
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(httpClient.initialised).toBe(true)
            expect(valueAfterInit).toBe('service-default-value')
        },
    ),
)

it(
    'can wait for initialisation',
    featureBoardFixture(
        {},
        () => [
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'service-default-value',
                        },
                    ]),
                { once: true },
            ),
        ],
        async () => {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })
            await httpClient.waitForInitialised()

            const value = httpClient
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(httpClient.initialised).toBe(true)
            expect(value).toBe('service-default-value')
        },
    ),
)

it(
    'Gets value using audience exceptions',
    featureBoardFixture(
        {},
        () => [
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [
                                {
                                    audienceKey: 'my-audience',
                                    value: 'audience-exception-value',
                                },
                            ],
                            defaultValue: 'service-default-value',
                        },
                    ]),
                { once: true },
            ),
        ],
        async () => {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })
            await httpClient.waitForInitialised()

            const value = httpClient
                .request(['my-audience'])
                .getFeatureValue('my-feature', 'default-value')
            expect(httpClient.initialised).toBe(true)
            expect(value).toBe('audience-exception-value')
        },
    ),
)

it(
    'can manually fetch updates',
    featureBoardFixture(
        { count: 0 },
        (testContext) => [
            http.get('https://client.featureboard.app/all', () => {
                if (testContext.count > 0) {
                    return HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'new-service-default-value',
                        },
                        {
                            featureKey: 'my-feature-3',
                            audienceExceptions: [],
                            defaultValue: 'new-service-default-value',
                        },
                    ])
                }

                testContext.count++
                return HttpResponse.json<FeatureConfiguration[]>([
                    {
                        featureKey: 'my-feature',
                        audienceExceptions: [],
                        defaultValue: 'service-default-value',
                    },
                    {
                        featureKey: 'my-feature-2',
                        audienceExceptions: [],
                        defaultValue: 'service-default-value',
                    },
                ])
            }),
        ],
        async () => {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })
            await httpClient.waitForInitialised()
            await httpClient.updateFeatures()

            const value = httpClient
                .request([])
                .getFeatureValue('my-feature', 'default-value')

            const value2 = httpClient
                .request([])
                .getFeatureValue('my-feature-2', 'default-value')

            const value3 = httpClient
                .request([])
                .getFeatureValue('my-feature-3', 'default-value')
            expect(httpClient.initialised).toBe(true)
            expect(value).toBe('new-service-default-value')
            // This was removed from the server
            expect(value2).toBe('default-value')
            expect(value3).toBe('new-service-default-value')
        },
    ),
)

// Below tests are testing behavior around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
it(
    'Attaches etag header to update requests',
    featureBoardFixture(
        { lastModified: new Date().toISOString() },
        (testContext) => [
            http.get('https://client.featureboard.app/all', ({ request }) => {
                if (
                    request.headers.get('if-none-match') ===
                    testContext.lastModified
                ) {
                    return new Response(null, { status: 304 })
                }

                return HttpResponse.json<FeatureConfiguration[]>(
                    [
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'service-default-value',
                        },
                    ],
                    {
                        headers: {
                            etag: testContext.lastModified,
                        },
                    },
                )
            }),
        ],
        async () => {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })

            await httpClient.updateFeatures()
        },
    ),
)

it(
    'Initialisation fails, reties and succeeds, no external state store',
    featureBoardFixture(
        {},
        () => [
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json(
                        { message: 'Test FeatureBoard API Error' },
                        { status: 500 },
                    ),
                { once: true },
            ),
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'service-value',
                        },
                    ]),
                { once: true },
            ),
        ],
        async () => {
            const client = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })

            await client.waitForInitialised()
            expect(client.initialised).toEqual(true)
            const value = client
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(value).toEqual('service-value')
        },
    ),
)

it(
    'Initialisation retries 5 time then throws an error, no external state store',
    featureBoardFixture(
        { count: 0 },
        (testContext) => [
            http.get('https://client.featureboard.app/all', () => {
                testContext.count++
                return HttpResponse.json(
                    {
                        message: 'Test FeatureBoard API Error',
                    },
                    { status: 500 },
                )
            }),
        ],
        async ({ testContext }) => {
            const client = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })

            await expect(async () => {
                await client.waitForInitialised()
            }).rejects.toThrowError('500')
            expect(testContext.count).toEqual(2 + 1) // initial request and 5 retry
        },
    ),
)

it(
    'Use external state store when API request fails',
    featureBoardFixture(
        {},
        () => [
            http.get('https://client.featureboard.app/all', () => {
                return HttpResponse.json(
                    { message: 'Test FeatureBoard API Error' },
                    { status: 500 },
                )
            }),
        ],
        async () => {
            const client = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
                externalStateStore: new MockExternalStateStore(
                    () =>
                        Promise.resolve({
                            'my-feature': {
                                featureKey: 'my-feature',
                                defaultValue: 'external-state-store-value',
                                audienceExceptions: [],
                            },
                        }),
                    () => {
                        return Promise.resolve()
                    },
                ),
            })

            await client.waitForInitialised()
            expect(client.initialised).toEqual(true)
            const value = client
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(value).toEqual('external-state-store-value')
        },
    ),
)

it(
    'Initialisation retries 5 time then throws an error with external state store',
    featureBoardFixture(
        { countAPIRequest: 0 },
        (testContext) => [
            http.get('https://client.featureboard.app/all', () => {
                testContext.countAPIRequest++
                return HttpResponse.json(
                    { message: 'Test FeatureBoard API Error' },
                    { status: 500 },
                )
            }),
        ],
        async ({ testContext }) => {
            let countExternalStateStoreRequest = 0
            const client = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
                externalStateStore: new MockExternalStateStore(
                    () => {
                        countExternalStateStoreRequest++
                        return Promise.reject({
                            message: 'Test External State Store Error',
                        })
                    },
                    () => {
                        return Promise.resolve()
                    },
                ),
            })

            await expect(async () => {
                await client.waitForInitialised()
            }).rejects.toThrowError('Test External State Store Error')
            expect(testContext.countAPIRequest).toEqual(2 + 1) // initial request and 5 retry
            expect(countExternalStateStoreRequest).toEqual(2 + 1) // initial request and 5 retry
        },
    ),
)

it(
    'Update external state store when internal store updates',
    featureBoardFixture(
        {},
        () => [
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'service-value',
                        },
                    ]),
                { once: true },
            ),
        ],
        async () => {
            expect.assertions(1)

            const client = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
                externalStateStore: new MockExternalStateStore(
                    () =>
                        Promise.resolve({
                            'my-feature': {
                                featureKey: 'my-feature',
                                defaultValue: 'external-state-store-value',
                                audienceExceptions: [],
                            },
                        }),
                    (store) => {
                        expect(store['my-feature']?.defaultValue).toEqual(
                            'service-value',
                        )
                        return Promise.resolve()
                    },
                ),
            })
            await client.waitForInitialised()
        },
    ),
)

it(
    'Catch error when update external state store throws error',
    featureBoardFixture(
        {},
        () => [
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'service-value',
                        },
                    ]),
                { once: true },
            ),
        ],
        async () => {
            expect.assertions(1)

            const client = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
                externalStateStore: new MockExternalStateStore(
                    () =>
                        Promise.resolve({
                            'my-feature': {
                                featureKey: 'my-feature',
                                defaultValue: 'external-state-store-value',
                                audienceExceptions: [],
                            },
                        }),
                    (store) => {
                        expect(store['my-feature']?.defaultValue).toEqual(
                            'service-value',
                        )
                        return Promise.reject()
                    },
                ),
            })
            await client.waitForInitialised()
        },
    ),
)

it(
    'Subscription to feature value immediately return current value but will not be called again',
    featureBoardFixture(
        {},
        () => [
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'service-value',
                        },
                    ]),
                { once: true },
            ),
            http.get('https://client.featureboard.app/all', () =>
                HttpResponse.json<FeatureConfiguration[]>([
                    {
                        featureKey: 'my-feature',
                        audienceExceptions: [],
                        defaultValue: 'service-value2',
                    },
                ]),
            ),
        ],
        async () => {
            let count = 0
            expect.assertions(2)

            const client = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })

            await client.waitForInitialised()

            client
                .request([])
                .subscribeToFeatureValue(
                    'my-feature',
                    'default-value',
                    (value) => {
                        count++
                        expect(value).toEqual('service-value')
                    },
                )

            await client.updateFeatures()

            expect(count).toEqual(1)
        },
    ),
)
