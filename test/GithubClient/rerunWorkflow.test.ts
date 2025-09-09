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

describe('GithubClient.rerunWorkflow', () => {
    beforeEach(async () => {
        // Inicializar cliente para cada test
        ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
            user: { login: 'sergio' },
            token: 'test-token'
        })
    })

    it('reinicia workflow correctamente', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: true,
            status: 201,
            statusText: 'Created',
            text: async () => ''
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.rerunWorkflow('test-repo', 123)

        // Assert
        expect(result).toEqual({
            message: 'Rerun workflow initiated successfully',
            status: 'queued'
        })
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/sergio/test-repo/actions/runs/123/rerun',
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': 'Bearer test-token',
                    'User-Agent': 'MCP-DevOps/1.0.0',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        )
    })

    it('maneja respuesta exitosa sin contenido', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: true,
            status: 204,
            statusText: 'No Content',
            text: async () => ''
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.rerunWorkflow('test-repo', 456)

        // Assert
        expect(result).toEqual({
            message: 'Rerun workflow initiated successfully',
            status: 'queued'
        })
    })

    it('lanza error cuando repositoryName no es string', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.rerunWorkflow('', 123)).rejects.toThrow('Repository name is required and must be a text string')
        await expect(client.rerunWorkflow(null as any, 123)).rejects.toThrow('Repository name is required and must be a text string')
    })

    it('lanza error cuando runId no es number', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.rerunWorkflow('test-repo', '123' as any)).rejects.toThrow('Run id is required and must be a number')
        await expect(client.rerunWorkflow('test-repo', null as any)).rejects.toThrow('Run id is required and must be a number')
    })

    it('lanza error cuando la respuesta HTTP no es exitosa', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: false,
            status: 403,
            statusText: 'Forbidden',
            text: async () => 'Workflow run not found or insufficient permissions'
        } as any)

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.rerunWorkflow('test-repo', 999)).rejects.toThrow('GitHub API Error: 403 - Forbidden. Workflow run not found or insufficient permissions')
    })

    it('lanza error cuando fetch falla', async () => {
        // Arrange
        mockedFetch.mockRejectedValue(new Error('Network error'))

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.rerunWorkflow('test-repo', 123)).rejects.toThrow('Error rerun workflow: Network error')
    })

    it('maneja diferentes tipos de runId', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: true,
            status: 201,
            statusText: 'Created',
            text: async () => ''
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result1 = await client.rerunWorkflow('test-repo', 0)
        const result2 = await client.rerunWorkflow('test-repo', 999999)

        // Assert
        expect(result1.status).toBe('queued')
        expect(result2.status).toBe('queued')
        expect(mockedFetch).toHaveBeenCalledTimes(2)
    })

    it('maneja respuesta con contenido vacío', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: true,
            status: 201,
            statusText: 'Created',
            text: async () => '{}'
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.rerunWorkflow('test-repo', 123)

        // Assert
        expect(result.message).toBe('Rerun workflow initiated successfully')
        expect(result.status).toBe('queued')
    })
})
