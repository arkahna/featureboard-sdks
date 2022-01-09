import { describe, it } from 'vitest'

describe.skip('live client', () => {
    it('can connect to featureboard', async () => {
        // const client = createServerClient({
        //     environmentApiKey: 'fake-key',
        //     updateStrategy: {
        //         kind: 'live',
        //         options: {
        //             websocketFactory: () =>
        //                 connectToWsClient((msg, ws) => {
        //                     if (msg.kind === 'subscribe') {
        //                         const stateOfTheWorld: StateOfTheWorldNotification =
        //                             {
        //                                 kind: 'state-of-the-world',
        //                                 features: [
        //                                     {
        //                                         featureKey: 'my-feature',
        //                                         audienceExceptions: [],
        //                                         defaultValue: 'some-value',
        //                                     },
        //                                 ],
        //                             }
        //                         ws.send(JSON.stringify(stateOfTheWorld))
        //                     }
        //                 }),
        //         },
        //     },
        // })
        // expect(
        //     client.request([]).getFeatureValue('my-feature', 'default-val'),
        // ).toBe('some-value')
    })

    it('connection timeout falls back to http to get initial values, then retries in background', async () => {
        // const fetchMock = new FetchMock()
        // const values: FeatureConfiguration[] = [
        //     {
        //         featureKey: 'my-feature',
        //         audienceExceptions: [],
        //         defaultValue: 'from-http',
        //     },
        // ]
        // fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
        //     status: 200,
        //     body: JSON.stringify(values),
        // })
        // const client = createServerClient({
        //     environmentApiKey: 'fake-key',
        //     fetchInstance: fetchMock.instance,
        //     updateStrategy: {
        //         kind: 'live',
        //         options: {
        //             connectTimeout: 1,
        //             websocketFactory: () => connectToWsClient(() => {}),
        //         },
        //     },
        // })
        // // Wait for timeout of sdk
        // await new Promise((resolve) => setTimeout(resolve, 50))
        // expect(
        //     client.request([]).getFeatureValue('my-feature', 'default-val'),
        // ).toBe('from-http')
    })

    it('uses value from live once it reconnects', async () => {
        // const fetchMock = new FetchMock()
        // let serverConnectAttempts = 0
        // const values: FeatureConfiguration[] = [
        //     {
        //         featureKey: 'my-feature',
        //         audienceExceptions: [],
        //         defaultValue: 'from-http',
        //     },
        // ]
        // fetchMock.matchOnce('get', 'https://client.featureboard.app/all', {
        //     status: 200,
        //     body: JSON.stringify(values),
        // })
        // timeout.set = ((cb: any) => setTimeout(cb)) as any
        // const client = createServerClient({
        //     environmentApiKey: 'fake-key',
        //     fetchInstance: fetchMock.instance,
        //     updateStrategy: {
        //         kind: 'live',
        //         options: {
        //             connectTimeout: 1,
        //             websocketFactory: () =>
        //                 connectToWsClient((msg, ws) => {
        //                     serverConnectAttempts++
        //                     if (serverConnectAttempts > 1) {
        //                         if (msg.kind === 'subscribe') {
        //                             const stateOfTheWorld: StateOfTheWorldNotification =
        //                                 {
        //                                     kind: 'state-of-the-world',
        //                                     features: [
        //                                         {
        //                                             featureKey: 'my-feature',
        //                                             audienceExceptions: [],
        //                                             defaultValue:
        //                                                 'from-reconnect',
        //                                         },
        //                                     ],
        //                                 }
        //                             ws.send(JSON.stringify(stateOfTheWorld))
        //                         }
        //                     }
        //                 }),
        //         },
        //     },
        // })
        // // Wait for timeout of sdk
        // await new Promise((resolve) => setTimeout(resolve, 50))
        // expect(
        //     client.request([]).getFeatureValue('my-feature', 'default-val'),
        // ).toBe('from-reconnect')
    })
})
