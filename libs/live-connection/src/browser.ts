import { SubscribeToEnvironment } from '@featureboard/contracts'
import {
    CommonLiveConnection,
    IWebSocket,
    LiveOptions,
} from './live-connection'
export type {
    ICloseEvent,
    IErrorEvent,
    IMessageEvent,
    IWebSocket,
    LiveOptions,
} from './live-connection'

export class LiveConnection extends CommonLiveConnection {
    constructor(
        environmentApiKey: string,
        mode: SubscribeToEnvironment['mode'],
        endpoint: string,
        options: LiveOptions,
    ) {
        super(
            (address) => {
                // Browser uses the inbuilt global
                const ws = new WebSocket(address)

                return Promise.resolve(ws as unknown as IWebSocket)
            },
            environmentApiKey,
            mode,
            endpoint,
            options,
        )
    }
}
