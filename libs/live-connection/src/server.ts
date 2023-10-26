import type { SubscribeToEnvironment } from '@featureboard/contracts'
import type { IWebSocket, LiveOptions } from './live-connection'
import { CommonLiveConnection } from './live-connection'
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
            async (address) => {
                // Server uses the 'ws' library
                const WS = await import('ws')
                return new WS.default(address) as unknown as IWebSocket
            },
            environmentApiKey,
            mode,
            endpoint,
            options,
        )
    }
}
