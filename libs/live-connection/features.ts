import '@featureboard/js-sdk'

export interface FeatureBoardServiceFeatures {

    /**
    * Organization API Key Management
    * @description Can create and manage Organization API keys
    */
    'api-key-management': boolean

    /**
    * Audiences write
    * @description Can create and update audiences
    */
    'audiences-write': boolean

    /**
    * Cache TTL
    * @description Cache TTL in seconds
    */
    'cache-ttl': number

    /**
    * Delete Organization
    * @description 
    */
    'delete-organization': boolean

    /**
    * Demo projects enabled
    * @description Allows users to create project with demo data
    */
    'demo-projects-enabled': boolean

    /**
    * Environment Key Read
    * @description Can read environment api keys
    */
    'environments-key-read': boolean

    /**
    * Environments write
    * @description Can create and update environments
    */
    'environments-write': boolean

    /**
    * Feature Values Write
    * @description Can create and update features default value and audience exceptions
    */
    'features-value-write': boolean

    /**
    * Features write
    * @description Can create and update features
    */
    'features-write': boolean

    /**
    * Live updates enabled
    * @description Allows live=true to be set in SDK
    */
    'live-updates-enabled': boolean

    /**
    * Max full users
    * @description Users with admin or writer roles
    */
    'max-full-users': number

    /**
    * Max limited users
    * @description Users with read or support roles
    */
    'max-limited-users': number

    /**
    * Max projects
    * @description 0 means unlimited
    */
    'max-projects': number

    /**
    * Organization Creation (in app)
    * @description Allows organizations to be created from within the application
    */
    'organization-creation': boolean

    /**
    * Organization management
    * @description Enables management of organization users and settings
    */
    'organization-management': boolean

    /**
    * Projects write
    * @description Can create and update projects
    */
    'projects-write': boolean

    /**
    * FeatureBoard service administration
    * @description Enables administration of the FeatureBoard service
    */
    'service-administration': boolean

    /**
    * Set environments feature availability
    * @description Can update feature availability for any environment
    */
    'set-feature-availability': boolean

    /**
    * Available webhook types 
    * @description 
    */
    'webhook-type': 'none' | 'basic' | 'advanced'

    /**
    * Webhooks Feature
    * @description Controls the availability of the webhook feature
    */
    'webhooks': boolean

    /**
    * Webhooks write
    * @description Can create and update webhooks
    */
    'webhooks-write': boolean
}

declare module '@featureboard/js-sdk' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Features extends FeatureBoardServiceFeatures {}
}

export type FeatureBoardServiceFeature = keyof FeatureBoardServiceFeatures