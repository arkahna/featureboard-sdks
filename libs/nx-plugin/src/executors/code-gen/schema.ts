import type { Template } from '@featureboard/code-generator'

export interface CodeGenExecutorSchema {
    template: Template
    projectName: string
    featureBoardProductName: string
    featureBoardApiKey: string
    subFolder: string
}
