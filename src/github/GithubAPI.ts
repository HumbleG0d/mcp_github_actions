import {GitHubWorkflowRun , DownloadResult, GitHubRepo, ContentGitubRepo, Tree, UpdateFile , CreateBranch} from "@/types/types"

export interface GithubAPI {

    getAllRepos: () => Promise<GitHubRepo[]>

    getDataWorkflows: (repositoryName: string) => Promise<GitHubWorkflowRun[]>

    getFileLogs: (repositoryName: string , id: number) => Promise<DownloadResult>

    getContentTree:(repositoryName: string , nameBranch: string) => Promise<Tree[]>
    
    getContentFiles: (repositoryName: string,path?: string) => Promise<ContentGitubRepo>

    updateFile: (repositoryName: string , path: string , content:string , sha:string , message:string) => Promise<UpdateFile>

    createBranch: (repositoryName: string , newBranchName: string , sha:string) => Promise<CreateBranch>
}