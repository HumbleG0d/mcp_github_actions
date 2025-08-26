import { ToolParams, ToolResponse } from "@/types/types"

export interface IDevOpsMCP{
    registerTools : () => void
    handleShowWorkflows: (repositoryName: ToolParams) => Promise<ToolResponse>
    handleDownloadLogs: ({repositoryName , id} : ToolParams) => Promise<ToolResponse>
    start : () => Promise<void>
}