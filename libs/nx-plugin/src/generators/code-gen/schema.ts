import type { Template } from '@featureboard/code-generator'

export interface CodeGenGeneratorSchema {
    template: Template
    projectName: string
    featureBoardProductName: string
    featureBoardApiKey?: string
    subFolder: string
}
