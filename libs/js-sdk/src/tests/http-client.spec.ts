import { EffectiveFeatureValue } from '@featureboard/contracts'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from '../client'
import { MemoryEffectiveFeatureStore } from '../effective-feature-store'
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

    it('can start with last known good config', async () => {
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/effective',
                (_req, res, ctx) => res(ctx.status(500)),
            ),
        )
        server.listen()

        try {
            const client = createBrowserClient({
                environmentApiKey: 'env-api-key',
                audiences: [],
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

            expect(httpClient.initialised).toBeTruthy()

            httpClient.subscribeToInitialisedChanged((init: boolean) => {
                if (!init) {
                    expect(httpClient.initialised).toBeFalsy()
                } else {
                    expect(httpClient.initialised).toBeTruthy()
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

                    count = count + 1
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

            expect(httpClient.initialised).toBeTruthy()

            const unsubscribe = httpClient.subscribeToInitialisedChanged(
                (init: boolean) => {
                    if (!init) {
                        expect(httpClient.initialised).toBeFalsy()
                    } else {
                        expect(httpClient.initialised).toBeTruthy()
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
})
