import { GithubClient } from '../../src/github/GithubClient'
import { getCredentidalGithub } from '../../src/github/credentialsGithub'
import { downloadLogs } from '../../src/github/utils/downloadLogs'

// Mock de credenciales
jest.mock('../../src/github/credentialsGithub', () => ({
    getCredentidalGithub: jest.fn()
}))

// Mock de downloadLogs
jest.mock('../../src/github/utils/downloadLogs', () => ({
    downloadLogs: jest.fn()
}))

// Mock global fetch
global.fetch = jest.fn()
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>

beforeEach(() => {
    jest.clearAllMocks()
})

describe('GithubClient.getFileLogs', () => {
    beforeEach(async () => {
        // Inicializar cliente para cada test
        ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
            user: { login: 'sergio' },
            token: 'test-token'
        })
    })

    it('descarga logs exitosamente y llama a downloadLogs', async () => {
        // Arrange
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK'
        } as Response

        const mockDownloadResult = {
            success: true,
            filename: 'logs-123.zip'
        }

        mockedFetch.mockResolvedValue(mockResponse)
        ;(downloadLogs as jest.Mock).mockResolvedValue(mockDownloadResult)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.getFileLogs('test-repo', 123)

        // Assert
        expect(result).toEqual(mockDownloadResult)
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/sergio/test-repo/actions/runs/123/logs',
            {
                redirect: 'follow',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': 'Bearer test-token',
                    'User-Agent': 'MCP-DevOps/1.0.0',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        )
        expect(downloadLogs).toHaveBeenCalledWith(123, mockResponse)
    })

    it('retorna error cuando no hay logs disponibles (status 204)', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: true,
            status: 204,
            statusText: 'No Content'
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.getFileLogs('test-repo', 123)

        // Assert
        expect(result).toEqual({
            success: false,
            error: 'No logs available for this workflow run'
        })
        expect(downloadLogs).not.toHaveBeenCalled()
    })

    it('lanza error cuando repositoryName no es string', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getFileLogs('', 123)).rejects.toThrow('Repository name is required and must be a text string')
        await expect(client.getFileLogs(null as any, 123)).rejects.toThrow('Repository name is required and must be a text string')
    })

    it('lanza error cuando id no es number', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getFileLogs('test-repo', '123' as any)).rejects.toThrow('Repository id is required and must be a number')
        await expect(client.getFileLogs('test-repo', null as any)).rejects.toThrow('Repository id is required and must be a number')
    })

    it('retorna error cuando fetch falla', async () => {
        // Arrange
        mockedFetch.mockRejectedValue(new Error('Network error'))

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.getFileLogs('test-repo', 123)

        // Assert
        expect(result).toEqual({
            success: false,
            error: 'Network error'
        })
    })

    it('retorna error cuando downloadLogs falla', async () => {
        // Arrange
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK'
        } as Response

        mockedFetch.mockResolvedValue(mockResponse)
        ;(downloadLogs as jest.Mock).mockRejectedValue(new Error('Download failed'))

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.getFileLogs('test-repo', 123)

        // Assert
        expect(result).toEqual({
            success: false,
            error: 'Download failed'
        })
    })
})
