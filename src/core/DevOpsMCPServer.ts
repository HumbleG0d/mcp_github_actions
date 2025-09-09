import { GithubClient } from "../github/GithubClient";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { IDevOpsMCP } from "./IDevOpsMCP";
import { z } from "zod";
import { ToolParams, ToolParamsCreateBranch, ToolParamsUpdateFile, ToolResponse } from "@/types/types";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { readMultiplesFile } from "../github/utils/downloadLogs";


export class DevOpsMCPServer implements IDevOpsMCP{
    private githubClient: GithubClient | null = null
    private server: McpServer

    constructor(){
        this.server = new McpServer({
            name: 'MCP-DevOps',
            version: '1.0.0'
        })
        this.registerTools()
    }
    

    //Inicializar el cliente de github
    private async initializeGithubClient (): Promise<GithubClient>{
        if(!this.githubClient){
            this.githubClient = new GithubClient()
            await this.githubClient.initialize()
        }
        return this.githubClient
    }


    //Funcion que registrara las herramientas
    registerTools = () : void => {

        this.server.registerTool("show_repositories" , 
            {
                title: "Show workflows",
                description: "It will show the workflows of a given repository",
                inputSchema: { }
            },
            () => this.handleShowRepos()
        )


        this.server.registerTool("show_workflows" ,
            {
                title: "Show workflows",
                description: "It will show the workflows of a given repository",
                inputSchema: { repositoryName: z.string() }
            },
            (params) => this.handleShowWorkflows( params as ToolParams)
        )

        this.server.registerTool("download_logs" ,
            {
                title: "Download workflows",
                description: "Download the failed workflow logs.",
                inputSchema: { repositoryName: z.string() , id: z.number()}
            },
            (params) => this.handleDownloadLogs(params as ToolParams)
        )

        this.server.registerTool("read_logs" , 
            {
                title: "Read logs",
                description: "Leera los logs del workflow fallido",
                inputSchema: { dirName: z.string() }
            },
            (params) => this.handleReadLogs(params as ToolParams)
        )

        this.server.registerTool("show_content_files" , 
            {
                title: "Show content files",
                description: "It will show the content of a given repository files",
                inputSchema: { repositoryName : z.string() ,  path: z.string()     }
            },
            (params) => this.handleShowContentFiles(params as ToolParams)
        )

        this.server.registerTool("show_content_repo" , {
            title: "Show content repository",
            description: "It will show the content of a given repository",
            inputSchema: { repositoryName : z.string() , nameBranch: z.string() }
        },
        (params) => this.handleShowContentTree(params as ToolParams)
        )

        this.server.registerTool("Update file" , 
            {
                title: "Update file",
                description: "It will update the content of a given file",
                inputSchema: { repositoryName: z.string() , path: z.string() , content: z.string() , sha: z.string() , message: z.string() }
            },
            (params) => this.handleUpdateFile(params as ToolParamsUpdateFile)
        )

        this.server.registerTool("create_branch" , {
            title: "Create branch" ,
            description: "It will create a new branch" ,
            inputSchema: { repositoryName: z.string() , newBranchName: z.string() , sha: z.string() }
        },
        (params) => this.handleCreateBranch(params as ToolParamsCreateBranch)
        )

        this.server.registerTool("rerun_workflow" , 
            {
                title: "Rerun Workflow" ,
                description: "It will rerun a workflow" ,
                inputSchema: {repositoryName: z.string() , id: z.number()}
            },
            (params) => this.handleRerunWorkflow(params as ToolParams)
        )

        this.server.registerTool("status_workflow" , {
            title: "Status Workflow" ,
            description: "It will get the status of a workflow" ,
            inputSchema: {repositoryName: z.string() , id: z.number()}
        },
        (params) => this.handleGetStatusWorkflow(params as ToolParams)
        )
        
    }

