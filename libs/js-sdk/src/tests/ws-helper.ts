import { ClientMessages } from '@featureboard/contracts'
import { IWebSocket } from '../live-connection'

export function connectToWsClient(
    onMessage: (msg: ClientMessages, ws: IWebSocket) => void,
): IWebSocket {
    const client: IWebSocket = {
        send: async (message) => {
            if (typeof message !== 'string' && !Buffer.isBuffer(message)) {
                console.error(
                    { websocketMessage: message },
                    'Unexpected message format',
                )
                return
            }
            const parsed: ClientMessages = JSON.parse(
                Buffer.isBuffer(message) ? message.toString() : message,
            )

            try {
                const clientMessages: ClientMessages['kind'][] = ['subscribe']
                if (clientMessages.includes(parsed.kind)) {
                    // When the SDK sends a message, let the caller know and also give them
                    // a websocket interface they can interact with in response
                    return onMessage(parsed, {
                        send: async (message) => {
                            client.onmessage({
                                data: message,
                            })
                        },
                        close: () => {},
                        onclose() {},
                        onerror() {},
                        onmessage() {},
                        onopen() {},
                    })
                }
                throw new Error('Unknown message kind')
            } catch (err_) {
                console.error({ err: err_, parsed }, 'Failed parse message')
            }
        },
        close: () => {},
        onclose() {},
        onerror() {},
        onmessage() {},
        onopen() {},
    }

    setTimeout(() => {
        client.onopen()
    })

    return client
}
