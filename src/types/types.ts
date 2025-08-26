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