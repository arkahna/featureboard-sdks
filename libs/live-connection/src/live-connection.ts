import {
    NotificationType,
    SubscribeToEnvironment,
} from '@featureboard/contracts'
import { PromiseCompletionSource } from 'promise-completion-source'
import { liveConnectionLog } from './log'
import { timeout } from './timeout'

/** Contract for web socket connection */
export interface IWebSocket {
    onmessage: (event: IMessageEvent) => void
    onerror: ({ error }: IErrorEvent) => void
    onclose: ({ code, reason }: ICloseEvent) => void
    onopen: () => void
    close(): void
    send(message: string | Buffer | ArrayBuffer | Buffer[]): void
}

export interface ICloseEvent {
    code: number
    reason: string
}
export interface IMessageEvent {
    data: string | Buffer | ArrayBuffer | Buffer[]
}
export interface IErrorEvent {
    error: any
    message: string
    type: string
}

export interface LiveOptions {
    /**
     * Connection timeout for live updates
     * @default 15000ms
     **/
    connectTimeout?: number

    websocketFactory?: (address: string) => IWebSocket
}

const liveConnectionDebug = liveConnectionLog.extend('live-connection')

export class LiveConnection {
    private ws?: IWebSocket
    private retryCount = 0
    private initialised: PromiseCompletionSource<void> | undefined
    private connectTimeout: number
    private wsUrl: string
    private pingTimeout?: NodeJS.Timeout | number
    private reconnectingTimeout?: NodeJS.Timeout | number
    private handleMessage?: (message: NotificationType) => void

    constructor(
        private websocketFactory: (address: string) => Promise<IWebSocket>,
        private environmentApiKey: string,
        private mode: SubscribeToEnvironment['mode'],
        endpoint: string,
        options: LiveOptions,
    ) {
        this.wsUrl = endpoint
        this.connectTimeout = options?.connectTimeout || 15000

        // Enable callbacks to be used inline
        this.onOpen = this.onOpen.bind(this)
        this.onClose = this.onClose.bind(this)
        this.onError = this.onError.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.onPing = this.onPing.bind(this)
    }

    async connect(handleMessage: (message: NotificationType) => void) {
        liveConnectionDebug('Connecting to FeatureBoard')
        this.close('Closing existing connection')
        this.handleMessage = handleMessage
        this.retryCount = 0
        this.initialised = new PromiseCompletionSource()
        this.ws = await this.websocketFactory(this.wsUrl)

        this.ws.onopen = this.onOpen
        this.ws.onclose = this.onClose
        this.ws.onmessage = this.onMessage
        this.ws.onerror = this.onError

        let timeoutRef: any
        // Outside setTimeout to get correct stack trace on timeout
        const timeoutError = new Error('SDK connection timeout')
        const timeoutPromise = new Promise<void>((_, reject) => {
            if (timeoutRef) {
                clearTimeout(timeoutRef)
            }
            timeoutRef = setTimeout(() => {
                // Timeout should close the connection
                this.close('Connection timeout')

                reject(timeoutError)
            }, this.connectTimeout)
        })

        await Promise.race([
            timeoutPromise,
            this.initialised.promise.then(() => clearTimeout(timeoutRef)),
        ])
    }

    private onOpen(): void {
        this.heartbeat()
        if (!this.ws) {
            liveConnectionDebug('No WebSocket instance')
            return
        }
        if (!this.environmentApiKey) {
            liveConnectionDebug('Environment API Key empty')
            return
        }
        if (!this.mode) {
            liveConnectionDebug('SDK mode not specified')
            return
        }

        const subscribe: SubscribeToEnvironment = {
            kind: 'subscribe',
            apiKey: this.environmentApiKey,
            mode: this.mode,
        }
        this.ws.send(JSON.stringify(subscribe))
    }

    private onClose({ code, reason }: ICloseEvent): void {
        liveConnectionDebug({ code, reason }, 'WS Disconnect')
        const applicationAskedClientToClose = 1000
        const sdkClosed = 1005
        // Don't reconnect for application-initiated disconnects
        if (code === applicationAskedClientToClose || code === sdkClosed) {
            return
        }

        const { environmentApiKey, mode, handleMessage } = this
        if (environmentApiKey && mode && handleMessage) {
            // Cancel heartbeat
            if (this.pingTimeout) {
                clearTimeout(this.pingTimeout as any)
            }

            const retryCount = this.retryCount + 1
            // Increase by a second each retry up to 30 seconds
            const waitTime = retryCount > 30 ? 30000 : retryCount * 1000
            liveConnectionDebug(
                { retryCount, waitTime },
                'Waiting before reconnect',
            )
            this.reconnectingTimeout = setTimeout(() => {
                liveConnectionDebug({ retryCount }, 'Trying to reconnect')
                this.connect(handleMessage)
                this.retryCount = retryCount
            }, waitTime)
        }
    }

    private onMessage({ data }: IMessageEvent): void {
        try {
            const message: NotificationType = JSON.parse(data.toString())
            liveConnectionDebug({ kind: message.kind }, 'Recieved WS Message')

            if (!message.kind) {
                console.error({ message }, 'Message has unexpected shape')
                return
            }
            if (this.handleMessage) {
                this.handleMessage(message)
            }
            if (this.initialised && !this.initialised.completed) {
                this.initialised.resolve()
            }
        } catch (err) {
            console.error({ data }, 'Unable to parse message')
        }
    }

    private onError({ error }: IErrorEvent): void {
        console.error('FeatureBoard Error', error)
    }

    private onPing(): void {
        liveConnectionDebug('WS Ping')
        this.heartbeat()
    }

    private heartbeat(): void {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout as any)
        }
        if (this.reconnectingTimeout) {
            liveConnectionDebug('Cancelling reconnect timeout, reconnected')
            clearTimeout(this.reconnectingTimeout as any)
        }

        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Server should ping every 5 minutes, terminate if we haven't heard in 6 minutes
        this.pingTimeout = setTimeout(() => {
            this.close('Ping timeout')
            if (this.environmentApiKey && this.mode && this.handleMessage) {
                this.connect(this.handleMessage)
            }
        }, 6 * 60 * 1000)
    }

    close(reason: string): void {
        if (this.ws) {
            liveConnectionDebug('Cleaning up existing connection: %o', reason)

            this.ws.onopen = null as any
            this.ws.onclose = null as any
            this.ws.onmessage = null as any
            this.ws.onerror = null as any
            this.ws.close()
            this.ws = undefined
        }
    }

    async tryReconnectInBackground(
        handleMessage: (message: NotificationType) => void,
    ) {
        liveConnectionDebug('Attempting to reconnect in background')
        let attemptedRetries = 0

        do {
            let delay = Math.pow(2, attemptedRetries) * 1000
            // Max 60 seconds
            if (delay > 60000) {
                delay = 60000
            }
            attemptedRetries++
            liveConnectionDebug('Waiting %o ms before reconnect', delay)
            await new Promise((resolve) => timeout.set(resolve, delay))

            try {
                await this.connect(handleMessage)
            } catch (err) {
                console.error(
                    `Failed to connect to FeatureBoard, trying again in ${delay}ms`,
                    err,
                )

                continue
            }

            break
            // eslint-disable-next-line no-constant-condition
        } while (true)
    }
}
