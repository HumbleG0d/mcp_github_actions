import { ToolParams, ToolResponse } from "@/types/types"

export interface IDevOpsMCP{
    registerTools : () => void
    handleShowRepos: () => Promise<ToolResponse>
    handleShowWorkflows: (repositoryName: ToolParams) => Promise<ToolResponse>
    handleDownloadLogs: ({repositoryName , id} : ToolParams) => Promise<ToolResponse>
    start : () => Promise<void>
}