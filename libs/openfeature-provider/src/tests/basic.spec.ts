import { describe, expect, it } from 'vitest'
import { FeatureBoardProvider } from '../featureboard-provider'

describe('FeatureBoardProvider - Basic Tests', () => {
    it('should create provider with correct metadata', () => {
        const provider = new FeatureBoardProvider({
            environmentKey: 'test-key',
        })

        expect(provider.metadata.name).toBe('featureboard-provider')
        expect(provider.events).toBeDefined()
    })

    it('should have correct initial status', () => {
        const provider = new FeatureBoardProvider({
            environmentKey: 'test-key',
        })

        expect(provider.status).toBe('NOT_READY')
    })

    it('should implement all required provider methods', () => {
        const provider = new FeatureBoardProvider({
            environmentKey: 'test-key',
        })

        expect(typeof provider.resolveBooleanEvaluation).toBe('function')
        expect(typeof provider.resolveStringEvaluation).toBe('function')
        expect(typeof provider.resolveNumberEvaluation).toBe('function')
        expect(typeof provider.resolveObjectEvaluation).toBe('function')
        expect(typeof provider.initialize).toBe('function')
        expect(typeof provider.onClose).toBe('function')
    })
})
