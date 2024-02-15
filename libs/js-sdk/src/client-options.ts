export interface ClientOptions {
    /**
     * Controls whether the FeatureBoard SDK emits traces using OpenTelemetry.
     * Set to `true` to disable trace emission.
     *
     * @default false
     */
    disableOTel?: boolean
}
