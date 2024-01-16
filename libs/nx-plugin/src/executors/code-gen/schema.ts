import type { Template } from '@featureboard/code-generator'

export interface CodeGenExecutorSchema {
    template: Template
    featureBoardProductName: string
    featureBoardApiKey?: string
    subFolder: string
    dryRun: boolean
}
