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

describe('GithubClient.updateFile', () => {
  beforeEach(async () => {
    // Inicializar cliente para cada test
    ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
      user: { login: 'sergio' },
      token: 'test-token',
    })
  })

  it('actualiza archivo correctamente con encoding base64', async () => {
    // Arrange
    const newContent = 'console.log("Updated content");'
    const encodedContent = Buffer.from(newContent).toString('base64')
    const sha = 'abc123'
    const message = 'Update file'

    const mockResponse = {
      message: 'File updated successfully',
      sha: 'def456',
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
    const result = await client.updateFile(
      'test-repo',
      'src/index.js',
      newContent,
      sha,
      message
    )

    // Assert
    expect(result).toEqual({
      message: 'File updated successfully',
      sha: 'def456',
      content: newContent,
    })
    expect(mockedFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/sergio/test-repo/contents/src%2Findex.js',
      {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: 'Bearer test-token',
          'User-Agent': 'MCP-DevOps/1.0.0',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: message,
          content: encodedContent,
          sha: sha,
        }),
      }
    )
  })

  it('lanza error cuando repositoryName no es string', async () => {
    // Act & Assert
    const client = new GithubClient()
    await client.initialize()
    await expect(
      client.updateFile('', 'path', 'content', 'sha', 'message')
    ).rejects.toThrow('Repository name is required and must be a text string')
    await expect(
      client.updateFile(null as any, 'path', 'content', 'sha', 'message')
    ).rejects.toThrow('Repository name is required and must be a text string')
  })

  it('lanza error cuando path no es string', async () => {
    // Act & Assert
    const client = new GithubClient()
    await client.initialize()
    await expect(
      client.updateFile('test-repo', '', 'content', 'sha', 'message')
    ).rejects.toThrow('Path is required and must be a text string')
    await expect(
      client.updateFile('test-repo', null as any, 'content', 'sha', 'message')
    ).rejects.toThrow('Path is required and must be a text string')
  })

  it('lanza error cuando content no es string o está vacío', async () => {
    // Act & Assert
    const client = new GithubClient()
    await client.initialize()
    await expect(
      client.updateFile('test-repo', 'path', '', 'sha', 'message')
    ).rejects.toThrow('Content is required and must be a text string')
    await expect(
      client.updateFile('test-repo', 'path', null as any, 'sha', 'message')
    ).rejects.toThrow('Content is required and must be a text string')
    await expect(
      client.updateFile('test-repo', 'path', undefined as any, 'sha', 'message')
    ).rejects.toThrow('Content is required and must be a text string')
  })

  it('lanza error cuando la respuesta HTTP no es exitosa', async () => {
    // Arrange
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      text: async () => 'SHA mismatch',
    } as any)

    // Act & Assert
    const client = new GithubClient()
    await client.initialize()
    await expect(
      client.updateFile(
        'test-repo',
        'src/index.js',
        'content',
        'wrong-sha',
        'message'
      )
    ).rejects.toThrow('Github API Error: 409 - Conflict. SHA mismatch')
  })

  it('lanza error cuando fetch falla', async () => {
    // Arrange
    mockedFetch.mockRejectedValue(new Error('Network error'))

    // Act & Assert
    const client = new GithubClient()
    await client.initialize()
    await expect(
      client.updateFile(
        'test-repo',
        'src/index.js',
        'content',
        'sha',
        'message'
      )
    ).rejects.toThrow('Error update content repo: Network error')
  })

  it('maneja contenido con caracteres especiales', async () => {
    // Arrange
    const newContent = 'console.log("Hola mundo 🌍");\nconst ñ = "español";'
    const encodedContent = Buffer.from(newContent).toString('base64')

    const mockResponse = {
      message: 'File updated successfully',
      sha: 'def456',
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
    const result = await client.updateFile(
      'test-repo',
      'src/test.js',
      newContent,
      'abc123',
      'Update with special chars'
    )

    // Assert
    expect(result.content).toBe(newContent)
  })

  it('codifica contenido mínimo correctamente', async () => {
    // Arrange
    const minimalContent = ' '
    const encodedContent = Buffer.from(minimalContent).toString('base64')

    const mockResponse = {
      message: 'File updated successfully',
      sha: 'def456',
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
    const result = await client.updateFile(
      'test-repo',
      'minimal.txt',
      minimalContent,
      'abc123',
      'Create minimal file'
    )

    // Assert
    expect(result.content).toBe(' ')
  })
})
