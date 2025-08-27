import {GitHubWorkflowRun , DownloadResult, GitHubRepo} from "@/types/types"

export interface GithubAPI {

    getAllRepos: () => Promise<GitHubRepo[]>

    getDataWorkflows: (repositoryName: string) => Promise<GitHubWorkflowRun[]>

    getFileLogs: (repositoryName: string , id: number) => Promise<DownloadResult>
}