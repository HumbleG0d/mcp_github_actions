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

describe('GithubClient.getContentTree', () => {
    beforeEach(async () => {
        // Inicializar cliente para cada test
        ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
            user: { login: 'sergio' },
            token: 'test-token'
        })
    })

    it('retorna tree mapeado correctamente', async () => {
        // Arrange
        const mockResponse = {
            tree: [
                {
                    path: 'src/index.ts',
                    type: 'blob',
                    sha: 'abc123'
                },
                {
                    path: 'src/components',
                    type: 'tree',
                    sha: 'def456'
                },
                {
                    path: 'README.md',
                    type: 'blob',
                    sha: 'ghi789'
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
        const result = await client.getContentTree('test-repo', 'main')

        // Assert
        expect(result).toEqual([
            { path: 'src/index.ts', type: 'blob', sha: 'abc123' },
            { path: 'src/components', type: 'tree', sha: 'def456' },
            { path: 'README.md', type: 'blob', sha: 'ghi789' }
        ])
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/sergio/test-repo/git/trees/main?recursive=1',
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

    it('usa branch por defecto cuando no se especifica', async () => {
        // Arrange
        const mockResponse = { tree: [] }

        mockedFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => mockResponse,
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        await client.getContentTree('test-repo', 'main')

        // Assert
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/sergio/test-repo/git/trees/main?recursive=1',
            expect.any(Object)
        )
    })

    it('lanza error cuando repositoryName no es string', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getContentTree('', 'main')).rejects.toThrow('Repository name is required and must be a text string')
        await expect(client.getContentTree(null as any, 'main')).rejects.toThrow('Repository name is required and must be a text string')
    })

    it('lanza error cuando nameBranch no es string', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getContentTree('test-repo', '')).rejects.toThrow('Name branch is required and must be a text string')
        await expect(client.getContentTree('test-repo', null as any)).rejects.toThrow('Name branch is required and must be a text string')
    })

    it('lanza error cuando la respuesta HTTP no es exitosa', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Branch not found'
        } as any)

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getContentTree('test-repo', 'main')).rejects.toThrow('Github API Error: 404 - Not Found. Branch not found')
    })

    it('lanza error cuando fetch falla', async () => {
        // Arrange
        mockedFetch.mockRejectedValue(new Error('Network error'))

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getContentTree('test-repo', 'main')).rejects.toThrow('Error getting workflows: Network error')
    })

    it('retorna array vacío cuando tree está vacío', async () => {
        // Arrange
        const mockResponse = { tree: [] }

        mockedFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => mockResponse,
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.getContentTree('test-repo', 'main')

        // Assert
        expect(result).toEqual([])
    })
})
