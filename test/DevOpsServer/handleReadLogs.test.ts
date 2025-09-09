import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer'
import { GithubClient } from '../../src/github/GithubClient'
import { ToolParams } from '../../src/types/types'
import { readMultiplesFile } from '../../src/github/utils/downloadLogs'

// Mock del GithubClient y readMultiplesFile
jest.mock('../../src/github/GithubClient')
jest.mock('../../src/github/utils/downloadLogs')

describe('DevOpsMCPServer - handleReadLogs', () => {
  let server: DevOpsMCPServer
  let mockGithubClient: jest.Mocked<GithubClient>
  let mockReadMultiplesFile: jest.MockedFunction<typeof readMultiplesFile>

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

    // Mock de readMultiplesFile
    mockReadMultiplesFile = readMultiplesFile as jest.MockedFunction<
      typeof readMultiplesFile
    >

    server = new DevOpsMCPServer()
  })

  describe('Éxito', () => {
    it('debería retornar el contenido de los logs cuando la lectura es exitosa', async () => {
      // Arrange
      const mockLogContent = {
        'log1.txt': 'Error: Failed to build\nStack trace: ...',
        'log2.txt': 'Warning: Deprecated function used\nInfo: Build completed',
        'error.log': 'FATAL ERROR: Out of memory\nProcess terminated',
      }
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/path/to/logs',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(mockLogContent)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(mockReadMultiplesFile).toHaveBeenCalledWith('/path/to/logs')
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Erro al retornar los archivos leidos ${JSON.stringify(mockLogContent, null, 2)}`,
          },
        ],
      })
    })

    it('debería manejar logs con contenido vacío', async () => {
      // Arrange
      const mockLogContent = {
        'empty.log': '',
        'whitespace.log': '   \n\t  \n  ',
      }
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/path/to/logs',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(mockLogContent)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(result.content[0].text).toContain('empty.log')
      expect(result.content[0].text).toContain('whitespace.log')
    })

    it('debería manejar logs con caracteres especiales', async () => {
      // Arrange
      const mockLogContent = {
        'special-chars.log':
          "Error: \"Failed to parse JSON: {'key': 'value'}\"\nPath: C:\\Users\\Test\\file.txt",
        'unicode.log': 'Error: ',
      }
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/path/to/logs',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(mockLogContent)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(result.content[0].text).toContain('Failed to parse JSON')
    })

    it('debería manejar logs muy largos', async () => {
      // Arrange
      const longLogContent = 'A'.repeat(10000)
      const mockLogContent = {
        'large.log': longLogContent,
      }
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/path/to/logs',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(mockLogContent)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(result.content[0].text).toContain(longLogContent)
    })
  })

  describe('Errores', () => {
    it('debería manejar cuando readMultiplesFile retorna null', async () => {
      // Arrange
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/path/to/logs',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(null as any)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Contedio del texto vacio',
          },
        ],
      })
    })

    it('debería manejar cuando readMultiplesFile retorna undefined', async () => {
      // Arrange
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/path/to/logs',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(undefined as any)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Contedio del texto vacio',
          },
        ],
      })
    })

    it('debería manejar errores al leer archivos', async () => {
      // Arrange
      const errorMessage = 'Failed to read log files'
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/path/to/logs',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleReadLogs(params)

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

    it('debería manejar errores de directorio no encontrado', async () => {
      // Arrange
      const errorMessage = 'Directory not found'
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/non/existent/path',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleReadLogs(params)

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

    it('debería manejar errores de permisos de archivo', async () => {
      // Arrange
      const errorMessage = 'Permission denied'
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/restricted/path',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleReadLogs(params)

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
        repositoryName: '',
        id: 0,
        dirName: '/path/to/logs',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockRejectedValue('Unknown error')

      // Act
      const result = await server.handleReadLogs(params)

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
    it('debería manejar nombres de directorio con caracteres especiales', async () => {
      // Arrange
      const mockLogContent = {
        'test.log': 'Test log content',
      }
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/path/with spaces/and-special@chars#',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(mockLogContent)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(mockReadMultiplesFile).toHaveBeenCalledWith(
        '/path/with spaces/and-special@chars#'
      )
      expect(result.content[0].text).toContain('Test log content')
    })

    it('debería manejar nombres de directorio muy largos', async () => {
      // Arrange
      const longDirName = '/path/' + 'a'.repeat(1000) + '/logs'
      const mockLogContent = {
        'test.log': 'Test log content',
      }
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: longDirName,
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(mockLogContent)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(mockReadMultiplesFile).toHaveBeenCalledWith(longDirName)
      expect(result.content[0].text).toContain('Test log content')
    })

    it('debería manejar directorio vacío', async () => {
      // Arrange
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(null as any)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(mockReadMultiplesFile).toHaveBeenCalledWith('')
      expect(result.content[0].text).toBe('Contedio del texto vacio')
    })

    it('debería manejar parámetros con valores undefined', async () => {
      // Arrange
      const params = {
        repositoryName: undefined,
        id: undefined,
        dirName: undefined,
        path: undefined,
        nameBranch: undefined,
      } as any
      mockReadMultiplesFile.mockResolvedValue(null as any)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(mockReadMultiplesFile).toHaveBeenCalledWith(undefined)
      expect(result.content[0].text).toBe('Contedio del texto vacio')
    })

    it('debería manejar múltiples archivos de log con diferentes formatos', async () => {
      // Arrange
      const mockLogContent = {
        'error.log': 'ERROR: Something went wrong',
        'warning.log': 'WARNING: This is a warning',
        'info.log': 'INFO: Process completed successfully',
        'debug.log': 'DEBUG: Variable value = 42',
        'trace.log': 'TRACE: Function entry point',
        'access.log':
          '127.0.0.1 - - [01/Jan/2024:00:00:00 +0000] "GET / HTTP/1.1" 200 1234',
      }
      const params: ToolParams = {
        repositoryName: '',
        id: 0,
        dirName: '/path/to/logs',
        path: '',
        nameBranch: '',
      }
      mockReadMultiplesFile.mockResolvedValue(mockLogContent)

      // Act
      const result = await server.handleReadLogs(params)

      // Assert
      expect(result.content[0].text).toContain('ERROR: Something went wrong')
      expect(result.content[0].text).toContain('WARNING: This is a warning')
      expect(result.content[0].text).toContain(
        'INFO: Process completed successfully'
      )
      expect(result.content[0].text).toContain('DEBUG: Variable value = 42')
      expect(result.content[0].text).toContain('TRACE: Function entry point')
      expect(result.content[0].text).toContain(
        '127.0.0.1 - - [01/Jan/2024:00:00:00 +0000]'
      )
    })
  })
})
