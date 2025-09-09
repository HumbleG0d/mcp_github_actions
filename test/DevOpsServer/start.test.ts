import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer'
import { GithubClient } from '../../src/github/GithubClient'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

// Mock del GithubClient, McpServer y StdioServerTransport
jest.mock('../../src/github/GithubClient')
jest.mock('@modelcontextprotocol/sdk/server/mcp')
jest.mock('@modelcontextprotocol/sdk/server/stdio')

describe('DevOpsMCPServer - start', () => {
  let server: DevOpsMCPServer
  let mockGithubClient: jest.Mocked<GithubClient>
  let mockMcpServer: jest.Mocked<McpServer>
  let mockStdioServerTransport: jest.Mocked<StdioServerTransport>

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

    // Crear mock del McpServer
    mockMcpServer = {
      registerTool: jest.fn(),
      connect: jest.fn(),
    } as any

    // Mock del constructor de McpServer
    ;(McpServer as jest.MockedClass<typeof McpServer>).mockImplementation(
      () => mockMcpServer
    )

    // Crear mock del StdioServerTransport
    mockStdioServerTransport = {} as any

    // Mock del constructor de StdioServerTransport
    ;(
      StdioServerTransport as jest.MockedClass<typeof StdioServerTransport>
    ).mockImplementation(() => mockStdioServerTransport)

    server = new DevOpsMCPServer()
  })

  describe('Éxito', () => {
    it('debería iniciar el servidor correctamente', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)

      // Act
      await server.start()

      // Assert
      expect(StdioServerTransport).toHaveBeenCalledTimes(1)
      expect(mockMcpServer.connect).toHaveBeenCalledWith(
        mockStdioServerTransport
      )
      expect(mockMcpServer.connect).toHaveBeenCalledTimes(1)
    })

    it('debería crear una nueva instancia de StdioServerTransport', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)

      // Act
      await server.start()

      // Assert
      expect(StdioServerTransport).toHaveBeenCalledTimes(1)
    })

    it('debería conectar el servidor con el transporte', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)

      // Act
      await server.start()

      // Assert
      expect(mockMcpServer.connect).toHaveBeenCalledWith(
        mockStdioServerTransport
      )
    })

    it('debería completar la operación sin errores', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)

      // Act & Assert
      await expect(server.start()).resolves.toBeUndefined()
    })

    it('debería manejar múltiples llamadas a start', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)

      // Act
      await server.start()
      await server.start()

      // Assert
      expect(mockMcpServer.connect).toHaveBeenCalledTimes(2)
    })
  })

  describe('Errores', () => {
    it('debería manejar errores de conexión del servidor', async () => {
      // Arrange
      const errorMessage = 'Connection failed'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de transporte', async () => {
      // Arrange
      const errorMessage = 'Transport initialization failed'
      ;(
        StdioServerTransport as jest.MockedClass<typeof StdioServerTransport>
      ).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de red', async () => {
      // Arrange
      const errorMessage = 'Network error'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de permisos', async () => {
      // Arrange
      const errorMessage = 'Permission denied'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de puerto ocupado', async () => {
      // Arrange
      const errorMessage = 'Port already in use'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de timeout', async () => {
      // Arrange
      const errorMessage = 'Connection timeout'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores no identificados', async () => {
      // Arrange
      mockMcpServer.connect.mockRejectedValue('Unknown error')

      // Act & Assert
      await expect(server.start()).rejects.toThrow('Unknown error')
    })

    it('debería manejar errores de servidor no inicializado', async () => {
      // Arrange
      const errorMessage = 'Server not initialized'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })
  })

  describe('Casos edge', () => {
    it('debería manejar llamadas concurrentes a start', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)

      // Act
      const promises = [server.start(), server.start(), server.start()]
      await Promise.all(promises)

      // Assert
      expect(mockMcpServer.connect).toHaveBeenCalledTimes(3)
    })

    it('debería manejar errores en llamadas concurrentes', async () => {
      // Arrange
      const errorMessage = 'Concurrent connection error'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act
      const promises = [server.start(), server.start()]

      // Assert
      await expect(Promise.all(promises)).rejects.toThrow(errorMessage)
    })

    it('debería manejar múltiples instancias iniciando simultáneamente', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)
      const server2 = new DevOpsMCPServer()

      // Act
      const promises = [server.start(), server2.start()]
      await Promise.all(promises)

      // Assert
      expect(mockMcpServer.connect).toHaveBeenCalledTimes(2)
    })

    it('debería manejar errores de memoria insuficiente', async () => {
      // Arrange
      const errorMessage = 'Out of memory'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de sistema de archivos', async () => {
      // Arrange
      const errorMessage = 'File system error'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de configuración', async () => {
      // Arrange
      const errorMessage = 'Configuration error'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de dependencias faltantes', async () => {
      // Arrange
      const errorMessage = 'Missing dependencies'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de versión incompatible', async () => {
      // Arrange
      const errorMessage = 'Incompatible version'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de autenticación', async () => {
      // Arrange
      const errorMessage = 'Authentication failed'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })

    it('debería manejar errores de límite de recursos', async () => {
      // Arrange
      const errorMessage = 'Resource limit exceeded'
      mockMcpServer.connect.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(server.start()).rejects.toThrow(errorMessage)
    })
  })

  describe('Integración', () => {
    it('debería mantener el estado del servidor después de start exitoso', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)

      // Act
      await server.start()

      // Assert
      expect((server as any).server).toBe(mockMcpServer)
      expect((server as any).githubClient).toBeNull()
    })

    it('debería permitir operaciones después de start exitoso', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)
      mockGithubClient.getAllRepos.mockResolvedValue([])

      // Act
      await server.start()
      const result = await server.handleShowRepos()

      // Assert
      expect(result).toBeDefined()
      expect(result.content).toBeDefined()
    })

    it('debería manejar el flujo completo de inicialización', async () => {
      // Arrange
      mockMcpServer.connect.mockResolvedValue(undefined)
      mockGithubClient.getAllRepos.mockResolvedValue([
        { id: 1, name: 'test-repo', private: false },
      ])

      // Act
      await server.start()
      const result = await server.handleShowRepos()

      // Assert
      expect(result.content[0].text).toContain('test-repo')
    })
  })
})
