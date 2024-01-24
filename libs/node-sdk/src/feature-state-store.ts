import type { FeatureConfiguration } from '@featureboard/contracts'
import { resolveError } from '@featureboard/js-sdk'
import { SpanStatusCode } from '@opentelemetry/api'
import type { ExternalStateStore } from './external-state-store'
import { getTracer } from './utils/get-tracer'

export interface IFeatureStateStore {
    all(): Record<string, FeatureConfiguration | undefined>
    get(featureKey: string): FeatureConfiguration | undefined
    set(featureKey: string, value: FeatureConfiguration | undefined): void
    initialiseFromExternalStateStore(): Promise<boolean>
}

export class AllFeatureStateStore implements IFeatureStateStore {
    private _store: Record<string, FeatureConfiguration | undefined> = {}
    private _externalStateStore: ExternalStateStore | undefined
    private featureUpdatedCallbacks: Array<
        (featureKey: string, values: FeatureConfiguration | undefined) => void
    > = []

    constructor(externalStateStore?: ExternalStateStore) {
        this._externalStateStore = externalStateStore
    }

    async initialiseFromExternalStateStore(): Promise<boolean> {
        if (!this._externalStateStore) {
            return Promise.resolve(false)
        }
        const tracer = getTracer()

        await tracer.startActiveSpan(
            'fbsdk-initialise-from-external-store',
            async (externalStoreSpan) => {
                try {
                    const externalStore = await this._externalStateStore!.all()
                    this._store = { ...externalStore }
                    Object.keys(externalStore).forEach((key) => {
                        this.featureUpdatedCallbacks.forEach((valueUpdated) =>
                            valueUpdated(key, externalStore[key]),
                        )
                    })
                } catch (error) {
                    const err = resolveError(error)
                    externalStoreSpan.recordException(err)
                    externalStoreSpan.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: err.message,
                    })

                    console.error(
                        'Failed to initialise from external state store',
                        error,
                    )
                    throw error
                } finally {
                    externalStoreSpan.end()
                }
            },
        )
        return Promise.resolve(true)
    }

    all(): Record<string, FeatureConfiguration | undefined> {
        return { ...this._store }
    }

    get(featureKey: string): FeatureConfiguration | undefined {
        const value = this._store[featureKey]

        return value
    }

    set(featureKey: string, value: FeatureConfiguration | undefined) {
        this._store[featureKey] = value
        this.featureUpdatedCallbacks.forEach((valueUpdated) =>
            valueUpdated(featureKey, value),
        )

        if (this._externalStateStore) {
            this._externalStateStore.update(this._store).then(
                (result) => {},
                (error) => {},
            )
        }
    }
}
