import {
    FeatureValues,
    StateOfTheWorldNotification,
} from '@featureboard/contracts'
import { timeout } from '@featureboard/js-sdk/src/timeout'
import fetchMock from 'fetch-mock'
import { FeatureBoardService } from '../client'
import { connectToWsClient } from './ws-helper'

let fetch: fetchMock.FetchMockSandbox

beforeEach(() => {
    fetch = fetchMock.sandbox()
    // Default to internal server error
    fetch.catch(500)
})

describe('live client', () => {
    it('can connect to featureboard', async () => {
        const client = await FeatureBoardService.init('fake-key', {
            updateStrategy: {
                kind: 'live',
                options: {
                    websocketFactory: () =>
                        connectToWsClient((msg, ws) => {
                            if (msg.kind === 'subscribe') {
                                const stateOfTheWorld: StateOfTheWorldNotification =
                                    {
                                        kind: 'state-of-the-world',
                                        features: [
                                            {
                                                featureKey: 'my-feature',
                                                audienceExceptions: [],
                                                defaultValue: 'some-value',
                                            },
                                        ],
                                    }

                                ws.send(JSON.stringify(stateOfTheWorld))
                            }
                        }),
                },
            },
        })

        expect(
            client.request([]).getFeatureValue('my-feature', 'default-val'),
        ).toBe('some-value')
    })

    it('connection timeout falls back to http to get initial values, then retries in background', async () => {
        const values: FeatureValues[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'from-http',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        const client = await FeatureBoardService.init('fake-key', {
            fetch,
            updateStrategy: {
                kind: 'live',
                options: {
                    connectTimeout: 1,
                    websocketFactory: () => connectToWsClient(() => {}),
                },
            },
        })

        // Wait for timeout of sdk
        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(
            client.request([]).getFeatureValue('my-feature', 'default-val'),
        ).toBe('from-http')
    })

    it('uses value from live once it reconnects', async () => {
        let serverConnectAttempts = 0

        const values: FeatureValues[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'from-http',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        timeout.set = ((cb: any) => setTimeout(cb)) as any

        const client = await FeatureBoardService.init('fake-key', {
            fetch,
            updateStrategy: {
                kind: 'live',
                options: {
                    connectTimeout: 1,
                    websocketFactory: () =>
                        connectToWsClient((msg, ws) => {
                            serverConnectAttempts++
                            if (serverConnectAttempts > 1) {
                                if (msg.kind === 'subscribe') {
                                    const stateOfTheWorld: StateOfTheWorldNotification =
                                        {
                                            kind: 'state-of-the-world',
                                            features: [
                                                {
                                                    featureKey: 'my-feature',
                                                    audienceExceptions: [],
                                                    defaultValue:
                                                        'from-reconnect',
                                                },
                                            ],
                                        }

                                    ws.send(JSON.stringify(stateOfTheWorld))
                                }
                            }
                        }),
                },
            },
        })

        // Wait for timeout of sdk
        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(
            client.request([]).getFeatureValue('my-feature', 'default-val'),
        ).toBe('from-reconnect')
    })
})
