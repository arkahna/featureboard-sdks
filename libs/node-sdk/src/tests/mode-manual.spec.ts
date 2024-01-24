import type { FeatureConfiguration } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { createServerClient } from '../server-client'
import { featureBoardFixture } from '../utils/featureboard-fixture'

describe('manual update mode', () => {
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
                const client = createServerClient({
                    environmentApiKey: 'fake-key',
                    updateStrategy: 'manual',
                })
                expect(client.initialised).toBe(false)
                await client.waitForInitialised()

                const value = client
                    .request([])
                    .getFeatureValue('my-feature', 'default-value')
                expect(value).toEqual('service-default-value')
            },
        ),
    )

    it(
        'can manually update values',
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
                const client = createServerClient({
                    environmentApiKey: 'fake-key',
                    updateStrategy: 'manual',
                })
                await client.waitForInitialised()
                await client.updateFeatures()

                expect(
                    client
                        .request([])
                        .getFeatureValue('my-feature', 'default-value'),
                ).toEqual('new-service-default-value')
            },
        ),
    )

    it(
        'can manually update audience exception values',
        featureBoardFixture(
            { count: 0 },
            (testContext) => [
                http.get('https://client.featureboard.app/all', () => {
                    if (testContext.count > 0) {
                        return HttpResponse.json<FeatureConfiguration[]>([
                            {
                                featureKey: 'my-feature',
                                audienceExceptions: [
                                    {
                                        audienceKey: 'aud',
                                        value: 'new-aud-value',
                                    },
                                ],
                                defaultValue: 'new-service-default-value',
                            },
                        ])
                    }
                    testContext.count++
                    return HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [
                                { audienceKey: 'aud', value: 'aud-value' },
                            ],
                            defaultValue: 'service-default-value',
                        },
                    ])
                }),
            ],
            async () => {
                const client = createServerClient({
                    environmentApiKey: 'fake-key',
                    updateStrategy: 'manual',
                })
                await client.waitForInitialised()
                await client.updateFeatures()

                expect(
                    client
                        .request(['aud'])
                        .getFeatureValue('my-feature', 'default-value'),
                ).toEqual('new-aud-value')
            },
        ),
    )

    it(
        'close',
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
                const client = createServerClient({
                    environmentApiKey: 'fake-key',
                    updateStrategy: 'manual',
                })

                client.close()
            },
        ),
    )
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
