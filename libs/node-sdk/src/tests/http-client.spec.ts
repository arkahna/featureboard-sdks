import { FeatureConfiguration } from '@featureboard/contracts'
import { featureBoardHostedService } from '@featureboard/js-sdk'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it } from 'vitest'
import { createServerClient } from '../server-client'
import { MockExternalStateStore } from './mock-external-state-store'

describe('http client', () => {
    it('calls featureboard /all endpoint on creation', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('can wait for initialisation', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Gets value using audience exceptions', async () => {
        const values: FeatureConfiguration[] = [
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
        ]
        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('can manually fetch updates', async () => {
        const values: FeatureConfiguration[] = [
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
        ]
        const newValues: FeatureConfiguration[] = [
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
        ]

        let count = 0
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/all',
                (_req, res, ctx) => {
                    if (count > 0) {
                        return res(ctx.json(newValues), ctx.status(200))
                    }

                    count++
                    return res(ctx.json(values), ctx.status(200))
                },
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    // Below tests are testing behavior around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
    it('Attaches etag header to update requests', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()

        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (req, res, ctx) => {
                if (req.headers.get('if-none-match') === lastModified) {
                    return res(ctx.status(304))
                }

                return res(
                    ctx.json(values),
                    ctx.status(200),
                    ctx.set({
                        'etag': lastModified,
                    }),
                )
            }),
        )
        server.listen()

        try {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })

            await httpClient.updateFeatures()
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Initialisation fails, reties and succeeds, no external state store', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-value',
            },
        ]
        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(
                    ctx.json({ message: 'Test FeatureBoard API Error' }),
                    ctx.status(500),
                ),
            ),
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it(
        'Initialisation retries 5 time then throws an error, no external state store',
        async () => {
            let count = 0
            const server = setupServer(
                rest.get(
                    'https://client.featureboard.app/all',
                    (_req, res, ctx) => {
                        count++
                        return res(
                            ctx.json({
                                message: 'Test FeatureBoard API Error',
                            }),
                            ctx.status(500),
                        )
                    },
                ),
            )
            server.listen()

            try {
                const client = createServerClient({
                    environmentApiKey: 'env-api-key',
                    api: featureBoardHostedService,
                    updateStrategy: { kind: 'manual' },
                })

                await expect(async () => {
                    await client.waitForInitialised()
                }).rejects.toThrowError('500')
                expect(count).toEqual(5 + 1) // initial request and 5 retry
            } finally {
                server.resetHandlers()
                server.close()
            }
        },
        { timeout: 60000 },
    )

    it('Use external state store when API request fails', async () => {
        const server = setupServer(
            rest.get(
                'https://client.featureboard.app/all',
                (_req, res, ctx) => {
                    return res(
                        ctx.json({ message: 'Test FeatureBoard API Error' }),
                        ctx.status(500),
                    )
                },
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it(
        'Initialisation retries 5 time then throws an error with external state store',
        async () => {
            let countAPIRequest = 0
            let countExternalStateStoreRequest = 0
            const server = setupServer(
                rest.get(
                    'https://client.featureboard.app/all',
                    (_req, res, ctx) => {
                        countAPIRequest++
                        return res(
                            ctx.json({
                                message: 'Test FeatureBoard API Error',
                            }),
                            ctx.status(500),
                        )
                    },
                ),
            )
            server.listen()

            try {
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
                expect(countAPIRequest).toEqual(5 + 1) // initial request and 5 retry
                expect(countExternalStateStoreRequest).toEqual(5 + 1) // initial request and 5 retry
            } finally {
                server.resetHandlers()
                server.close()
            }
        },
        { timeout: 60000 },
    )

    it('Update external state store when internal store updates', async () => {
        expect.assertions(1)

        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-value',
            },
        ]

        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })


    it('Catch error when update external state store throws error', async () => {
        expect.assertions(1)

        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-value',
            },
        ]

        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Subscription to feature value immediately return current value but will not be called again', async () => {
        let count = 0
        expect.assertions(2)

        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-value',
            },
        ]

        const values2ndRequest: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-value2',
            },
        ]
        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res(ctx.json(values2ndRequest), ctx.status(200)),
            ),
        )
        server.listen()

        try {
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
        } finally {
            server.resetHandlers()
            server.close()
        }
    })
})
