import type { EffectiveFeatureValue } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBrowserClient } from '../create-browser-client'
import { featureBoardFixture } from '../featureboard-fixture'
import { interval } from '../interval'

beforeEach(() => {
    interval.set = setInterval
    interval.clear = clearInterval
})

describe('polling update mode', () => {
    it(
        'fetches initial values',
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
            ],
            async () => {
                interval.set = vi.fn(() => {}) as any

                const connection = createBrowserClient({
                    environmentApiKey: 'fake-key',
                    audiences: [],
                    updateStrategy: 'polling',
                })

                await connection.waitForInitialised()

                const value = connection.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('service-default-value')
            },
        ),
    )

    it(
        'sets up interval correctly',
        featureBoardFixture(
            {},
            () => [
                http.get('https://client.featureboard.app/effective', () =>
                    HttpResponse.json<EffectiveFeatureValue[]>([
                        {
                            featureKey: 'my-feature',
                            value: 'service-default-value',
                        },
                    ]),
                ),
            ],
            async () => {
                const handle = {}
                interval.set = vi.fn(() => {
                    return handle
                }) as any
                interval.clear = vi.fn(() => {})

                const connection = createBrowserClient({
                    environmentApiKey: 'fake-key',
                    audiences: [],
                    updateStrategy: 'polling',
                })
                connection.close()

                expect(interval.set).toBeCalled()
                expect(interval.clear).toBeCalledWith(handle)
            },
        ),
    )

    it(
        'fetches updates when interval fires',
        featureBoardFixture(
            { count: 0 },
            (testContext) => [
                http.get('https://client.featureboard.app/effective', () => {
                    if (testContext.count > 0) {
                        return HttpResponse.json<EffectiveFeatureValue[]>([
                            {
                                featureKey: 'my-feature',
                                value: 'new-service-default-value',
                            },
                        ])
                    }

                    testContext.count++
                    return HttpResponse.json<EffectiveFeatureValue[]>([
                        {
                            featureKey: 'my-feature',
                            value: 'service-default-value',
                        },
                    ])
                }),
            ],
            async () => {
                const setMock = vi.fn(() => {})
                interval.set = setMock as any

                const client = createBrowserClient({
                    environmentApiKey: 'fake-key',
                    audiences: [],
                    updateStrategy: 'polling',
                })
                await client.waitForInitialised()

                const pollCallback = (setMock.mock.calls[0] as any)[0]
                await pollCallback()

                const value = client.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('new-service-default-value')
            },
        ),
    )
    it(
        'suppress errors received during feature updates',
        featureBoardFixture(
            { countAPICalls: 0 },
            (testContext) => [
                http.get(
                    'https://client.featureboard.app/effective',
                    () => {
                        testContext.countAPICalls++
                        return HttpResponse.json<EffectiveFeatureValue[]>([
                            {
                                featureKey: 'my-feature',
                                value: 'service-default-value',
                            },
                        ])
                    },
                    { once: true },
                ),
                http.get('https://client.featureboard.app/effective', () => {
                    testContext.countAPICalls++
                    return new Response(null, {
                        status: 429,
                        headers: { 'Retry-After': '2' },
                    })
                }),
            ],
            async ({ testContext }) => {
                const client = createBrowserClient({
                    environmentApiKey: 'fake-key',
                    audiences: [],
                    updateStrategy: {
                        kind: 'polling',
                        options: { intervalMs: 100 },
                    },
                })

                await client.waitForInitialised()
                // Wait for the interval to expire
                await new Promise((resolve) => setTimeout(resolve, 100))
                const value1 = client.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value1).toEqual('service-default-value')
                // Wait for interval to expire
                await new Promise((resolve) => setTimeout(resolve, 100))
                const value2 = client.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value2).toEqual('service-default-value')
                expect(testContext.countAPICalls).toBe(2)
            },
        ),
    )
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
