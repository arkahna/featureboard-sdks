import type { EffectiveFeatureValue } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { createBrowserClient } from '../create-browser-client'
import { featureBoardFixture } from '../featureboard-fixture'

describe('manual update mode', () => {
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
                const client = createBrowserClient({
                    environmentApiKey: 'fake-key',
                    audiences: [],
                    updateStrategy: 'manual',
                })
                await client.waitForInitialised()

                const value = client.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('service-default-value')
            },
        ),
    )

    it(
        'can manually update values',
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
                const client = createBrowserClient({
                    environmentApiKey: 'fake-key',
                    audiences: [],
                    updateStrategy: 'manual',
                })
                await client.waitForInitialised()
                await client.updateFeatures()

                const value = client.client.getFeatureValue(
                    'my-feature',
                    'default-value',
                )
                expect(value).toEqual('new-service-default-value')
            },
        ),
    )

    it(
        'close',
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
                const client = createBrowserClient({
                    environmentApiKey: 'fake-key',
                    audiences: [],
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
