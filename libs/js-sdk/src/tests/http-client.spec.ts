import type { EffectiveFeatureValue } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from '../create-browser-client'
import { featureBoardHostedService } from '../featureboard-service-urls'

describe('http client', () => {
    it('can wait for initialisation, initialised false', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const server = setupServer(
            http.get('https://client.featureboard.app/effective', () =>
                HttpResponse.json(values),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('can wait for initialisation, initialised true', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const server = setupServer(
            http.get('https://client.featureboard.app/effective', () =>
                HttpResponse.json(values),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('can trigger manual update', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]

        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/effective',
                () => HttpResponse.json(values),
                { once: true },
            ),
            http.get(
                'https://client.featureboard.app/effective',
                () => HttpResponse.json(newValues),
                { once: true },
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    // Below tests are testing behavior around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
    it('Attaches etag header to update requests', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        let matched = false
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/effective',
                () =>
                    HttpResponse.json(values, {
                        headers: { etag: lastModified },
                    }),
                { once: true },
            ),
            http.get(
                'https://client.featureboard.app/effective',
                ({ request }) => {
                    if (request.headers.get('if-none-match') === lastModified) {
                        matched = true
                        return new Response(null, { status: 304 })
                    }

                    console.warn('Request Mismatch', request.url, lastModified)
                    return HttpResponse.json({}, { status: 500 })
                },
                { once: true },
            ),
        )
        server.listen()

        try {
            const httpClient = createBrowserClient({
                environmentApiKey: 'env-api-key',
                audiences: [],
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })
            await httpClient.waitForInitialised()
            await httpClient.updateFeatures()

            expect(matched).toEqual(true)
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Handles updates from server', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
            {
                featureKey: 'my-feature-2',
                value: 'service-default-value',
            },
        ]
        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/effective',
                ({ request }) => {
                    const ifNoneMatchHeader =
                        request.headers.get('if-none-match')

                    if (ifNoneMatchHeader === lastModified) {
                        const newLastModified = new Date().toISOString()
                        return HttpResponse.json(newValues, {
                            headers: { etag: newLastModified },
                        })
                    }

                    return HttpResponse.json(values, {
                        headers: {
                            etag: lastModified,
                        },
                    })
                },
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it(
        'can start with last known good config',
        async () => {
            const server = setupServer(
                http.get('https://client.featureboard.app/effective', () =>
                    HttpResponse.json({}, { status: 500 }),
                ),
            )
            server.listen()

            try {
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
            } finally {
                server.resetHandlers()
                server.close()
            }
        },
        { timeout: 60000 },
    )

    it('Handles updating audience', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/effective',
                ({ request }) => {
                    const url = new URL(request.url)
                    if (url.searchParams.get('audiences') === 'test-audience') {
                        const newLastModified = new Date().toISOString()
                        return HttpResponse.json(newValues, {
                            headers: { etag: newLastModified },
                        })
                    }

                    return HttpResponse.json(values, {
                        headers: { etag: lastModified },
                    })
                },
            ),
        )
        server.listen()

        try {
            expect.assertions(5)

            const httpClient = createBrowserClient({
                environmentApiKey: 'env-api-key',
                audiences: [],
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })

            await httpClient.waitForInitialised()

            expect(httpClient.initialised).toEqual(true)

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
            expect(value).toEqual('service-default-value')

            await httpClient.updateAudiences(['test-audience'])
            await httpClient.waitForInitialised()
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Subscribe and unsubscribe to initialised changes', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        let lastModified = new Date().toISOString()
        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        let count = 0
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/effective',
                ({ request }) => {
                    const url = new URL(request.url)
                    if (url.searchParams.get('audiences') === 'test-audience') {
                        const newLastModified = new Date().toISOString()
                        return HttpResponse.json(newValues, {
                            headers: { etag: newLastModified },
                        })
                    }
                    if (count > 0) {
                        lastModified = new Date().toISOString()
                    }

                    count++
                    return HttpResponse.json(values, {
                        headers: { etag: lastModified },
                    })
                },
            ),
        )
        server.listen()

        try {
            expect.assertions(4)

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

            expect(count).equal(2)
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Handles updating audience with initialised false', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/effective',
                ({ request }) => {
                    const url = new URL(request.url)
                    if (url.searchParams.get('audiences') === 'test-audience') {
                        const newLastModified = new Date().toISOString()
                        return HttpResponse.json(newValues, {
                            headers: { etag: newLastModified },
                        })
                    }
                    return HttpResponse.json(values, {
                        headers: { etag: lastModified },
                    })
                },
            ),
        )
        server.listen()

        try {
            expect.assertions(5)

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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Throw error updating audience when SDK connection fails', async () => {
        const server = setupServer(
            http.get('https://client.featureboard.app/effective', () =>
                HttpResponse.json(
                    { message: 'Test Server Request Error' },
                    { status: 500 },
                ),
            ),
        )
        server.listen()

        try {
            expect.assertions(6)

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
                    expect(value).toEqual('default-value')
                }
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Initialisation fails and retries, no external state store', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-value',
            },
        ]
        const server = setupServer(
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
                HttpResponse.json(values),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it(
        'Initialisation retries 5 times then throws an error',
        async () => {
            let count = 0
            const server = setupServer(
                http.get('https://client.featureboard.app/effective', () => {
                    count++
                    return HttpResponse.json(
                        { message: 'Test Server Request Error' },
                        { status: 500 },
                    )
                }),
            )
            server.listen()

            try {
                const httpClient = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await expect(async () => {
                    await httpClient.waitForInitialised()
                }).rejects.toThrowError('500')
                expect(count).toEqual(5 + 1) // initial request and 5 retry
                const value = httpClient.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('default-value')
            } finally {
                server.resetHandlers()
                server.close()
            }
        },
        { timeout: 60000 },
    )

    it('Feature value subscription called during initialisation', async () => {
        let count = 0
        expect.assertions(2)
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-value',
            },
        ]
        const server = setupServer(
            http.get('https://client.featureboard.app/effective', () =>
                HttpResponse.json(values),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })
})
