import { describe, it, expect } from 'vitest'
import { extractAudiences } from '../audience-extractor'
import type { EvaluationContext } from '@openfeature/server-sdk'
import type { PropertyMapping } from '../types'

describe('extractAudiences', () => {
    describe('Strategy 1: Custom mapper function (highest priority)', () => {
        it('should use custom mapper when provided', () => {
            const context: EvaluationContext = {
                targetingKey: 'user-123',
                tier: 'premium',
            }

            const customMapper = (ctx: EvaluationContext) => {
                return [ctx.targetingKey as string, `tier-${ctx.tier}`]
            }

            const result = extractAudiences(context, undefined, customMapper)

            expect(result).toEqual(['user-123', 'tier-premium'])
        })

        it('should override explicit audiences array when custom mapper is provided', () => {
            const context: EvaluationContext = {
                targetingKey: 'user-123',
                audiences: ['explicit-audience'],
            }

            const customMapper = () => ['custom-audience']

            const result = extractAudiences(context, undefined, customMapper)

            expect(result).toEqual(['custom-audience'])
        })

        it('should override property map when custom mapper is provided', () => {
            const context: EvaluationContext = {
                organizationId: 'acme',
            }

            const propertyMap: PropertyMapping = {
                organizationId: 'org:{value}',
            }

            const customMapper = () => ['custom-only']

            const result = extractAudiences(context, propertyMap, customMapper)

            expect(result).toEqual(['custom-only'])
        })
    })

    describe('Strategy 2: Explicit audiences array', () => {
        it('should use explicit audiences array when provided in context', () => {
            const context: EvaluationContext = {
                targetingKey: 'user-123',
                audiences: ['premium', 'org:acme', 'role:admin'],
            }

            const result = extractAudiences(context)

            expect(result).toEqual(['premium', 'org:acme', 'role:admin'])
        })

        it('should use explicit audiences array over property map', () => {
            const context: EvaluationContext = {
                targetingKey: 'user-123',
                organizationId: 'acme',
                audiences: ['explicit-audience'],
            }

            const propertyMap: PropertyMapping = {
                organizationId: 'org:{value}',
            }

            const result = extractAudiences(context, propertyMap)

            expect(result).toEqual(['explicit-audience'])
        })

        it('should handle empty explicit audiences array', () => {
            const context: EvaluationContext = {
                targetingKey: 'user-123',
                audiences: [],
            }

            const result = extractAudiences(context)

            expect(result).toEqual([])
        })
    })

    describe('Strategy 3: Property map (user-configured)', () => {
        it('should apply property map templates', () => {
            const context: EvaluationContext = {
                organizationId: 'acme',
                role: 'admin',
            }

            const propertyMap: PropertyMapping = {
                organizationId: 'org:{value}',
                role: 'role:{value}',
            }

            const result = extractAudiences(context, propertyMap)

            expect(result).toEqual(['org:acme', 'role:admin'])
        })

        it('should apply property map functions', () => {
            const context: EvaluationContext = {
                isPremium: true,
                subscriptionLevel: 3,
            }

            const propertyMap: PropertyMapping = {
                isPremium: (v: unknown) => (v ? 'premium' : null),
                subscriptionLevel: (level: unknown) =>
                    (level as number) >= 3 ? 'enterprise' : 'basic',
            }

            const result = extractAudiences(context, propertyMap)

            expect(result).toEqual(['premium', 'enterprise'])
        })

        it('should filter out null values from function mappings', () => {
            const context: EvaluationContext = {
                isPremium: false,
            }

            const propertyMap: PropertyMapping = {
                isPremium: (v: unknown) => (v ? 'premium' : null),
            }

            const result = extractAudiences(context, propertyMap)

            expect(result).toEqual([])
        })

        it('should handle direct value template {value}', () => {
            const context: EvaluationContext = {
                tier: 'gold',
            }

            const propertyMap: PropertyMapping = {
                tier: '{value}',
            }

            const result = extractAudiences(context, propertyMap)

            expect(result).toEqual(['gold'])
        })

        it('should handle numeric values in templates', () => {
            const context: EvaluationContext = {
                userId: 12345,
            }

            const propertyMap: PropertyMapping = {
                userId: 'user:{value}',
            }

            const result = extractAudiences(context, propertyMap)

            expect(result).toEqual(['user:12345'])
        })

        it('should skip null values', () => {
            const context: EvaluationContext = {
                role: null as unknown as string,
                tier: 'premium',
            }

            const propertyMap: PropertyMapping = {
                role: 'role:{value}',
                tier: 'tier:{value}',
            }

            const result = extractAudiences(context, propertyMap)

            expect(result).toEqual(['tier:premium'])
        })

        it('should skip non-string/non-number values for template mappings', () => {
            const context: EvaluationContext = {
                complexObject: { nested: 'value' },
                simpleString: 'valid',
            }

            const propertyMap: PropertyMapping = {
                complexObject: 'complex:{value}',
                simpleString: 'simple:{value}',
            }

            const result = extractAudiences(context, propertyMap)

            expect(result).toEqual(['simple:valid'])
        })
    })

    describe('Strategy 4: Default property mappings (fallback)', () => {
        it('should include targetingKey as-is', () => {
            const context: EvaluationContext = {
                targetingKey: 'user-123',
            }

            const result = extractAudiences(context)

            expect(result).toContain('user-123')
        })

        it('should apply default mappings for common properties', () => {
            const context: EvaluationContext = {
                targetingKey: 'user-123',
                userId: '456',
                organizationId: 'acme',
                role: 'admin',
            }

            const result = extractAudiences(context)

            expect(result).toEqual([
                'user-123',
                'user:456',
                'org:acme',
                'role:admin',
            ])
        })

        it('should handle all default mapped properties', () => {
            const context: EvaluationContext = {
                userId: '123',
                organizationId: 'acme',
                teamId: 'team-a',
                role: 'admin',
                tier: 'premium',
                segment: 'beta',
            }

            const result = extractAudiences(context)

            expect(result).toEqual([
                'user:123',
                'org:acme',
                'team:team-a',
                'role:admin',
                'tier:premium',
                'segment:beta',
            ])
        })
    })

    describe('Edge cases', () => {
        it('should handle empty context', () => {
            const context: EvaluationContext = {}

            const result = extractAudiences(context)

            expect(result).toEqual([])
        })

        it('should handle context with only unknown properties', () => {
            const context: EvaluationContext = {
                customProp1: 'value1',
                customProp2: 'value2',
            }

            const result = extractAudiences(context)

            expect(result).toEqual([])
        })

        it('should handle mixed valid and missing values', () => {
            const context: EvaluationContext = {
                targetingKey: 'valid-key',
                organizationId: 'valid-org',
            }

            const result = extractAudiences(context)

            expect(result).toEqual(['valid-key', 'org:valid-org'])
        })
    })
})
