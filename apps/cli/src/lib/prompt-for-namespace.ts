import prompts from 'prompts'

export async function promptForNamespaceLocation(): Promise<string> {
    const response = await prompts({
        type: 'text',
        name: 'folder',
        message: `Where is your .NET csproj file? (Leave blank for current working directory)`,
    })

    // handle the 'any'
    return `${response.folder}`
}
