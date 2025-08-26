import { GithubAPI } from "./GithubAPI"
import { GitHubWorkflowRun, DownloadResult, GitHubResponse } from "@/types/types"
import { getCredentidalGithub } from "./credentialsGithub"
import { writeFile } from "fs/promises"

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
            'User-Agent': 'MCP-DevOps/1.0.0'
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
                headers: this.buildHeaders('application/vnd.github.v3.raw')
            })

            await this.ensureOk(response)

            //Triger para descargar los logs
            const buffer = Buffer.from( await response.arrayBuffer())
            const filenName = `log_${id}`
            await writeFile(filenName , buffer)

            return {
                success: true,
                filename: filenName
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error getting file logs'
            }
        }
    }
}