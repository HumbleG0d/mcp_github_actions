import { GithubClient } from '../../src/github/GithubClient'
import { getCredentidalGithub } from '../../src/github/credentialsGithub'

// Mock de credenciales
jest.mock('../../src/github/credentialsGithub', () => ({
    getCredentidalGithub: jest.fn()
}))

// Mock global fetch
global.fetch = jest.fn()
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>

beforeEach(() => {
    jest.clearAllMocks()
})

describe('GithubClient.getDataWorkflows', () => {
    beforeEach(async () => {
        // Inicializar cliente para cada test
        ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
            user: { login: 'sergio' },
            token: 'test-token'
        })
    })

    it('retorna workflows mapeados correctamente', async () => {
        // Arrange
        const mockResponse = {
            workflow_runs: [
                {
                    id: 123,
                    name: 'CI Workflow',
                    conclusion: 'success',
                    updated_at: '2023-12-01T10:00:00Z'
                },
                {
                    id: 124,
                    name: 'Deploy Workflow',
                    conclusion: 'failure',
                    updated_at: '2023-12-01T11:00:00Z'
                }
            ]
        }

        mockedFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => mockResponse,
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.getDataWorkflows('test-repo')

        // Assert
        expect(result).toEqual([
            {
                id: 123,
                name: 'CI Workflow',
                conclusion: 'success',
                updated_at: '2023-12-01T10:00:00Z'
            },
            {
                id: 124,
                name: 'Deploy Workflow',
                conclusion: 'failure',
                updated_at: '2023-12-01T11:00:00Z'
            }
        ])
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/sergio/test-repo/actions/runs',
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': 'Bearer test-token',
                    'User-Agent': 'MCP-DevOps/1.0.0',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        )
    })

    it('lanza error cuando repositoryName no es string', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getDataWorkflows('')).rejects.toThrow('Repository name is required and must be a text string')
        await expect(client.getDataWorkflows(null as any)).rejects.toThrow('Repository name is required and must be a text string')
    })

    it('lanza error cuando workflow_runs no existe en la respuesta', async () => {
        // Arrange
        const mockResponse = { total_count: 0 }

        mockedFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => mockResponse,
        } as any)

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getDataWorkflows('test-repo')).rejects.toThrow('GitHub response does not contain valid workflow_runs')
    })

    it('lanza error cuando workflow_runs no es array', async () => {
        // Arrange
        const mockResponse = { workflow_runs: 'not-an-array' }

        mockedFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => mockResponse,
        } as any)

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getDataWorkflows('test-repo')).rejects.toThrow('GitHub response does not contain valid workflow_runs')
    })

    it('lanza error cuando la respuesta HTTP no es exitosa', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Repository not found'
        } as any)

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getDataWorkflows('test-repo')).rejects.toThrow('Github API Error: 404 - Not Found. Repository not found')
    })

    it('lanza error cuando fetch falla', async () => {
        // Arrange
        mockedFetch.mockRejectedValue(new Error('Network error'))

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getDataWorkflows('test-repo')).rejects.toThrow('Error getting workflows: Network error')
    })
})
