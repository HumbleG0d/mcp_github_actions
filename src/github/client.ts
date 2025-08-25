//Conexion con la API de GitHub
import { GitHubResponse ,  GitHubWorkflowRun} from "@/types/types"


export const getDataWorkflows = async (repositoryName: string): Promise<GitHubWorkflowRun[]> => {
    // Validar input
    if (!repositoryName || typeof repositoryName !== 'string') {
        throw new Error('Repository name is required and must be a text string')
    }

    // Validar que GITHUB_TOKEN este configurado
    const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
    if (!TOKEN) {
        throw new Error('GITHUB_TOKEN environment variable is not configured. Please set it in your MCP client configuration.')
    }
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/HumbleG0d/${encodeURIComponent(repositoryName)}/actions/runs`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${TOKEN}`,
                    'User-Agent': 'MCP-DevOps/1.0.0'
                }
            }
        )
        
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`GitHub API Error: ${response.status} - ${response.statusText}. ${errorText}`)
        }
        
        const data = await response.json() as GitHubResponse
        
        // Validar que workflow_runs existe y es un array
        if (!data.workflow_runs || !Array.isArray(data.workflow_runs)) {
            throw new Error('GitHub response does not contain valid workflow_runs')
        }
        
        // Mapear y filtrar solo los campos necesarios
        const filteredData:  GitHubWorkflowRun[] = data.workflow_runs.map(run => ({
            id: run.id,
            name: run.name,
            conclusion: run.conclusion,
            updated_at: run.updated_at
        }))
        
        return filteredData
        
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error getting workflows: ${error.message}`)
        }
        throw new Error('Unknown error getting workflows')
    }
}