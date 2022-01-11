declare const window: any
export const interval = {
    set: typeof window !== 'undefined' ? setInterval.bind(window) : setInterval,
    clear:
        typeof window !== 'undefined'
            ? clearInterval.bind(window)
            : clearInterval,
}
