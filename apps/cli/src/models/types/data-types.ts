/* eslint-disable @typescript-eslint/no-redeclare */
import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

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
