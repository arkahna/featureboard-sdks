import * as path from 'path'
import prompts from 'prompts'
import type { Tree } from '../../tree/tree'

export function toPascalCase(str: string) {
    return (
        str
            ?.match(
                /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
            )
            ?.map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
            .join('') ?? ''
    )
}

export function toDotNetType(feature: any) {
    switch (feature.dataType.kind) {
        case 'boolean':
            return 'bool'
        case 'number':
            return 'decimal'
        case 'options':
            return toPascalCase(feature.key)
        default:
            return feature.dataType.kind
    }
}

export async function getDotNetNamespace(
    tree: Tree,
    filePath: string,
    interactive: boolean,
): Promise<string> {
    const files = tree.children(filePath)
    const namespace = files
        .find((x) => x.endsWith('.csproj'))
        ?.replace('.csproj', '')

    if (namespace) return namespace

    const parentDir = path.join(filePath, '..')

    if (parentDir == filePath || parentDir == '.') {
        if (!interactive) {
            throw new Error(
                'Unable to locate .NET csproj file under the output folder.',
            )
        }

        console.error(
            'Unable to locate .NET csproj file under the output folder.',
        )
        const response = await prompts({
            type: 'text',
            name: 'namespace',
            message: `Please provide your .net namespace.`,
        })

        // handle the 'any'
        return `${response.namespace}`
    }

    return await getDotNetNamespace(tree, parentDir, interactive)
}
