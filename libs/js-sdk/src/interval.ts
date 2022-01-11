declare const window: any
export const interval = {
    set: setInterval.bind(window),
    clear: clearInterval.bind(window),
}
