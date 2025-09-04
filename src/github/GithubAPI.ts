import {GitHubWorkflowRun , DownloadResult, GitHubRepo, ContentGitubRepo, Tree, UpdateFile} from "@/types/types"

export interface GithubAPI {

    getAllRepos: () => Promise<GitHubRepo[]>

    getDataWorkflows: (repositoryName: string) => Promise<GitHubWorkflowRun[]>

    getFileLogs: (repositoryName: string , id: number) => Promise<DownloadResult>

    getContentTree:(repositoryName: string , nameBranch: string) => Promise<Tree[]>
    
    getContentFiles: (repositoryName: string,path?: string) => Promise<ContentGitubRepo>

    updateFile: (repositoryName: string , path: string , content:string) => Promise<UpdateFile>
}