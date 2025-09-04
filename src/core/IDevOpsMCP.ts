import { ToolParams, ToolResponse } from "@/types/types"

export interface IDevOpsMCP{
    registerTools : () => void
    handleShowRepos: () => Promise<ToolResponse>
    handleShowWorkflows: (repositoryName: ToolParams) => Promise<ToolResponse>
    handleDownloadLogs: ({repositoryName , id} : ToolParams) => Promise<ToolResponse>
    handleReadLogs: (filename : ToolParams) => Promise<ToolResponse>
    
    //Metodo para mostrar el contenido del repositorio
    handleShowContentFiles: ({repositoryName , path}: ToolParams) => Promise<ToolResponse>

    handleShowContentTree: ({repositoryName , nameBranch} : ToolParams) => Promise<ToolResponse> 
    
    //Metodo para acceder al respostorio y modficar los archivos 
    
    //Metodo para hacer push y pull
    
    //Creacion de otra rama
    
    //Metodo para hacer Re-run 
    start : () => Promise<void>
}