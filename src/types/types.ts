export interface GitHubWorkflowRun {
    id: number
    name: string
    conclusion: string
    updated_at: string
}

export interface GitHubResponse {
    workflow_runs: GitHubWorkflowRun[]
}