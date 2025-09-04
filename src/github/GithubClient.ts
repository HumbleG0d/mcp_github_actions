import { GithubAPI } from "./GithubAPI"
import { GitHubWorkflowRun, DownloadResult, GitHubResponse, GitHubRepo, GitHubAllRepos, ContentGitubRepo, Tree, Welcome } from "@/types/types"
import { getCredentidalGithub } from "./credentialsGithub"
import { downloadLogs } from "./utils/downloadLogs"

export class GithubClient implements GithubAPI {
    private  token?: string
    private  user?: string
    private isInitialize = false

    constructor(){    }

    private buildHeaders(accept: string): Record<string, string> {
        this.ensureInitialized()
        return {
            'Accept': accept,
            'Authorization': `Bearer ${this.token}`,
            'User-Agent': 'MCP-DevOps/1.0.0',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    }

    private ensureOk = async ( response : Response) : Promise<void> => {
        if(!response.ok){
            const errorText = await response.text()
            throw new Error(`Github API Error: ${response.status} - ${response.statusText}. ${errorText}`)
        }
    }

    async initialize(): Promise<void> {
        if (this.isInitialize) return
        
        try {
            const { user, token } = await getCredentidalGithub()
            this.user = user.login
            this.token = token
            this.isInitialize = true
        } catch (error) {
            throw new Error(`Failed to initialize GitHub client: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    private ensureInitialized(): void {
        if (!this.isInitialize || !this.token || !this.user) {
            throw new Error('GitHub client not initialized. Call initialize() first.')
        }
    }


    async getAllRepos() : Promise<GitHubRepo[]> {
        try {
            const response = await fetch('https://api.github.com/user/repos' , {
                method: 'GET' , 
                headers: this.buildHeaders('application/vnd.github.v3+json')
            })

            await this.ensureOk(response)
            const data = await response.json() as GitHubAllRepos

            const repodaData : GitHubRepo[] = data.map(repo => ({
                id: repo.id,
                name: repo.name,
                private: repo.private
            }))

            return repodaData
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error getting repositories: ${error.message}`)
            }
            throw new Error('Unknown error getting repositories')
        }
    }


    async getDataWorkflows(repositoryName: string): Promise<GitHubWorkflowRun[]> {
        this.ensureInitialized()
        
        if (!repositoryName || typeof repositoryName !== 'string') {
            throw new Error('Repository name is required and must be a text string')
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${this.user}/${encodeURIComponent(repositoryName)}/actions/runs` , {
                method: 'GET' ,
                headers: this.buildHeaders('application/vnd.github.v3+json')
            })

            await this.ensureOk(response)
            const data = await response.json() as GitHubResponse

            //Validamos workflow_runs exista y sea un array
            if(!data.workflow_runs || !Array.isArray(data.workflow_runs)){
                throw new Error('GitHub response does not contain valid workflow_runs')
            }

            const filteredData: GitHubWorkflowRun[] = data.workflow_runs.map(run => ({
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

    async getFileLogs(repositoryName: string, id: number): Promise<DownloadResult> {
        this.ensureInitialized()
        
        if (!repositoryName || typeof repositoryName !== 'string') {
            throw new Error('Repository name is required and must be a text string')
        }

        if(typeof id !== 'number') {
            throw new Error('Repository id is required and must be a number')
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${this.user}/${encodeURIComponent(repositoryName)}/actions/runs/${encodeURIComponent(id)}/logs` , {
                redirect: 'follow',
                headers: this.buildHeaders('application/vnd.github+json')
            })

            await this.ensureOk(response)

            // Verificar si hay logs disponibles
            if (response.status === 204) {
                return {
                    success: false,
                    error: 'No logs available for this workflow run'
                }
            }

            return await downloadLogs(id, response)
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error getting file logs'
            }
        }
    }

    //Retorna el contenido del arbol del repositorio
    async getContentTree (repositoryName: string, nameBranch: string | "main") : Promise<Tree[]> {
        this.ensureInitialized()


        if (!repositoryName || typeof repositoryName !== 'string') {
            throw new Error('Repository name is required and must be a text string')
        }

        if (!nameBranch || typeof nameBranch !== 'string') {
            throw new Error('Name branch is required and must be a text string')
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${this.user}/${encodeURIComponent(repositoryName)}/git/trees/${encodeURIComponent(nameBranch)}?recursive=1` , {
                method: 'GET',
                headers: this.buildHeaders('application/vnd.github.v3+json')
            })

            await this.ensureOk(response)
            const data = await response.json() as Welcome
            
            const treeData : Tree[] = data.tree.map(tree => ({
                path: tree.path,
                type: tree.type,
                sha: tree.sha
            }))
            
            return treeData

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error getting workflows: ${error.message}`)
            }
            throw new Error('Unknown error getting workflows')
        }

    }

    //Retornar el contenido de los archivos del repositorio
    async getContentFiles (repositoryName: string , path? : string): Promise<ContentGitubRepo>{
        this.ensureInitialized()

        try {
            // Construir la URL correctamente para manejar path undefined o vacío
            const baseUrl = `https://api.github.com/repos/${this.user}/${encodeURIComponent(repositoryName)}/contents`
            const url = path && path.trim() !== '' ? `${baseUrl}/${encodeURIComponent(path)}` : baseUrl
            
            const response = await fetch(url , {
                method: 'GET',
                headers: this.buildHeaders('application/vnd.github.v3+json')
            })

            await this.ensureOk(response)

            const data = await response.json() as ContentGitubRepo

            const repoData : ContentGitubRepo = {
                name: data.name,
                path: data.path,
                sha: data.sha,
                type: data.type,
                content: Buffer.from(data.content , 'base64').toString('utf-8')
            }
            return repoData
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error getting bring content repo: ${error.message}`)
            }
            throw new Error('Unknown error getting bring content repo ')
        }
        
    }

}