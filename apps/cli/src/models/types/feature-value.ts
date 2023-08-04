/* eslint-disable @typescript-eslint/no-redeclare */
import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

export const FeatureValue = Type.Union([Type.Boolean(), Type.String(), Type.Number()])
export type FeatureValue = Static<typeof FeatureValue>
