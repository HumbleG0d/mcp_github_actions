import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer'
import { GithubClient } from '../../src/github/GithubClient'
import { ToolParams, ContentGitubRepo } from '../../src/types/types'

// Mock del GithubClient
jest.mock('../../src/github/GithubClient')

describe('DevOpsMCPServer - handleShowContentFiles', () => {
  let server: DevOpsMCPServer
  let mockGithubClient: jest.Mocked<GithubClient>

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks()

    // Crear mock del GithubClient
    mockGithubClient = {
      initialize: jest.fn(),
      getAllRepos: jest.fn(),
      getDataWorkflows: jest.fn(),
      getFileLogs: jest.fn(),
      getContentTree: jest.fn(),
      getContentFiles: jest.fn(),
      updateFile: jest.fn(),
      createBranch: jest.fn(),
      rerunWorkflow: jest.fn(),
      getStatusWorkflow: jest.fn(),
    } as any

    // Mock del constructor de GithubClient
    ;(GithubClient as jest.MockedClass<typeof GithubClient>).mockImplementation(
      () => mockGithubClient
    )

    server = new DevOpsMCPServer()
  })

  describe('Éxito', () => {
    it('debería retornar el contenido de los archivos cuando la operación es exitosa', async () => {
      // Arrange
      const mockFileContent: ContentGitubRepo = {
        name: 'package.json',
        path: 'package.json',
        sha: 'package-sha-123',
        type: 'file',
        content: '{"name": "test-project", "version": "1.0.0"}',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'package.json',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1)
      expect(mockGithubClient.getContentFiles).toHaveBeenCalledWith(
        'test-repo',
        'package.json'
      )
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `View content files: ${JSON.stringify(mockFileContent, null, 2)}`,
          },
        ],
      })
    })

    it('debería manejar archivos con contenido vacío', async () => {
      // Arrange
      const mockFileContent: ContentGitubRepo = {
        name: 'empty.txt',
        path: 'empty.txt',
        sha: 'empty-sha',
        type: 'file',
        content: '',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'empty.txt',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result.content[0].text).toContain('empty.txt')
      expect(result.content[0].text).toContain('"content": ""')
    })

    it('debería manejar diferentes tipos de archivos', async () => {
      // Arrange
      const fileTypes = [
        { ext: '.js', content: 'console.log("Hello World");' },
        { ext: '.ts', content: 'const message: string = "Hello TypeScript";' },
        { ext: '.json', content: '{"key": "value"}' },
        { ext: '.md', content: '# Markdown File\n\nThis is a markdown file.' },
        {
          ext: '.yml',
          content:
            'name: CI\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest',
        },
        { ext: '.txt', content: 'Plain text content' },
      ]

      for (const fileType of fileTypes) {
        const mockFileContent: ContentGitubRepo = {
          name: `test${fileType.ext}`,
          path: `test${fileType.ext}`,
          sha: `sha-${fileType.ext}`,
          type: 'file',
          content: fileType.content,
        }
        const params: ToolParams = {
          repositoryName: 'test-repo',
          path: `test${fileType.ext}`,
          id: 0,
          dirName: '',
          nameBranch: '',
        }
        mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

        // Act
        const result = await server.handleShowContentFiles(params)

        // Assert
        expect(result.content[0].text).toContain(`test${fileType.ext}`)
        // El contenido se escapa en JSON.stringify, así que buscamos el contenido escapado
        const escapedContent = JSON.stringify(fileType.content).slice(1, -1) // Remover las comillas del JSON
        expect(result.content[0].text).toContain(escapedContent)
      }
    })

    it('debería manejar archivos con contenido muy largo', async () => {
      // Arrange
      const longContent = 'A'.repeat(10000)
      const mockFileContent: ContentGitubRepo = {
        name: 'large-file.txt',
        path: 'large-file.txt',
        sha: 'large-sha',
        type: 'file',
        content: longContent,
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'large-file.txt',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result.content[0].text).toContain(longContent)
    })

    it('debería manejar archivos con caracteres especiales en el contenido', async () => {
      // Arrange
      const specialContent = 'Special chars: @#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\'
      const mockFileContent: ContentGitubRepo = {
        name: 'special.txt',
        path: 'special.txt',
        sha: 'special-sha',
        type: 'file',
        content: specialContent,
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'special.txt',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      // El contenido se escapa en JSON.stringify, así que buscamos el contenido escapado
      const escapedContent = JSON.stringify(specialContent).slice(1, -1) // Remover las comillas del JSON
      expect(result.content[0].text).toContain(escapedContent)
    })
  })

  describe('Errores', () => {
    it('debería manejar errores de inicialización del cliente de GitHub', async () => {
      // Arrange
      const errorMessage = 'Failed to initialize GitHub client'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'package.json',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.initialize.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      })
    })

    it('debería manejar errores al obtener el contenido de archivos', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch file content'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'package.json',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      })
    })

    it('debería manejar errores de archivo no encontrado', async () => {
      // Arrange
      const errorMessage = 'File not found'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'non-existent-file.txt',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      })
    })

    it('debería manejar errores de repositorio no encontrado', async () => {
      // Arrange
      const errorMessage = 'Repository not found'
      const params: ToolParams = {
        repositoryName: 'non-existent-repo',
        path: 'package.json',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      })
    })

    it('debería manejar errores de permisos insuficientes', async () => {
      // Arrange
      const errorMessage = 'Insufficient permissions'
      const params: ToolParams = {
        repositoryName: 'private-repo',
        path: 'secret-file.txt',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      })
    })

    it('debería manejar errores de archivo binario', async () => {
      // Arrange
      const errorMessage = 'Cannot display binary file content'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'image.png',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      })
    })

    it('debería manejar errores no identificados', async () => {
      // Arrange
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'package.json',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockRejectedValue('Unknown error')

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Unknown error',
          },
        ],
      })
    })
  })

  describe('Casos edge', () => {
    it('debería manejar nombres de repositorio con caracteres especiales', async () => {
      // Arrange
      const mockFileContent: ContentGitubRepo = {
        name: 'test.txt',
        path: 'test.txt',
        sha: 'test-sha',
        type: 'file',
        content: 'Test content',
      }
      const params: ToolParams = {
        repositoryName: 'repo-with-special-chars-@#$%',
        path: 'test.txt',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(mockGithubClient.getContentFiles).toHaveBeenCalledWith(
        'repo-with-special-chars-@#$%',
        'test.txt'
      )
      expect(result.content[0].text).toContain('Test content')
    })

    it('debería manejar rutas de archivo con caracteres especiales', async () => {
      // Arrange
      const mockFileContent: ContentGitubRepo = {
        name: 'special-file.txt',
        path: 'folder with spaces/special@file#.txt',
        sha: 'special-sha',
        type: 'file',
        content: 'Special file content',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'folder with spaces/special@file#.txt',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(mockGithubClient.getContentFiles).toHaveBeenCalledWith(
        'test-repo',
        'folder with spaces/special@file#.txt'
      )
      expect(result.content[0].text).toContain('Special file content')
    })

    it('debería manejar rutas de archivo muy largas', async () => {
      // Arrange
      const longPath = 'a'.repeat(1000) + '/file.txt'
      const mockFileContent: ContentGitubRepo = {
        name: 'file.txt',
        path: longPath,
        sha: 'long-path-sha',
        type: 'file',
        content: 'Long path file content',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: longPath,
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(mockGithubClient.getContentFiles).toHaveBeenCalledWith(
        'test-repo',
        longPath
      )
      expect(result.content[0].text).toContain('Long path file content')
    })

    it('debería manejar archivos con nombres muy largos', async () => {
      // Arrange
      const longFileName = 'a'.repeat(1000) + '.txt'
      const mockFileContent: ContentGitubRepo = {
        name: longFileName,
        path: longFileName,
        sha: 'long-name-sha',
        type: 'file',
        content: 'Long name file content',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: longFileName,
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result.content[0].text).toContain(longFileName)
    })

    it('debería manejar SHA muy largos', async () => {
      // Arrange
      const longSha = 'a'.repeat(100)
      const mockFileContent: ContentGitubRepo = {
        name: 'test.txt',
        path: 'test.txt',
        sha: longSha,
        type: 'file',
        content: 'Test content',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'test.txt',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result.content[0].text).toContain(longSha)
    })

    it('debería manejar parámetros con valores undefined', async () => {
      // Arrange
      const mockFileContent: ContentGitubRepo = {
        name: 'test.txt',
        path: 'test.txt',
        sha: 'test-sha',
        type: 'file',
        content: 'Test content',
      }
      const params = {
        repositoryName: 'test-repo',
        path: undefined,
        id: undefined,
        dirName: undefined,
        nameBranch: undefined,
      } as any
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(mockGithubClient.getContentFiles).toHaveBeenCalledWith(
        'test-repo',
        undefined
      )
      expect(result.content[0].text).toContain('Test content')
    })

    it('debería manejar archivos con contenido Unicode', async () => {
      // Arrange
      const unicodeContent =
        'Unicode content: 中文, 日本語, 한국어, العربية, русский, español'
      const mockFileContent: ContentGitubRepo = {
        name: 'unicode.txt',
        path: 'unicode.txt',
        sha: 'unicode-sha',
        type: 'file',
        content: unicodeContent,
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        path: 'unicode.txt',
        id: 0,
        dirName: '',
        nameBranch: '',
      }
      mockGithubClient.getContentFiles.mockResolvedValue(mockFileContent)

      // Act
      const result = await server.handleShowContentFiles(params)

      // Assert
      expect(result.content[0].text).toContain('中文')
      expect(result.content[0].text).toContain('日本語')
      expect(result.content[0].text).toContain('한국어')
      expect(result.content[0].text).toContain('العربية')
      expect(result.content[0].text).toContain('русский')
      expect(result.content[0].text).toContain('español')
    })
  })
})
