import { GithubClient } from '../../src/github/GithubClient'
import { getCredentidalGithub } from '../../src/github/credentialsGithub'

// Mock de credenciales
jest.mock('../../src/github/credentialsGithub', () => ({
  getCredentidalGithub: jest.fn(),
}))

// Mock global fetch
global.fetch = jest.fn()
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GithubClient.getContentFiles', () => {
  beforeEach(async () => {
    // Inicializar cliente para cada test
    ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
      user: { login: 'sergio' },
      token: 'test-token',
    })
  })

  it('retorna contenido de archivo decodificado correctamente', async () => {
    // Arrange
    const mockContent = 'console.log("Hello World");'
    const encodedContent = Buffer.from(mockContent).toString('base64')

    const mockResponse = {
      name: 'index.js',
      path: 'src/index.js',
      sha: 'abc123',
      type: 'file',
      content: encodedContent,
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
    const result = await client.getContentFiles('test-repo', 'src/index.js')

    // Assert
    expect(result).toEqual({
      name: 'index.js',
      path: 'src/index.js',
      sha: 'abc123',
      type: 'file',
      content: mockContent,
    })
    expect(mockedFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/sergio/test-repo/contents/src%2Findex.js',
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: 'Bearer test-token',
          'User-Agent': 'MCP-DevOps/1.0.0',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )
  })

  it('construye URL correctamente sin path', async () => {
    // Arrange
    const mockResponse = {
      name: 'README.md',
      path: 'README.md',
      sha: 'def456',
      type: 'file',
      content: Buffer.from('# Test Repo').toString('base64'),
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
    await client.getContentFiles('test-repo')

    // Assert
    expect(mockedFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/sergio/test-repo/contents',
      expect.any(Object)
    )
  })

  it('construye URL correctamente con path vacío', async () => {
    // Arrange
    const mockResponse = {
      name: 'README.md',
      path: 'README.md',
      sha: 'def456',
      type: 'file',
      content: Buffer.from('# Test Repo').toString('base64'),
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
    await client.getContentFiles('test-repo', '')

    // Assert
    expect(mockedFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/sergio/test-repo/contents',
      expect.any(Object)
    )
  })

  it('lanza error cuando repositoryName no es string', async () => {
    // Act & Assert
    const client = new GithubClient()
    await client.initialize()
    await expect(client.getContentFiles('', 'path')).rejects.toThrow(
      'Repository name is required and must be a text string'
    )
    await expect(client.getContentFiles(null as any, 'path')).rejects.toThrow(
      'Repository name is required and must be a text string'
    )
  })

  it('lanza error cuando path no es string', async () => {
    // Act & Assert
    const client = new GithubClient()
    await client.initialize()
    await expect(
      client.getContentFiles('test-repo', 123 as any)
    ).rejects.toThrow('Path is required and must be a text string')
  })

  it('lanza error cuando la respuesta HTTP no es exitosa', async () => {
    // Arrange
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'File not found',
    } as any)

    // Act & Assert
    const client = new GithubClient()
    await client.initialize()
    await expect(
      client.getContentFiles('test-repo', 'src/index.js')
    ).rejects.toThrow('Github API Error: 404 - Not Found. File not found')
  })

  it('lanza error cuando fetch falla', async () => {
    // Arrange
    mockedFetch.mockRejectedValue(new Error('Network error'))

    // Act & Assert
    const client = new GithubClient()
    await client.initialize()
    await expect(
      client.getContentFiles('test-repo', 'src/index.js')
    ).rejects.toThrow('Error getting bring content repo: Network error')
  })

  it('maneja contenido con caracteres especiales', async () => {
    // Arrange
    const mockContent = 'console.log("Hola mundo 🌍");\nconst ñ = "español";'
    const encodedContent = Buffer.from(mockContent).toString('base64')

    const mockResponse = {
      name: 'test.js',
      path: 'src/test.js',
      sha: 'xyz789',
      type: 'file',
      content: encodedContent,
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
    const result = await client.getContentFiles('test-repo', 'src/test.js')

    // Assert
    expect(result.content).toBe(mockContent)
  })
})
