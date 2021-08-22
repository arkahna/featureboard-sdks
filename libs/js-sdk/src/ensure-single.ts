/** De-dupes calls while the promise is in flight, otherwise will trigger again */
export function createEnsureSingle<T>(cb: () => Promise<T>): () => Promise<T> {
    let current: Promise<T> | undefined

    return () => {
        if (!current) {
            current = cb().finally(() => {
                current = undefined
            })
        }

        return current
    }
}
