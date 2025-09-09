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

describe('GithubClient.getAllRepos', () => {
    beforeEach(async () => {
        // Inicializar cliente para cada test
        ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
            user: { login: 'sergio' },
            token: 'test-token'
        })
    })

    it('retorna repositorios mapeados correctamente', async () => {
        // Arrange
        const mockRepos = [
            { id: 1, name: 'repo1', private: false },
            { id: 2, name: 'repo2', private: true }
        ]

        mockedFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => mockRepos,
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.getAllRepos()

        // Assert
        expect(result).toEqual([
            { id: 1, name: 'repo1', private: false },
            { id: 2, name: 'repo2', private: true }
        ])
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/user/repos',
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

    it('retorna array vacío cuando no hay repositorios', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => [],
        } as any)

        // Act
        const client = new GithubClient()
        await client.initialize()
        const result = await client.getAllRepos()

        // Assert
        expect(result).toEqual([])
    })

    it('lanza error cuando la respuesta HTTP no es exitosa', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            text: async () => 'Bad credentials'
        } as any)

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getAllRepos()).rejects.toThrow('Github API Error: 401 - Unauthorized. Bad credentials')
    })

    it('lanza error cuando fetch falla', async () => {
        // Arrange
        mockedFetch.mockRejectedValue(new Error('Network error'))

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getAllRepos()).rejects.toThrow('Error getting repositories: Network error')
    })
})
