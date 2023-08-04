import { Static, Type } from '@sinclair/typebox'

export const OrganizationSettings = Type.Object({
    keySeparator: Type.Optional(
        Type.Union([Type.Literal('-'), Type.Literal('_')]),
    ),
})

export const OrganizationDto = Type.Object({
    id: Type.String(),
    name: Type.String(),
    plan: Type.String(),
    trialExpires: Type.Optional(Type.String()),
    cancelUrl: Type.Optional(Type.String()),
    updateUrl: Type.Optional(Type.String()),
    nextPaymentDue: Type.Optional(Type.String()),
    unitPrice: Type.Optional(Type.String()),
    billingFrequency: Type.Optional(
        Type.Union([Type.Literal('monthly'), Type.Literal('yearly')]),
    ),
    settings: OrganizationSettings,
})
export type OrganizationDto = Static<typeof OrganizationDto>
