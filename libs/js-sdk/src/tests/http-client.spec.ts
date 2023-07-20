import { EffectiveFeatureValue } from '@featureboard/contracts'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from '../client'
import { featureBoardHostedService } from '../featureboard-service-urls'
import { MockExternalStateStore } from './mock-external-state-store'

describe('http client', () => {
    it('can wait for initialisation, initialised false', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) => res(ctx.json(values), ctx.status(200)),
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
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) => res(ctx.json(values), ctx.status(200)),
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
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) => res.once(ctx.json(values), ctx.status(200)),
            ),
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) =>
                    res.once(ctx.json(newValues), ctx.status(200)),
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

    // Below tests are testing behaviour around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
    it('Attaches last modified header to update requests', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()
        let matched = false
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) =>
                    res.once(
                        ctx.json(values),
                        ctx.status(200),
                        ctx.set({
                            'Last-Modified': lastModified,
                        }),
                    ),
            ),
            rest.get(
                'https://client.featureboard.app/effective',
                (req, res, ctx) => {
                    if (req.headers.get('if-modified-since') === lastModified) {
                        matched = true
                        return res.once(ctx.status(304))
                    }

                    console.warn('Request Mismatch', req.url, lastModified)
                    return res()
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
            rest.get(
                'https://client.featureboard.app/effective',
                (req, res, ctx) => {
                    if (req.headers.get('if-modified-since') === lastModified) {
                        const newLastModified = new Date().toISOString()
                        return res(
                            ctx.json(newValues),
                            ctx.status(200),
                            ctx.set({
                                'Last-Modified': newLastModified,
                            }),
                        )
                    }
                    return res(
                        ctx.json(values),
                        ctx.status(200),
                        ctx.set({
                            'Last-Modified': lastModified,
                        }),
                    )
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
            rest.get(
                'https://client.featureboard.app/effective',
                (req, res, ctx) => {
                    if (
                        req.url.searchParams.get('audiences') ===
                        'test-audience'
                    ) {
                        const newLastModified = new Date().toISOString()
                        return res(
                            ctx.json(newValues),
                            ctx.status(200),
                            ctx.set({
                                'Last-Modified': newLastModified,
                            }),
                        )
                    }
                    return res(
                        ctx.json(values),
                        ctx.status(200),
                        ctx.set({
                            'Last-Modified': lastModified,
                        }),
                    )
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
            rest.get(
                'https://client.featureboard.app/effective',
                (req, res, ctx) => {
                    if (
                        req.url.searchParams.get('audiences') ===
                        'test-audience'
                    ) {
                        const newLastModified = new Date().toISOString()
                        return res(
                            ctx.json(newValues),
                            ctx.status(200),
                            ctx.set({
                                'Last-Modified': newLastModified,
                            }),
                        )
                    }
                    if (count > 0) {
                        lastModified = new Date().toISOString()
                    }

                    count++
                    return res(
                        ctx.json(values),
                        ctx.status(200),
                        ctx.set({
                            'Last-Modified': lastModified,
                        }),
                    )
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

    it('Initialisation fails and retries, no external state store', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-value',
            },
        ]
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) =>
                    res.once(
                        ctx.json({ message: 'Test Server Request Error' }),
                        ctx.status(500),
                    ),
            ),
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) => res(ctx.json(values), ctx.status(200)),
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
        'Initialisation retries 5 times when request fails, no external state store',
        async () => {
            let count = 0
            const server = setupServer(
                rest.get(
                    'https://client.featureboard.app/effective',
                    (_req, res, ctx) => {
                        count++
                        return res(
                            ctx.json({ message: 'Test Server Request Error' }),
                            ctx.status(500),
                        )
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
                expect(count).toEqual(5 + 1) // inital request and 5 retry
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
        { timeout: 600000 },
    )

    it('Use external state store when service request fails', async () => {
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) =>
                    res(
                        ctx.json({ message: 'Test Server Request Error' }),
                        ctx.status(500),
                    ),
            ),
        )
        server.listen()

        try {
            const client = createBrowserClient({
                environmentApiKey: 'env-api-key',
                audiences: [],
                api: featureBoardHostedService,
                externalStateStore: new MockExternalStateStore(
                    () =>
                        Promise.resolve({
                            'my-feature': 'external-state-store-value',
                        }),
                    () => {},
                ),
                updateStrategy: { kind: 'manual' },
            })

            await client.waitForInitialised()
            expect(client.initialised).toEqual(true)
            const value = client.client.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(value).toEqual('external-state-store-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it(
        'Retries 5 times when service fails and external state store fails',
        async () => {
            let countServiceRequest = 0
            let countExternalStateStoreRequest = 0
            const server = setupServer(
                rest.get(
                    'https://client.featureboard.app/effective',
                    (_req, res, ctx) => {
                        countServiceRequest++
                        return res(
                            ctx.json({ message: 'Test Server Request Error' }),
                            ctx.status(500),
                        )
                    },
                ),
            )
            server.listen()
            try {
                const client = createBrowserClient({
                    environmentApiKey: 'env-api-key',
                    audiences: [],
                    api: featureBoardHostedService,
                    externalStateStore: new MockExternalStateStore(
                        () => {
                            countExternalStateStoreRequest++
                            return Promise.reject({
                                message: 'Test External State Store Error',
                            })
                        },
                        () => {},
                    ),
                    updateStrategy: { kind: 'manual' },
                })

                await client.waitForInitialised()

                // 5 retry and initial call
                expect(countServiceRequest).toEqual(5 + 1)
                expect(countExternalStateStoreRequest).toEqual(5 + 1)
            } finally {
                server.resetHandlers()
                server.close()
            }
        },
        { timeout: 60000 },
    )

    it('Update external state store', async () => {
        expect.assertions(2)

        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-value',
            },
            {
                featureKey: 'my-feature2',
                value: 'service-value2',
            },
        ]
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) => res(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()
        try {
            const client = createBrowserClient({
                environmentApiKey: 'env-api-key',
                audiences: [],
                api: featureBoardHostedService,
                externalStateStore: new MockExternalStateStore(
                    () =>
                        Promise.resolve({
                            'my-feature': 'external-state-store-value',
                        }),
                    (store) => {
                        expect(store['my-feature']).toEqual('service-value')
                        expect(store['my-feature2']).toEqual('service-value2')
                    },
                ),
                updateStrategy: { kind: 'manual' },
            })

            await client.waitForInitialised()
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Feature value subscription called during initalisation', async () => {
        let count = 0
        expect.assertions(2)
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-value',
            },
        ]
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) => res(ctx.json(values), ctx.status(200)),
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

    it('Feature value subscription called during initalisation with external state store', async () => {
        let count = 0
        expect.assertions(2)
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) =>
                    res(
                        ctx.json({ message: 'Test Server Request Error' }),
                        ctx.status(500),
                    ),
            ),
        )
        server.listen()

        try {
            const httpClient = createBrowserClient({
                environmentApiKey: 'env-api-key',
                audiences: [],
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
                externalStateStore: new MockExternalStateStore(
                    async () =>
                        Promise.resolve({
                            'my-feature': 'external-state-store-value',
                        }),
                    () => {},
                ),
            })

            httpClient.client.subscribeToFeatureValue(
                'my-feature',
                'default-value',
                (value) => {
                    if (count == 0) {
                        count++
                        expect(value).toEqual('default-value')
                    } else {
                        expect(value).toEqual('external-state-store-value')
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
