import {GitHubWorkflowRun , DownloadResult} from "@/types/types"

export interface GithubAPI {
    getDataWorkflows: (repositoryName: string) => Promise<GitHubWorkflowRun[]>

    getFileLogs: (repositoryName: string , id: number) => Promise<DownloadResult>
}