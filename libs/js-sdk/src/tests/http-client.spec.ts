import { EffectiveFeatureValue } from '@featureboard/contracts'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { PromiseCompletionSource } from 'promise-completion-source'
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from '../client'
import { MemoryEffectiveFeatureStore } from '../effective-feature-store'
import { featureBoardHostedService } from '../featureboard-service-urls'

describe('http client', () => {
    it('can wait for initialisation', async () => {
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

    it('can wait for initialisation', async () => {
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

        const audienceLoadPromise = new PromiseCompletionSource<void>()
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/effective',
                async (req, res, ctx) => {
                    if (
                        req.url.searchParams.get('audiences') ===
                        'test-audience'
                    ) {
                        const newLastModified = new Date().toISOString()

                        await audienceLoadPromise.promise

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
            const initialValue = httpClient.client.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(initialValue).toEqual('service-default-value')

            const updatingAudiencePromise = httpClient.updateAudiences([
                'test-audience',
            ])

            expect(httpClient.initialised).toBe(false)
            const loadingValue = httpClient.client.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(loadingValue).toEqual('default-value')

            audienceLoadPromise.resolve()
            await updatingAudiencePromise

            expect(httpClient.initialised).toBe(true)
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
})
