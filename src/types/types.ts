export interface GitHubRepo{
    id: number
    name: string
    private: boolean
}

export type GitHubAllRepos = GitHubRepo[]

export interface GitHubUser {
    login: string
    id: number
    name?: string
    email?: string
}

export interface GitHubCredentials {
    user: GitHubUser ,
    token: string
}


export interface GitHubWorkflowRun {
    id: number
    name: string
    conclusion: string
    updated_at: string
}

export interface GitHubResponse {
    workflow_runs: GitHubWorkflowRun[]
}

export interface DownloadResult{
    success: boolean
    filename?: string
    error?: string
}

export interface ToolResponse{
    content: Array<{
        type: 'text',
        text: string
    }>
    [key: string]: unknown
}

export interface ToolParams{
    id: number
    repositoryName: string
    dirName: string
}