    //Obtencion de los repositorios
    async handleShowRepos () : Promise<ToolResponse>{
        try {
            const client = await this.initializeGithubClient()
            const data = await client.getAllRepos()
            return {
                content: [
                    {
                        type: "text",
                        text: `Repositories found: ${JSON.stringify(data, null, 2)}`
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }
    }



    //Obtencion de los workflows
    async handleShowWorkflows (paramas: ToolParams) : Promise<ToolResponse>  {

        try {
            console.log(`Running tool for repository: ${paramas.repositoryName}`)
            const client = await this.initializeGithubClient()
            const data = await client.getDataWorkflows(paramas.repositoryName)
            return {
                content: [
                    {
                        type: "text",
                        text: `Workflows found: ${JSON.stringify(data, null, 2)}`
                    }
                ]
            }
        } catch (error) {
            console.error('Tool error:', error)
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }

    }

    //Obtencion de los logs de un workflow fallido
    async handleDownloadLogs (paramas: ToolParams) : Promise<ToolResponse> {
        try {
            const client = await this.initializeGithubClient()
            const data = await client.getFileLogs(paramas.repositoryName , paramas.id) 
            
            if (!data.success) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error downloading logs: ${data.error || 'Unknown error'}`
                        }
                    ]
                }
            }
            
            return {
                content: [
                    {
                        type: "text",
                        text: `Logs downloaded successfully to: ${data.filename}`
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }
    }

    //Metodo encargado de leer el contenido de los archivos
    async handleReadLogs (params: ToolParams) : Promise<ToolResponse>{
        try {
            const infoLogs = await readMultiplesFile(params.dirName)
            if(!infoLogs){
                return {
                    content: [
                        {
                            type: "text",
                            text: "Contedio del texto vacio"
                        }
                    ]
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `Erro al retornar los archivos leidos ${JSON.stringify(infoLogs, null, 2)}`
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }
    }


    //Metodo que usara el cliente de github para obtener el contenido del arbol del repositorio
    async handleShowContentTree ({ repositoryName, nameBranch }: ToolParams ) : Promise<ToolResponse> {
        try {
            const client = await this.initializeGithubClient()
            const data = await client.getContentTree(repositoryName , nameBranch)
            return {
                content: [
                    {
                        type: "text",
                        text: `Contenido del repositorio: ${JSON.stringify(data, null, 2)}`
                    }
                ]
            }
        }catch(error){
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }
    }




    //Metodo que usara el cliente de github para obtener el contenido de los archivos del repositorio
    async handleShowContentFiles (params: ToolParams) : Promise<ToolResponse>{
        try {
            const client = await this.initializeGithubClient()
            const data = await client.getContentFiles(params.repositoryName, params.path)
            return {
                content: [
                    {
                        type: "text",
                        text: `View content files: ${JSON.stringify(data, null, 2)}`
                    }
                ]
            }
        }catch(error){
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }
    }


    //Metodo que usara el cliente de github para actualizar el contenido de los archivos del repositorio

    async handleUpdateFile (params : ToolParamsUpdateFile) : Promise<ToolResponse> {
        try {
            const client = await this.initializeGithubClient()
            const data = await client.updateFile(params.repositoryName, params.path, params.content, params.sha, params.message) 
            return {
                content: [
                    {
                        type: "text",
                        text: `Update file: ${JSON.stringify(data, null, 2)}`
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }
    }

    async handleCreateBranch ({ repositoryName, newBranchName, sha }: ToolParamsCreateBranch) : Promise<ToolResponse> {
        try {
            const client = await this.initializeGithubClient()
            const data = await client.createBranch(repositoryName, newBranchName, sha)
            return {
                content: [
                    {
                        type: "text",
                        text: `Create branch: ${JSON.stringify(data, null, 2)}`
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }
    }


    async handleRerunWorkflow ( paramas : ToolParams) : Promise<ToolResponse> {
        try {
            const client = await this.initializeGithubClient()
            const data = await client.rerunWorkflow(paramas.repositoryName, paramas.id)
            return {
                content: [
                    {
                        type: "text",
                        text: `Rerun workflow: ${JSON.stringify(data, null, 2)}`
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }
    }

    async handleGetStatusWorkflow (paramas: ToolParams) : Promise<ToolResponse> {
        try {
            const client = await this.initializeGithubClient()
            const data = await client.getStatusWorkflow(paramas.repositoryName, paramas.id)
            return {
                content: [
                    {
                        type: "text",
                        text: `Status workflow: ${JSON.stringify(data, null, 2)}`
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            }
        }
    }
    


    async start(): Promise<void> {
        try {
          const transport = new StdioServerTransport()
          await this.server.connect(transport)
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Error initial server: ${error.message}`)
          }
          throw new Error('Unknown error initial server user')
        }
    }
}