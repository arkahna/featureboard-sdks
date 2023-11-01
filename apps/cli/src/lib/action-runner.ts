import type { Command, OptionValues } from '@commander-js/extra-typings'
import { exit } from 'process'

// Allow us to catch and handle errors use it to wrap your action function
export function actionRunner<
    Args extends any[] = [],
    Opts extends OptionValues = {},
>(fn: (...args: [...Args, Opts, Command<Args, Opts>]) => Promise<void>) {
    return (...args: [...Args, Opts, Command<Args, Opts>]) =>
        fn(...args).catch((error) => {
            if (
                ('verbose' in args[0] && args[0].verbose == false) ||
                ('verbose' in args[1] && args[1].verbose == false)
            ) {
                console.error(error.message || error)
                exit(1000)
            }
            throw error
        })
}
