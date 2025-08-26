import { GithubClient } from "../github/GithubClient";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { IDevOpsMCP } from "./IDevOpsMCP";
import { z } from "zod";
import { ToolParams, ToolResponse } from "@/types/types";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";


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
                        text: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
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
            return {
                content: [
                    {
                        type: "text",
                        text: `Logs downloaded successfully: ${data.filename}`
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


    async start() : Promise<void>{
        try {
            const transport = new StdioServerTransport()
            await this.server.connect(transport)
        } catch (error) {
            console.error('Error starting MCP server:', error)
            process.exit(1)
        }
    } 
}