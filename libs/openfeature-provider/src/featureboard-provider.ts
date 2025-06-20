import type { BrowserClient, FeatureBoardApiConfig } from '@featureboard/js-sdk'
import { createBrowserClient } from '@featureboard/js-sdk'
import {
    ErrorCode,
    EvaluationContext,
    Logger,
    OpenFeatureEventEmitter,
    Provider,
    ProviderEvents,
    ProviderMetadata,
    ProviderStatus,
    ResolutionDetails,
} from '@openfeature/web-sdk'
import debug from 'debug'

const log = debug('featureboard:openfeature-provider')

export interface FeatureBoardProviderConfig {
    environmentKey: string
    options?: Partial<FeatureBoardApiConfig>
}

export class FeatureBoardProvider implements Provider {
    readonly metadata: ProviderMetadata = {
        name: 'featureboard-provider',
    }

    readonly events = new OpenFeatureEventEmitter()

    private client: BrowserClient
    public status: ProviderStatus = 'NOT_READY' as ProviderStatus

    constructor(config: FeatureBoardProviderConfig) {
        this.client = createBrowserClient({
            environmentApiKey: config.environmentKey,
            audiences: [],
            ...config.options,
        })

        // Initialize the client
        this.initialize()
    }

    public async initialize(): Promise<void> {
        try {
            this.status = 'STALE' as ProviderStatus
            await this.client.waitForInitialised()
            this.status = 'READY' as ProviderStatus
            this.events.emit(ProviderEvents.Ready)
            log('FeatureBoard provider initialized successfully')
        } catch (error) {
            this.status = 'ERROR' as ProviderStatus
            this.events.emit(ProviderEvents.Error, {
                message: 'Failed to initialize FeatureBoard provider',
            })
            log('Failed to initialize FeatureBoard provider:', error)
        }
    }

    resolveBooleanEvaluation(
        flagKey: string,
        defaultValue: boolean,
        _context: EvaluationContext,
        logger: Logger,
    ): ResolutionDetails<boolean> {
        try {
            if (!this.client.initialised) {
                return {
                    value: defaultValue,
                    reason: 'STALE',
                }
            }

            const value = (this.client.client as any).getFeatureValue(
                flagKey,
                defaultValue,
            )
            return {
                value,
                reason: value === defaultValue ? 'DEFAULT' : 'TARGETING_MATCH',
            }
        } catch (error) {
            logger.error(
                'Error resolving boolean evaluation for flag %s:',
                flagKey,
                error,
            )
            return {
                value: defaultValue,
                reason: 'ERROR',
                errorCode: ErrorCode.GENERAL,
            }
        }
    }

    resolveStringEvaluation(
        flagKey: string,
        defaultValue: string,
        _context: EvaluationContext,
        logger: Logger,
    ): ResolutionDetails<string> {
        try {
            if (!this.client.initialised) {
                return {
                    value: defaultValue,
                    reason: 'STALE',
                }
            }

            const value = (this.client.client as any).getFeatureValue(
                flagKey,
                defaultValue,
            )
            return {
                value,
                reason: value === defaultValue ? 'DEFAULT' : 'TARGETING_MATCH',
            }
        } catch (error) {
            logger.error(
                'Error resolving string evaluation for flag %s:',
                flagKey,
                error,
            )
            return {
                value: defaultValue,
                reason: 'ERROR',
                errorCode: ErrorCode.GENERAL,
            }
        }
    }

    resolveNumberEvaluation(
        flagKey: string,
        defaultValue: number,
        _context: EvaluationContext,
        logger: Logger,
    ): ResolutionDetails<number> {
        try {
            if (!this.client.initialised) {
                return {
                    value: defaultValue,
                    reason: 'STALE',
                }
            }

            const value = (this.client.client as any).getFeatureValue(
                flagKey,
                defaultValue,
            )
            return {
                value,
                reason: value === defaultValue ? 'DEFAULT' : 'TARGETING_MATCH',
            }
        } catch (error) {
            logger.error(
                'Error resolving number evaluation for flag %s:',
                flagKey,
                error,
            )
            return {
                value: defaultValue,
                reason: 'ERROR',
                errorCode: ErrorCode.GENERAL,
            }
        }
    }

    resolveObjectEvaluation<T>(
        flagKey: string,
        defaultValue: T,
        _context: EvaluationContext,
        logger: Logger,
    ): ResolutionDetails<T> {
        try {
            if (!this.client.initialised) {
                return {
                    value: defaultValue,
                    reason: 'STALE',
                }
            }

            const value = (this.client.client as any).getFeatureValue(
                flagKey,
                defaultValue,
            )
            return {
                value,
                reason: value === defaultValue ? 'DEFAULT' : 'TARGETING_MATCH',
            }
        } catch (error) {
            logger.error(
                'Error resolving object evaluation for flag %s:',
                flagKey,
                error,
            )
            return {
                value: defaultValue,
                reason: 'ERROR',
                errorCode: ErrorCode.GENERAL,
            }
        }
    }

    async onClose(): Promise<void> {
        this.client.close()
        log('FeatureBoard provider closing')
    }
}
