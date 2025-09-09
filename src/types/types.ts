export interface GitHubRepo {
  id: number
  name: string
  private: boolean
}

export interface ContentGitubRepo {
  name: string
  path: string
  sha: string
  type: string
  content: string
}

export type GitHubAllRepos = GitHubRepo[]

//export type ContentGithubRepos = ContentGitubRepo []

export interface GitHubUser {
  login: string
  id: number
  name?: string
  email?: string
}

export interface GitHubCredentials {
  user: GitHubUser
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

export interface DownloadResult {
  success: boolean
  filename?: string
  error?: string
}

export interface ToolResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
  [key: string]: unknown
}

export interface ToolParams {
  id: number
  repositoryName: string
  dirName: string
  path: string
  nameBranch: string
}

export interface Welcome {
  sha: string
  tree: Tree[]
}

export interface Tree {
  path: string
  type: Type
  sha: string
}

export enum Type {
  Blob = 'blob',
  Tree = 'tree',
}

export interface UpdateFile {
  message: string
  sha: string
  content: string
}

export interface ToolParamsUpdateFile {
  repositoryName: string
  path: string
  content: string
  sha: string
  message: string
}

export interface ToolParamsCreateBranch {
  repositoryName: string
  newBranchName: string
  sha: string
}

export interface CreateBranch {
  message: string
  sha: string
}

export interface RerunWorkflow {
  message: string
  status: string
}

export interface StatusWorkflow {
  status: string
}
