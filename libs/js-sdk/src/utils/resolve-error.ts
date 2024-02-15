export function resolveError(error: unknown): Error {
    if (error instanceof Error) {
        return error
    }

    if (typeof error === 'string') {
        return new Error(error)
    }

    console.error('Unknown error type: %o', error)
    return new Error('Unknown error', {
        cause: error,
    })
}
