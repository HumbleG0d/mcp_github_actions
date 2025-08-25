//MCP server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod";
import { getDataWorkflows } from "../github/client";

//Creacion del MCP server
const server = new McpServer({
    name: 'MCP-DevOps',
    version: '1.0.0'
})

//Herramienta
server.registerTool(
    "show_workflows",
    {
        title: "Show workflows",
        description: "It will show the workflows of a given repository",
        inputSchema: { repositoryName: z.string() }
    },
    async ({ repositoryName }) => {
        try {
            console.log(`Running tool for repository: ${repositoryName}`)
            const data = await getDataWorkflows(repositoryName)
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
)

//Iniciar MCP
async function startServer() {
    try {
        const transport = new StdioServerTransport()
        await server.connect(transport)
    } catch (error) {
        console.error('Error starting MCP server:', error)
        process.exit(1)
    }
}

startServer()
