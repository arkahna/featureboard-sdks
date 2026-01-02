import {
    ErrorCode,
    StandardResolutionReasons,
    type JsonValue,
} from '@openfeature/server-sdk'
import { describe, expect, it } from 'vitest'
import { mapToFlagValue } from '../type-mapper'

describe('mapToFlagValue', () => {
    describe('boolean type', () => {
        it('should map boolean true correctly', () => {
            const result = mapToFlagValue<boolean>(true, 'boolean', 'test-flag')

            expect(result).toEqual({
                value: true,
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should map boolean false correctly', () => {
            const result = mapToFlagValue<boolean>(
                false,
                'boolean',
                'test-flag',
            )

            expect(result).toEqual({
                value: false,
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should return type mismatch for string when expecting boolean', () => {
            const result = mapToFlagValue<boolean>(
                'not-a-boolean',
                'boolean',
                'test-flag',
            )

            expect(result).toEqual({
                value: 'not-a-boolean',
                errorCode: ErrorCode.TYPE_MISMATCH,
                errorMessage:
                    "Flag 'test-flag' expected type 'boolean' but got 'string'",
                reason: StandardResolutionReasons.ERROR,
            })
        })
    })

    describe('string type', () => {
        it('should map string correctly', () => {
            const result = mapToFlagValue<string>(
                'hello',
                'string',
                'test-flag',
            )

            expect(result).toEqual({
                value: 'hello',
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should map empty string correctly', () => {
            const result = mapToFlagValue<string>('', 'string', 'test-flag')

            expect(result).toEqual({
                value: '',
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should return type mismatch for number when expecting string', () => {
            const result = mapToFlagValue<string>(42, 'string', 'test-flag')

            expect(result).toEqual({
                value: 42,
                errorCode: ErrorCode.TYPE_MISMATCH,
                errorMessage:
                    "Flag 'test-flag' expected type 'string' but got 'number'",
                reason: StandardResolutionReasons.ERROR,
            })
        })
    })

    describe('number type', () => {
        it('should map integer correctly', () => {
            const result = mapToFlagValue<number>(42, 'number', 'test-flag')

            expect(result).toEqual({
                value: 42,
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should map float correctly', () => {
            const result = mapToFlagValue<number>(3.14, 'number', 'test-flag')

            expect(result).toEqual({
                value: 3.14,
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should map zero correctly', () => {
            const result = mapToFlagValue<number>(0, 'number', 'test-flag')

            expect(result).toEqual({
                value: 0,
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should return type mismatch for boolean when expecting number', () => {
            const result = mapToFlagValue<number>(true, 'number', 'test-flag')

            expect(result).toEqual({
                value: true,
                errorCode: ErrorCode.TYPE_MISMATCH,
                errorMessage:
                    "Flag 'test-flag' expected type 'number' but got 'boolean'",
                reason: StandardResolutionReasons.ERROR,
            })
        })
    })

    describe('object type', () => {
        it('should map object correctly', () => {
            const obj = { key: 'value', nested: { a: 1 } }
            const result = mapToFlagValue<typeof obj>(
                obj,
                'object',
                'test-flag',
            )

            expect(result).toEqual({
                value: obj,
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should parse JSON string as object', () => {
            const jsonString = '{"key":"value","nested":{"a":1}}'
            const result = mapToFlagValue<JsonValue>(
                jsonString,
                'object',
                'test-flag',
            )

            expect(result).toEqual({
                value: { key: 'value', nested: { a: 1 } },
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should parse JSON array string as object', () => {
            const jsonString = '[1,2,3]'
            const result = mapToFlagValue<JsonValue>(
                jsonString,
                'object',
                'test-flag',
            )

            expect(result).toEqual({
                value: [1, 2, 3],
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should map array correctly (arrays are objects)', () => {
            const arr = [1, 2, 3]
            const result = mapToFlagValue<typeof arr>(
                arr,
                'object',
                'test-flag',
            )

            expect(result).toEqual({
                value: arr,
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should map empty object correctly', () => {
            const result = mapToFlagValue<JsonValue>({}, 'object', 'test-flag')

            expect(result).toEqual({
                value: {},
                reason: StandardResolutionReasons.TARGETING_MATCH,
            })
        })

        it('should return type mismatch for string when expecting object', () => {
            const result = mapToFlagValue<JsonValue>(
                'not-an-object',
                'object',
                'test-flag',
            )

            expect(result).toEqual({
                value: 'not-an-object',
                errorCode: ErrorCode.TYPE_MISMATCH,
                errorMessage:
                    "Flag 'test-flag' expected type 'object' but got 'string'",
                reason: StandardResolutionReasons.ERROR,
            })
        })
    })

    describe('null and undefined handling', () => {
        it('should return DEFAULT reason for null', () => {
            const result = mapToFlagValue<boolean>(null, 'boolean', 'test-flag')

            expect(result).toEqual({
                value: null,
                reason: StandardResolutionReasons.DEFAULT,
            })
        })

        it('should return DEFAULT reason for undefined', () => {
            const result = mapToFlagValue<boolean>(
                undefined,
                'boolean',
                'test-flag',
            )

            expect(result).toEqual({
                value: undefined,
                reason: StandardResolutionReasons.DEFAULT,
            })
        })
    })
})
