import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type FeatureDto = Static<typeof FeatureDto>

export const FeatureValue = Type.Union([
    Type.Boolean(),
    Type.String(),
    Type.Number(),
])
export type FeatureValue = Static<typeof FeatureValue>

export const BooleanDataType = Type.Object({
    kind: Type.Literal('boolean'),
})
export type BooleanDataType = Static<typeof BooleanDataType>
export const NumberDataType = Type.Object({
    kind: Type.Literal('number'),
})
export type NumberDataType = Static<typeof NumberDataType>
export const StringDataType = Type.Object({
    kind: Type.Literal('string'),
})
export type StringDataType = Static<typeof StringDataType>
export const OptionsDataType = Type.Object({
    kind: Type.Literal('options'),
    options: Type.Array(Type.String()),
})
export type OptionsDataType = Static<typeof OptionsDataType>

export const DataTypes = Type.Union([
    BooleanDataType,
    NumberDataType,
    StringDataType,
    OptionsDataType,
])
export type DataTypes = Static<typeof DataTypes>

export const AudienceExceptionDto = Type.Object({
    audienceId: Type.String(),
    value: FeatureValue,
})
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AudienceExceptionDto = Static<typeof AudienceExceptionDto>

export const FeatureDto = Type.Object({
    key: Type.String(),
    name: Type.String(),
    categoryIds: Type.Array(Type.String(), { minItems: 1 }),
    created: Type.String(),
    description: Type.String(),
    dataType: DataTypes,
    audienceExceptions: Type.Array(AudienceExceptionDto),
    defaultValue: FeatureValue,
})
