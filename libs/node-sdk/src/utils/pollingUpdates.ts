import { interval } from '../interval'

export function pollingUpdates(update: () => any, intervalMs: number) {
    const intervalRef = interval.set(update, intervalMs)

    const stopUpdates = () => interval.clear(intervalRef)
    return stopUpdates
}
