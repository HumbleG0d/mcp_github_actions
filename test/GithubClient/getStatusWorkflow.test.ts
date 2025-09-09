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

describe('GithubClient.getStatusWorkflow', () => {
    beforeEach(async () => {
        // Inicializar cliente para cada test
        ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
            user: { login: 'sergio' },
            token: 'test-token'
        })
    })

    it('retorna status del workflow correctamente', async () => {
        // Arrange
        const mockResponse = {
            id: 123,
            name: 'CI Workflow',
            conclusion: 'success',
            status: 'completed',
            updated_at: '2023-12-01T10:00:00Z'
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
        const result = await client.getStatusWorkflow('test-repo', 123)

        // Assert
        expect(result).toEqual({
            status: 'success'
        })
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/sergio/test-repo/actions/runs/123',
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

    it('retorna diferentes tipos de conclusion', async () => {
        // Arrange
        const testCases = [
            { conclusion: 'failure', expected: 'failure' },
            { conclusion: 'cancelled', expected: 'cancelled' },
            { conclusion: 'skipped', expected: 'skipped' },
            { conclusion: 'timed_out', expected: 'timed_out' },
            { conclusion: null, expected: null }
        ]

        for (const testCase of testCases) {
            const mockResponse = {
                id: 123,
                name: 'CI Workflow',
                conclusion: testCase.conclusion,
                status: 'completed'
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
            const result = await client.getStatusWorkflow('test-repo', 123)

            // Assert
            expect(result).toEqual({
                status: testCase.expected
            })
        }
    })

    it('lanza error cuando repositoryName no es string', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getStatusWorkflow('', 123)).rejects.toThrow('Repository name is required and must be a text string')
        await expect(client.getStatusWorkflow(null as any, 123)).rejects.toThrow('Repository name is required and must be a text string')
    })

    it('lanza error cuando runId no es number', async () => {
        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getStatusWorkflow('test-repo', '123' as any)).rejects.toThrow('Run id is required and must be a number')
        await expect(client.getStatusWorkflow('test-repo', null as any)).rejects.toThrow('Run id is required and must be a number')
    })

    it('lanza error cuando la respuesta HTTP no es exitosa', async () => {
        // Arrange
        mockedFetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Workflow run not found'
        } as any)

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getStatusWorkflow('test-repo', 999)).rejects.toThrow('Github API Error: 404 - Not Found. Workflow run not found')
    })

    it('lanza error cuando fetch falla', async () => {
        // Arrange
        mockedFetch.mockRejectedValue(new Error('Network error'))

        // Act & Assert
        const client = new GithubClient()
        await client.initialize()
        await expect(client.getStatusWorkflow('test-repo', 123)).rejects.toThrow('Error get status workflow: Network error')
    })

    it('maneja workflow en progreso', async () => {
        // Arrange
        const mockResponse = {
            id: 123,
            name: 'CI Workflow',
            conclusion: null,
            status: 'in_progress',
            updated_at: '2023-12-01T10:00:00Z'
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
        const result = await client.getStatusWorkflow('test-repo', 123)

        // Assert
        expect(result).toEqual({
            status: null
        })
    })

    it('maneja diferentes tipos de runId', async () => {
        // Arrange
        const mockResponse = {
            id: 0,
            name: 'Test Workflow',
            conclusion: 'success',
            status: 'completed'
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
        const result = await client.getStatusWorkflow('test-repo', 0)

        // Assert
        expect(result.status).toBe('success')
    })
})
