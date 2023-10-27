import type { TemplateType } from '@featureboard/code-generator'

export interface CodeGenExecutorSchema {
    templateType: TemplateType
    projectName: string
    featureBoardProjectName: string
    featureBoardKey: string
    subFolder: string
}
