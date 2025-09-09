import {
  GitHubWorkflowRun,
  DownloadResult,
  GitHubRepo,
  ContentGitubRepo,
  Tree,
  UpdateFile,
  CreateBranch,
  RerunWorkflow,
  StatusWorkflow,
} from '@/types/types'

export interface GithubAPI {
  getAllRepos: () => Promise<GitHubRepo[]>

  getDataWorkflows: (repositoryName: string) => Promise<GitHubWorkflowRun[]>

  getFileLogs: (repositoryName: string, id: number) => Promise<DownloadResult>

  getContentTree: (
    repositoryName: string,
    nameBranch: string
  ) => Promise<Tree[]>

  getContentFiles: (
    repositoryName: string,
    path?: string
  ) => Promise<ContentGitubRepo>

  updateFile: (
    repositoryName: string,
    path: string,
    content: string,
    sha: string,
    message: string
  ) => Promise<UpdateFile>

  rerunWorkflow: (
    repositoryName: string,
    runId: number
  ) => Promise<RerunWorkflow>

  getStatusWorkflow: (
    repositoryName: string,
    runId: number
  ) => Promise<StatusWorkflow>

  createBranch: (
    repositoryName: string,
    newBranchName: string,
    sha: string
  ) => Promise<CreateBranch>
}
