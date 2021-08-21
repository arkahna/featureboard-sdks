import { FeatureBoardClient } from './features-client'

export interface ClientConnection {
    client: FeatureBoardClient

    close(): void
}
