import { NotificationType, SubscribeToEnvironment } from '@featureboard/contracts'
import { PromiseCompletionSource } from 'promise-completion-source'
import { FeatureBoardApiConfig } from './featureboard-api-config'
import { log } from './log'

/** Contract for web socket connection */
export interface IWebSocket {
    onmessage: ({ data }: IMessageEvent) => void
    onerror: ({ error }: IErrorEvent) => void
    onclose: ({ code, reason }: ICloseEvent) => void
    onopen: () => void
    close(): void
    send(message: string): void
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
     * @default 5000ms
     **/
    connectTimeout?: number

    websocketFactory: (address: string) => IWebSocket
}

export class LiveConnection {
    private ws?: IWebSocket
    private retryCount = 0
    private initialised: PromiseCompletionSource<void> | undefined
    private connectTimeout: number
    private wsUrl: string
    private websocketFactory: LiveOptions['websocketFactory']
    private pingTimeout?: NodeJS.Timeout | number
    private reconnectingTimeout?: NodeJS.Timeout | number
    private handleMessage?: (message: NotificationType) => void

    constructor(
        private environmentApiKey: string,
        private mode: SubscribeToEnvironment['mode'],
        apiOptions: FeatureBoardApiConfig,
        options: LiveOptions,
    ) {
        this.wsUrl = apiOptions.ws
        this.connectTimeout = options?.connectTimeout || 5000
        this.websocketFactory = options.websocketFactory

        // Enable callbacks to be used inline
        this.onOpen = this.onOpen.bind(this)
        this.onClose = this.onClose.bind(this)
        this.onError = this.onError.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.onPing = this.onPing.bind(this)
    }

    async connect(handleMessage: (message: NotificationType) => void) {
        this.close()
        this.handleMessage = handleMessage
        this.retryCount = 0
        this.initialised = new PromiseCompletionSource()
        this.ws = this.websocketFactory(this.wsUrl)
        log('Connecting')

        this.ws.onopen = this.onOpen
        this.ws.onclose = this.onClose
        this.ws.onmessage = this.onMessage
        this.ws.onerror = this.onError

        const timeout = new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('SDK connection timeout')), this.connectTimeout),
        )

        await Promise.race([timeout, this.initialised.promise])
    }

    private onOpen(): void {
        this.heartbeat()
        if (!this.ws) {
            log('No WebSocket instance')
            return
        }
        if (!this.environmentApiKey) {
            log('Environment API Key empty')
            return
        }
        if (!this.mode) {
            log('SDK mode not specified')
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
        log({ code, reason }, 'WS Disconnect')
        // Application level close, don't reconnect
        if (code === 1000) {
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
            log({ retryCount, waitTime }, 'Waiting before reconnect')
            this.reconnectingTimeout = setTimeout(() => {
                log({ retryCount }, 'Trying to reconnect')
                this.connect(handleMessage)
                this.retryCount = retryCount
            }, waitTime)
        }
    }

    private onMessage({ data }: IMessageEvent): void {
        try {
            const message: NotificationType = JSON.parse(data.toString())
            log({ kind: message.kind }, 'Recieved WS Message')

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
        log('WS Ping')
        this.heartbeat()
    }

    private heartbeat(): void {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout as any)
        }
        if (this.reconnectingTimeout) {
            log('Cancelling reconnect timeout, reconnected')
            clearTimeout(this.reconnectingTimeout as any)
        }

        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Server should ping every 5 minutes, terminate if we haven't heard in 6 minutes
        this.pingTimeout = setTimeout(() => {
            this.close()
            if (this.environmentApiKey && this.mode && this.handleMessage) {
                this.connect(this.handleMessage)
            }
        }, 6 * 60 * 1000)
    }

    close(): void {
        if (this.ws) {
            log('Cleaning up existing connection')

            this.ws.onopen = null as any
            this.ws.onclose = null as any
            this.ws.onmessage = null as any
            this.ws.onerror = null as any
            this.ws.close()
            this.ws = undefined
        }
    }
}
