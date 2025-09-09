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

describe('GithubClient.createBranch', () => {
    beforeEach(async () => {
        // Inicializar cliente para cada test
        ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
            user: { login: 'sergio' },
            token: 'test-token'
        })
    })

    it('crea rama correctamente con estructura refs/heads/', async () => {
        // Arrange
        const mockResponse = {
            ref: 'refs/heads/feature-branch',
            sha: 'abc123def456'
        }

        mockedFetch.mockResolvedValue({
            ok: true,
            status: 201,
            statusText: 'Created',
            json: async () => mockResponse,
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.createBranch('test-repo', 'feature-branch', 'main-sha')

        // Assert
        expect(result).toEqual({
            message: 'Create branch',
            sha: 'abc123def456'
        })
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/sergio/test-repo/git/refs',
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': 'Bearer test-token',
                    'User-Agent': 'MCP-DevOps/1.0.0',
                    'X-GitHub-Api-Version': '2022-11-28'
                },
                body: JSON.stringify({
                    ref: 'refs/heads/feature-branch',
                    sha: 'main-sha'
                })
            }
        )
    })

    it('crea rama con nombre que contiene caracteres especiales', async () => {
        // Arrange
        const branchName = 'feature/update-user-interface'
        const mockResponse = {
            ref: `refs/heads/${branchName}`,
            sha: 'xyz789'
        }

        mockedFetch.mockResolvedValue({
            ok: true,
            status: 201,
            statusText: 'Created',
            json: async () => mockResponse,
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.createBranch('test-repo', branchName, 'main-sha')

        // Assert
        expect(result).toEqual({
            message: 'Create branch',
            sha: 'xyz789'
        })
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/sergio/test-repo/git/refs',
            expect.objectContaining({
                body: JSON.stringify({
                    ref: `refs/heads/${branchName}`,
                    sha: 'main-sha'
                })
            })
        )
    })

    it('lanza error cuando repositoryName no es string', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.createBranch('', 'branch', 'sha')).rejects.toThrow('Repository name is required and must be a text string')
        await expect(client.createBranch(null as any, 'branch', 'sha')).rejects.toThrow('Repository name is required and must be a text string')
    })

    it('lanza error cuando newBranchName no es string', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.createBranch('test-repo', '', 'sha')).rejects.toThrow('Branch name is required and must be a text string')
        await expect(client.createBranch('test-repo', null as any, 'sha')).rejects.toThrow('Branch name is required and must be a text string')
    })

    it('lanza error cuando sha no es string', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.createBranch('test-repo', 'branch', '')).rejects.toThrow('SHA is required and must be a text string')
        await expect(client.createBranch('test-repo', 'branch', null as any)).rejects.toThrow('SHA is required and must be a text string')
    })

    it('lanza error cuando la respuesta HTTP no es exitosa', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: false,
            status: 422,
            statusText: 'Unprocessable Entity',
            text: async () => 'Branch already exists'
        } as any)

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.createBranch('test-repo', 'existing-branch', 'sha')).rejects.toThrow('Github API Error: 422 - Unprocessable Entity. Branch already exists')
    })

    it('lanza error cuando fetch falla', async () => {
        // Arrange
        mockedFetch.mockRejectedValue(new Error('Network error'))

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.createBranch('test-repo', 'branch', 'sha')).rejects.toThrow('Error create branch: Network error')
    })

    it('maneja respuesta con status 201 (Created)', async () => {
        // Arrange
        const mockResponse = {
            ref: 'refs/heads/new-branch',
            sha: 'new-sha-123'
        }

        mockedFetch.mockResolvedValue({
            ok: true,
            status: 201,
            statusText: 'Created',
            json: async () => mockResponse,
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.createBranch('test-repo', 'new-branch', 'base-sha')

        // Assert
        expect(result.message).toBe('Create branch')
        expect(result.sha).toBe('new-sha-123')
    })
})
