import {
    TooManyRequestsError,
    type EffectiveFeatureValue,
} from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from '../create-browser-client'
import { featureBoardFixture } from '../featureboard-fixture'
import { featureBoardHostedService } from '../featureboard-service-urls'

describe('http client', () => {
    it(
        'can wait for initialisation, initialised false',
        featureBoardFixture(
            {},
            () => [
                http.get('https://client.featureboard.app/effective', () => {
                    const values: EffectiveFeatureValue[] = [
                        {
                            featureKey: 'my-feature',
                            value: 'service-default-value',
                        },
                    ]

                    return HttpResponse.json(values)
                }),
            ],
            async () => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )

                expect(httpClient.initialised).toEqual(false)
                expect(value).toEqual('default-value')
                await httpClient.waitForInitialised()
                expect(httpClient.initialised).toEqual(true)
            },
        ),
    )

    it(
        'can wait for initialisation, initialised true',
        featureBoardFixture(
            {},
            () => [
                http.get('https://client.featureboard.app/effective', () => {
                    const values: EffectiveFeatureValue[] = [
                        {
                            featureKey: 'my-feature',
                            value: 'service-default-value',
                        },
                    ]
                    return HttpResponse.json(values)
                }),
            ],
            async () => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
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
            },
        ),
    )

    it(
        'can trigger manual update',
        featureBoardFixture(
            {},
            () => [
                http.get(
                    'https://client.featureboard.app/effective',
                    () =>
                        HttpResponse.json<EffectiveFeatureValue[]>([
                            {
                                featureKey: 'my-feature',
                                value: 'service-default-value',
                            },
                        ]),
                    { once: true },
                ),
                http.get(
                    'https://client.featureboard.app/effective',
                    () =>
                        HttpResponse.json<EffectiveFeatureValue[]>([
                            {
                                featureKey: 'my-feature',
                                value: 'new-service-default-value',
                            },
                        ]),
                    { once: true },
                ),
            ],
            async () => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await httpClient.waitForInitialised()
                await httpClient.updateFeatures()

                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('new-service-default-value')
            },
        ),
    )

    // Below tests are testing behavior around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
    it(
        'attaches etag header to update requests',
        featureBoardFixture(
            { matched: false, lastModified: new Date().toISOString() },
            (context) => [
                http.get(
                    'https://client.featureboard.app/effective',
                    () => {
                        const values: EffectiveFeatureValue[] = [
                            {
                                featureKey: 'my-feature',
                                value: 'service-default-value',
                            },
                        ]

                        return HttpResponse.json(values, {
                            headers: { etag: context.lastModified },
                        })
                    },
                    { once: true },
                ),
                http.get(
                    'https://client.featureboard.app/effective',
                    ({ request }) => {
                        if (
                            request.headers.get('if-none-match') ===
                            context.lastModified
                        ) {
                            context.matched = true
                            return new Response(null, { status: 304 })
                        }

                        console.warn(
                            'Request Mismatch',
                            request.url,
                            request.headers.get('if-none-match'),
                            context.lastModified,
                        )
                        return HttpResponse.json({}, { status: 500 })
                    },
                    { once: true },
                ),
            ],
            async ({ testContext }) => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })
                await httpClient.waitForInitialised()
                await httpClient.updateFeatures()

                expect(testContext.matched).toEqual(true)
            },
        ),
    )

    it(
        'handles updates from server',
        featureBoardFixture(
            { lastModified: new Date().toISOString() },
            (testContext) => [
                http.get(
                    'https://client.featureboard.app/effective',
                    ({ request }) => {
                        const ifNoneMatchHeader =
                            request.headers.get('if-none-match')

                        if (ifNoneMatchHeader === testContext.lastModified) {
                            const newLastModified = new Date().toISOString()
                            return HttpResponse.json<EffectiveFeatureValue[]>(
                                [
                                    {
                                        featureKey: 'my-feature',
                                        value: 'new-service-default-value',
                                    },
                                ],
                                {
                                    headers: { etag: newLastModified },
                                },
                            )
                        }

                        return HttpResponse.json<EffectiveFeatureValue[]>(
                            [
                                {
                                    featureKey: 'my-feature',
                                    value: 'service-default-value',
                                },
                                {
                                    featureKey: 'my-feature-2',
                                    value: 'service-default-value',
                                },
                            ],
                            {
                                headers: {
                                    etag: testContext.lastModified,
                                },
                            },
                        )
                    },
                ),
            ],
            async () => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await httpClient.waitForInitialised()
                await httpClient.updateFeatures()

                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('new-service-default-value')

                const value2 = httpClient.client.getFeatureValue(
                    'my-feature-2',
                    'default-value',
                )
                expect(value2).toEqual('default-value')
            },
        ),
    )

    it(
        'can start with last known good config',
        featureBoardFixture(
            {},

            () => [
                http.get('https://client.featureboard.app/effective', () =>
                    HttpResponse.json({}, { status: 500 }),
                ),
            ],
            async ({}) => {
                const client = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    api: featureBoardHostedService,
                    audiences: ['audience1'],
                    initialValues: [
                        {
                            featureKey: 'my-feature',
                            value: 'service-default-value',
                        },
                    ],
                    updateStrategy: { kind: 'manual' },
                })

                const value = client.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(client.initialised).toEqual(false)
                expect(value).toEqual('service-default-value')
                await expect(async () => {
                    await client.waitForInitialised()
                }).rejects.toThrowError('500')
                expect(client.initialised).toEqual(true)
            },
        ),
    )

    it(
        'handles updating audience',
        featureBoardFixture(
            { lastModified: new Date().toISOString() },
            ({ lastModified }) => [
                http.get(
                    'https://client.featureboard.app/effective',
                    ({ request }) => {
                        const url = new URL(request.url)
                        if (
                            url.searchParams.get('audiences') ===
                            'test-audience'
                        ) {
                            const newLastModified = new Date().toISOString()
                            return HttpResponse.json<EffectiveFeatureValue[]>(
                                [
                                    {
                                        featureKey: 'my-feature',
                                        value: 'new-service-default-value',
                                    },
                                ],
                                {
                                    headers: { etag: newLastModified },
                                },
                            )
                        }

                        return HttpResponse.json<EffectiveFeatureValue[]>(
                            [
                                {
                                    featureKey: 'my-feature',
                                    value: 'service-default-value',
                                },
                            ],
                            {
                                headers: { etag: lastModified },
                            },
                        )
                    },
                ),
            ],
            async () => {
                expect.assertions(4)

                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await httpClient.waitForInitialised()

                expect(httpClient.initialised).toEqual(true)

                httpClient.subscribeToInitialisedChanged((init) => {
                    expect(httpClient.initialised).toEqual(true)
                    const value = httpClient.client.getFeatureValue(
                        'my-feature',
                        'default-value',
                    )
                    expect(value).toEqual('new-service-default-value')
                })

                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('service-default-value')

                await httpClient.updateAudiences(['test-audience'])
                await httpClient.waitForInitialised()
            },
        ),
    )

    it(
        'subscribe and unsubscribe to initialised changes',
        featureBoardFixture(
            { lastModified: new Date().toISOString(), count: 0 },
            (testContext) => [
                http.get(
                    'https://client.featureboard.app/effective',
                    ({ request }) => {
                        const url = new URL(request.url)
                        if (
                            url.searchParams.get('audiences') ===
                            'test-audience'
                        ) {
                            const newLastModified = new Date().toISOString()
                            return HttpResponse.json<EffectiveFeatureValue[]>(
                                [
                                    {
                                        featureKey: 'my-feature',
                                        value: 'new-service-default-value',
                                    },
                                ],
                                {
                                    headers: { etag: newLastModified },
                                },
                            )
                        }
                        if (testContext.count > 0) {
                            testContext.lastModified = new Date().toISOString()
                        }

                        testContext.count++
                        return HttpResponse.json<EffectiveFeatureValue[]>(
                            [
                                {
                                    featureKey: 'my-feature',
                                    value: 'service-default-value',
                                },
                            ],
                            {
                                headers: { etag: testContext.lastModified },
                            },
                        )
                    },
                ),
            ],
            async ({ testContext }) => {
                expect.assertions(3)

                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await httpClient.waitForInitialised()

                expect(httpClient.initialised).toEqual(true)

                const unsubscribe = httpClient.subscribeToInitialisedChanged(
                    (init: boolean) => {
                        if (!init) {
                            expect(httpClient.initialised).toEqual(false)
                        } else {
                            expect(httpClient.initialised).toEqual(true)
                        }
                    },
                )

                await httpClient.updateAudiences(['test-audience'])

                await httpClient.waitForInitialised()

                unsubscribe()

                await httpClient.updateAudiences(['test-audience-unsubscribe'])

                await httpClient.waitForInitialised()

                expect(testContext.count).equal(2)
            },
        ),
    )

    it(
        'handles updating audience with initialised false',
        featureBoardFixture(
            { lastModified: new Date().toISOString() },
            (testContext) => [
                http.get(
                    'https://client.featureboard.app/effective',
                    ({ request }) => {
                        const url = new URL(request.url)
                        if (
                            url.searchParams.get('audiences') ===
                            'test-audience'
                        ) {
                            const newLastModified = new Date().toISOString()
                            return HttpResponse.json<EffectiveFeatureValue[]>(
                                [
                                    {
                                        featureKey: 'my-feature',
                                        value: 'new-service-default-value',
                                    },
                                ],
                                {
                                    headers: { etag: newLastModified },
                                },
                            )
                        }
                        return HttpResponse.json<EffectiveFeatureValue[]>(
                            [
                                {
                                    featureKey: 'my-feature',
                                    value: 'service-default-value',
                                },
                            ],
                            {
                                headers: { etag: testContext.lastModified },
                            },
                        )
                    },
                ),
            ],
            async () => {
                expect.assertions(4)

                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                expect(httpClient.initialised).toEqual(false)

                httpClient.subscribeToInitialisedChanged((init) => {
                    if (!init) {
                        expect(httpClient.initialised).toEqual(false)
                    } else {
                        expect(httpClient.initialised).toEqual(true)
                        const value = httpClient.client.getFeatureValue(
                            'my-feature',
                            'default-value',
                        )
                        expect(value).toEqual('new-service-default-value')
                    }
                })

                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('default-value')

                httpClient.updateAudiences(['test-audience'])
                await httpClient.waitForInitialised()
            },
        ),
    )

    it(
        'throw error updating audience when SDK connection fails',
        featureBoardFixture(
            {},
            () => [
                http.get('https://client.featureboard.app/effective', () =>
                    HttpResponse.json(
                        { message: 'Test Server Request Error' },
                        { status: 500 },
                    ),
                ),
            ],
            async () => {
                expect.assertions(3)

                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                expect(httpClient.initialised).toEqual(false)

                httpClient.subscribeToInitialisedChanged((init) => {
                    expect(httpClient.initialised).toEqual(true)
                    const value = httpClient.client.getFeatureValue(
                        'my-feature',
                        'default-value',
                    )
                    expect(value).toEqual('default-value')
                })

                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('default-value')

                httpClient.updateAudiences(['test-audience'])
                await expect(async () => {
                    await httpClient.waitForInitialised()
                }).rejects.toThrowError('500')
            },
        ),
    )

    it(
        'initialisation fails and retries, no external state store',
        featureBoardFixture(
            {},
            () => [
                http.get(
                    'https://client.featureboard.app/effective',
                    () =>
                        HttpResponse.json(
                            { message: 'Test Server Request Error' },
                            { status: 500 },
                        ),
                    { once: true },
                ),
                http.get('https://client.featureboard.app/effective', () =>
                    HttpResponse.json<EffectiveFeatureValue[]>([
                        {
                            featureKey: 'my-feature',
                            value: 'service-value',
                        },
                    ]),
                ),
            ],
            async () => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await httpClient.waitForInitialised()
                expect(httpClient.initialised).toEqual(true)
                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('service-value')
            },
        ),
    )

    it(
        'initialisation retries 5 times then throws an error',
        featureBoardFixture(
            { count: 0 },
            (testContext) => [
                http.get('https://client.featureboard.app/effective', () => {
                    testContext.count++
                    return HttpResponse.json(
                        { message: 'Test Server Request Error' },
                        { status: 500 },
                    )
                }),
            ],
            async ({ testContext }) => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await expect(async () => {
                    await httpClient.waitForInitialised()
                }).rejects.toThrowError('500')
                expect(testContext.count).toEqual(2 + 1) // initial request and 2 retry
                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('default-value')
            },
        ),
    )

    it(
        'feature value subscription called during initialisation',
        featureBoardFixture(
            {},
            () => [
                http.get('https://client.featureboard.app/effective', () =>
                    HttpResponse.json<EffectiveFeatureValue[]>([
                        {
                            featureKey: 'my-feature',
                            value: 'service-value',
                        },
                    ]),
                ),
            ],
            async () => {
                let count = 0
                expect.assertions(2)
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                httpClient.client.subscribeToFeatureValue(
                    'my-feature',
                    'default-value',
                    (value) => {
                        if (count == 0) {
                            count++
                            expect(value).toEqual('default-value')
                        } else {
                            expect(value).toEqual('service-value')
                        }
                    },
                )

                await httpClient.waitForInitialised()
            },
        ),
    )

    it(
        'initialisation retries when Too Many Requests (429) returned from Client HTTP API',
        featureBoardFixture(
            { count: 0 },
            (testContext) => [
                http.get('https://client.featureboard.app/effective', () => {
                    testContext.count++
                    if (testContext.count <= 2) {
                        return new Response(null, {
                            status: 429,
                            headers: { 'Retry-After': '1' },
                        })
                    }
                    return HttpResponse.json<EffectiveFeatureValue[]>(
                        [
                            {
                                featureKey: 'my-feature',
                                value: 'service-value',
                            },
                        ],
                        {
                            headers: {
                                etag: new Date().toISOString(),
                            },
                        },
                    )
                }),
            ],
            async ({ testContext }) => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })
                await httpClient.waitForInitialised()
                httpClient.close()

                expect(testContext.count).toBe(3)
            },
        ),
    )

    it(
        'update features blocked after Too Many Requests (429) received with retry-after header using seconds',
        featureBoardFixture(
            { count: 0 },
            (testContext) => [
                http.get(
                    'https://client.featureboard.app/effective',
                    () => {
                        testContext.count++
                        return HttpResponse.json<EffectiveFeatureValue[]>(
                            [
                                {
                                    featureKey: 'my-feature',
                                    value: 'service-value',
                                },
                            ],
                            {
                                headers: {
                                    etag: new Date().toISOString(),
                                },
                            },
                        )
                    },
                    { once: true },
                ),
                http.get(
                    'https://client.featureboard.app/effective',
                    () => {
                        testContext.count++
                        return new Response(null, {
                            status: 429,
                            headers: { 'Retry-After': '1' },
                        })
                    },
                    { once: true },
                ),
                http.get('https://client.featureboard.app/effective', () => {
                    testContext.count++
                    return HttpResponse.json<EffectiveFeatureValue[]>(
                        [
                            {
                                featureKey: 'my-feature',
                                value: 'service-value',
                            },
                        ],
                        {
                            headers: {
                                etag: new Date().toISOString(),
                            },
                        },
                    )
                }),
            ],
            async ({ testContext }) => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await httpClient.waitForInitialised()
                await expect(() =>
                    httpClient.updateFeatures(),
                ).rejects.toThrowError(TooManyRequestsError)
                await expect(() =>
                    httpClient.updateFeatures(),
                ).rejects.toThrowError(TooManyRequestsError)
                await new Promise((resolve) => setTimeout(resolve, 1000))
                await httpClient.updateFeatures()

                httpClient.close()

                expect(testContext.count).toBe(3)
            },
        ),
    )

    it(
        'update features blocked after Too Many Requests (429) received with retry-after header using UTC date time',
        featureBoardFixture(
            { count: 0 },
            (testContext) => [
                http.get(
                    'https://client.featureboard.app/effective',
                    () => {
                        testContext.count++
                        return HttpResponse.json<EffectiveFeatureValue[]>(
                            [
                                {
                                    featureKey: 'my-feature',
                                    value: 'service-value',
                                },
                            ],
                            {
                                headers: {
                                    etag: new Date().toISOString(),
                                },
                            },
                        )
                    },
                    { once: true },
                ),
                http.get(
                    'https://client.featureboard.app/effective',
                    () => {
                        testContext.count++
                        const retryAfter = new Date(
                            new Date().getTime() + 1000,
                        ).toUTCString()
                        return new Response(null, {
                            status: 429,
                            headers: { 'Retry-After': retryAfter },
                        })
                    },
                    { once: true },
                ),
                http.get('https://client.featureboard.app/effective', () => {
                    testContext.count++
                    return HttpResponse.json<EffectiveFeatureValue[]>(
                        [
                            {
                                featureKey: 'my-feature',
                                value: 'service-value',
                            },
                        ],
                        {
                            headers: {
                                etag: new Date().toISOString(),
                            },
                        },
                    )
                }),
            ],
            async ({ testContext }) => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await httpClient.waitForInitialised()
                await expect(() =>
                    httpClient.updateFeatures(),
                ).rejects.toThrowError(TooManyRequestsError)
                await expect(() =>
                    httpClient.updateFeatures(),
                ).rejects.toThrowError(TooManyRequestsError)
                await new Promise((resolve) => setTimeout(resolve, 1000))
                await httpClient.updateFeatures()

                httpClient.close()

                expect(testContext.count).toBe(3)
            },
        ),
    )

    it(
        'update features blocked after Too Many Requests (429) received with undefined retry-after header',
        featureBoardFixture(
            { count: 0 },
            (testContext) => [
                http.get(
                    'https://client.featureboard.app/effective',
                    () => {
                        testContext.count++
                        return HttpResponse.json<EffectiveFeatureValue[]>(
                            [
                                {
                                    featureKey: 'my-feature',
                                    value: 'service-value',
                                },
                            ],
                            {
                                headers: {
                                    etag: new Date().toISOString(),
                                },
                            },
                        )
                    },
                    { once: true },
                ),
                http.get(
                    'https://client.featureboard.app/effective',
                    () => {
                        testContext.count++
                        return new Response(null, {
                            status: 429,
                        })
                    },
                    { once: true },
                ),
                http.get('https://client.featureboard.app/effective', () => {
                    testContext.count++
                    return HttpResponse.json<EffectiveFeatureValue[]>(
                        [
                            {
                                featureKey: 'my-feature',
                                value: 'service-value',
                            },
                        ],
                        {
                            headers: {
                                etag: new Date().toISOString(),
                            },
                        },
                    )
                }),
            ],
            async ({ testContext }) => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await httpClient.waitForInitialised()
                await expect(() =>
                    httpClient.updateFeatures(),
                ).rejects.toThrowError(TooManyRequestsError)
                await expect(() =>
                    httpClient.updateFeatures(),
                ).rejects.toThrowError(TooManyRequestsError)
                httpClient.close()
                expect(testContext.count).toBe(2)
            },
        ),
    )

    it(
        'otel disabled should not impact functionality',
        featureBoardFixture(
            {},
            () => [
                http.get('https://client.featureboard.app/effective', () => {
                    const values: EffectiveFeatureValue[] = [
                        {
                            featureKey: 'my-feature',
                            value: 'service-default-value',
                        },
                    ]
                    return HttpResponse.json(values)
                }),
            ],
            async () => {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                    options: { disableOTel: true },
                })

                await httpClient.waitForInitialised()

                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(httpClient.initialised).toEqual(true)
                expect(value).toEqual('service-default-value')
            },
        ),
    )
})
