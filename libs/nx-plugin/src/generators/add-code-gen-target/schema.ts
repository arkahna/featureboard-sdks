import type { CodeGenExecutorSchema } from '../../executors/code-gen/schema'

export type AddCodeGenTargetGeneratorSchema = Omit<
    CodeGenExecutorSchema,
    'featureBoardApiKey'
> & {
    projectName: string
    targetName: string
}
