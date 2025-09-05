import { ToolParams, ToolParamsUpdateFile, ToolResponse , ToolParamsCreateBranch } from "@/types/types"

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
    handleUpdateFile: ({repositoryName , path , content , sha , message} : ToolParamsUpdateFile) =>Promise<ToolResponse>

    //Creacion de otra rama
    handleCreateBranch: ({repositoryName , newBranchName ,sha} : ToolParamsCreateBranch) => Promise<ToolResponse>
    //Metodo para hacer push y pull
    
    
    //Metodo para hacer Re-run 
    start : () => Promise<void>
}