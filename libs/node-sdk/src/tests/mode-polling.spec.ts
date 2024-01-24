import type { FeatureConfiguration } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { interval } from '../interval'
import { createServerClient } from '../server-client'
import { featureBoardFixture } from '../utils/featureboard-fixture'

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
                interval.set = vi.fn(() => {}) as any
                const client = createServerClient({
                    environmentApiKey: 'fake-key',
                    updateStrategy: 'polling',
                })
                await client.waitForInitialised()

                const value = client
                    .request([])
                    .getFeatureValue('my-feature', 'default-value')
                expect(value).toEqual('service-default-value')
            },
        ),
    )

    it(
        'sets up interval correctly',
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
                const handle = {}
                interval.set = vi.fn(() => {
                    return handle
                }) as any
                interval.clear = vi.fn(() => {})

                const client = createServerClient({
                    environmentApiKey: 'fake-key',
                    updateStrategy: 'polling',
                })
                client.close()

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
                http.get('https://client.featureboard.app/all', () => {
                    if (testContext.count > 1) {
                        throw new Error('Too many requests')
                    }
                    if (testContext.count > 0) {
                        return HttpResponse.json<FeatureConfiguration[]>([
                            {
                                featureKey: 'my-feature',
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
                    ])
                }),
            ],
            async () => {
                const setMock = vi.fn(() => {})
                interval.set = setMock as any

                const client = createServerClient({
                    environmentApiKey: 'fake-key',
                    updateStrategy: 'polling',
                })
                await client.waitForInitialised()

                const pollCallback = (setMock.mock.calls[0] as any)[0]
                await pollCallback()

                const value = client
                    .request([])
                    .getFeatureValue('my-feature', 'default-value')
                expect(value).toEqual('new-service-default-value')
            },
        ),
    )

    it(
        'suppresses errors during feature updates',
        featureBoardFixture(
            { countAPICalls: 0 },
            (testContext) => [
                http.get(
                    'https://client.featureboard.app/all',
                    () => {
                        testContext.countAPICalls++
                        return HttpResponse.json<FeatureConfiguration[]>([
                            {
                                featureKey: 'my-feature',
                                audienceExceptions: [],
                                defaultValue: 'service-default-value',
                            },
                        ])
                    },
                    { once: true },
                ),
                http.get('https://client.featureboard.app/all', () => {
                    testContext.countAPICalls++
                    return new Response(null, {
                        status: 429,
                        headers: { 'Retry-After': '2' },
                    })
                }),
            ],
            async ({ testContext }) => {
                const client = createServerClient({
                    environmentApiKey: 'fake-key',
                    updateStrategy: {
                        kind: 'polling',
                        options: { intervalMs: 100 },
                    },
                })
                await client.waitForInitialised()
                // Wait for the interval to expire
                await new Promise((resolve) => setTimeout(resolve, 100))
                const requestClient1 = await client.request([])
                const value1 = requestClient1.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value1).toEqual('service-default-value')
                // Wait for interval to expire
                await new Promise((resolve) => setTimeout(resolve, 100))
                const requestClient2 = await client.request([])
                const value2 = requestClient2.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value2).toEqual('service-default-value')
                expect(testContext.countAPICalls).toBe(2)
                expect.assertions(3)
            },
        ),
    )
})
declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
