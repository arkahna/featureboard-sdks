export class TooManyRequestsError extends Error {
    statusCode: number
    retryAfter: Date
    timestamp: Date

    constructor(message = 'Too Many Requests', retryAfter: Date) {
        super(message)
        this.name = 'TooManyRequestsError'
        this.statusCode = 429
        this.retryAfter = retryAfter
        this.timestamp = new Date()
    }
}
