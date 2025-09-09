import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer'
import { GithubClient } from '../../src/github/GithubClient'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

// Mock del GithubClient y McpServer
jest.mock('../../src/github/GithubClient')
jest.mock('@modelcontextprotocol/sdk/server/mcp')

describe('DevOpsMCPServer - Constructor y registerTools', () => {
  let mockGithubClient: jest.Mocked<GithubClient>
  let mockMcpServer: jest.Mocked<McpServer>

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
  })

  describe('Constructor', () => {
    it('debería crear una instancia de DevOpsMCPServer correctamente', () => {
      // Act
      const server = new DevOpsMCPServer()

      // Assert
      expect(server).toBeInstanceOf(DevOpsMCPServer)
      expect(McpServer).toHaveBeenCalledWith({
        name: 'MCP-DevOps',
        version: '1.0.0',
      })
    })

    it('debería inicializar el githubClient como null', () => {
      // Act
      const server = new DevOpsMCPServer()

      // Assert
      expect((server as any).githubClient).toBeNull()
    })

    it('debería crear una instancia de McpServer con la configuración correcta', () => {
      // Act
      new DevOpsMCPServer()

      // Assert
      expect(McpServer).toHaveBeenCalledWith({
        name: 'MCP-DevOps',
        version: '1.0.0',
      })
    })

    it('debería llamar a registerTools después de crear el servidor', () => {
      // Arrange
      const server = new DevOpsMCPServer()

      // Act
      const registerToolsSpy = jest.spyOn(server as any, 'registerTools')

      server.registerTools()
      // Assert
      expect(registerToolsSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('registerTools', () => {
    let server: DevOpsMCPServer

    beforeEach(() => {
      server = new DevOpsMCPServer()
    })

    it('debería registrar todas las herramientas correctamente', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledTimes(10)
    })

    it('debería registrar la herramienta show_repositories', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'show_repositories',
        {
          title: 'Show workflows',
          description: 'It will show the workflows of a given repository',
          inputSchema: {},
        },
        expect.any(Function)
      )
    })

    it('debería registrar la herramienta show_workflows', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'show_workflows',
        {
          title: 'Show workflows',
          description: 'It will show the workflows of a given repository',
          inputSchema: { repositoryName: expect.any(Object) },
        },
        expect.any(Function)
      )
    })

    it('debería registrar la herramienta download_logs', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'download_logs',
        {
          title: 'Download workflows',
          description: 'Download the failed workflow logs.',
          inputSchema: {
            repositoryName: expect.any(Object),
            id: expect.any(Object),
          },
        },
        expect.any(Function)
      )
    })

    it('debería registrar la herramienta read_logs', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'read_logs',
        {
          title: 'Read logs',
          description: 'Leera los logs del workflow fallido',
          inputSchema: { dirName: expect.any(Object) },
        },
        expect.any(Function)
      )
    })

    it('debería registrar la herramienta show_content_files', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'show_content_files',
        {
          title: 'Show content files',
          description: 'It will show the content of a given repository files',
          inputSchema: {
            repositoryName: expect.any(Object),
            path: expect.any(Object),
          },
        },
        expect.any(Function)
      )
    })

    it('debería registrar la herramienta show_content_repo', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'show_content_repo',
        {
          title: 'Show content repository',
          description: 'It will show the content of a given repository',
          inputSchema: {
            repositoryName: expect.any(Object),
            nameBranch: expect.any(Object),
          },
        },
        expect.any(Function)
      )
    })

    it('debería registrar la herramienta Update file', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'Update file',
        {
          title: 'Update file',
          description: 'It will update the content of a given file',
          inputSchema: {
            repositoryName: expect.any(Object),
            path: expect.any(Object),
            content: expect.any(Object),
            sha: expect.any(Object),
            message: expect.any(Object),
          },
        },
        expect.any(Function)
      )
    })

    it('debería registrar la herramienta create_branch', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'create_branch',
        {
          title: 'Create branch',
          description: 'It will create a new branch',
          inputSchema: {
            repositoryName: expect.any(Object),
            newBranchName: expect.any(Object),
            sha: expect.any(Object),
          },
        },
        expect.any(Function)
      )
    })

    it('debería registrar la herramienta rerun_workflow', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'rerun_workflow',
        {
          title: 'Rerun Workflow',
          description: 'It will rerun a workflow',
          inputSchema: {
            repositoryName: expect.any(Object),
            id: expect.any(Object),
          },
        },
        expect.any(Function)
      )
    })

    it('debería registrar la herramienta status_workflow', () => {
      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledWith(
        'status_workflow',
        {
          title: 'Status Workflow',
          description: 'It will get the status of a workflow',
          inputSchema: {
            repositoryName: expect.any(Object),
            id: expect.any(Object),
          },
        },
        expect.any(Function)
      )
    })

    it('debería registrar las herramientas en el orden correcto', () => {
      // Arrange
      const calls = mockMcpServer.registerTool.mock.calls
      const toolNames = calls.map((call) => call[0])

      // Assert
      expect(toolNames).toEqual([
        'show_repositories',
        'show_workflows',
        'download_logs',
        'read_logs',
        'show_content_files',
        'show_content_repo',
        'Update file',
        'create_branch',
        'rerun_workflow',
        'status_workflow',
      ])
    })

    it('debería registrar cada herramienta con una función handler', () => {
      // Arrange
      const calls = mockMcpServer.registerTool.mock.calls

      // Assert
      calls.forEach((call) => {
        expect(call[2]).toBeInstanceOf(Function)
      })
    })

    it('debería registrar herramientas con esquemas de entrada válidos', () => {
      // Arrange
      const calls = mockMcpServer.registerTool.mock.calls

      // Assert
      calls.forEach((call) => {
        const schema = call[1].inputSchema
        expect(schema).toBeDefined()
        expect(typeof schema).toBe('object')
      })
    })

    it('debería registrar herramientas con títulos y descripciones válidos', () => {
      // Arrange
      const calls = mockMcpServer.registerTool.mock.calls

      // Assert
      calls.forEach((call) => {
        const config = call[1]
        expect(config.title).toBeDefined()
        expect(typeof config.title).toBe('string')
        expect(config.title?.length).toBeGreaterThan(0)
        expect(config.description).toBeDefined()
        expect(typeof config.description).toBe('string')
        expect(config.description?.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Casos edge', () => {
    it('debería manejar múltiples instancias de DevOpsMCPServer', () => {
      // Act
      const server1 = new DevOpsMCPServer()
      const server2 = new DevOpsMCPServer()

      // Assert
      expect(server1).toBeInstanceOf(DevOpsMCPServer)
      expect(server2).toBeInstanceOf(DevOpsMCPServer)
      expect(server1).not.toBe(server2)
    })

    it('debería crear instancias independientes de GithubClient', () => {
      // Act
      const server1 = new DevOpsMCPServer()
      const server2 = new DevOpsMCPServer()

      // Assert
      expect((server1 as any).githubClient).toBeNull()
      expect((server2 as any).githubClient).toBeNull()
    })

    it('debería crear instancias independientes de McpServer', () => {
      // Act
      new DevOpsMCPServer()
      new DevOpsMCPServer()

      // Assert
      expect(McpServer).toHaveBeenCalledTimes(2)
    })

    it('debería manejar errores en el constructor de McpServer', () => {
      // Arrange
      const error = new Error('McpServer constructor failed')
      ;(McpServer as jest.MockedClass<typeof McpServer>).mockImplementation(
        () => {
          throw error
        }
      )

      // Act & Assert
      expect(() => new DevOpsMCPServer()).toThrow(
        'McpServer constructor failed'
      )
    })

    it('debería manejar errores en registerTools', () => {
      // Arrange
      const error = new Error('registerTool failed')
      mockMcpServer.registerTool.mockImplementation(() => {
        throw error
      })

      // Act & Assert
      expect(() => new DevOpsMCPServer()).toThrow('registerTool failed')
    })

    it('debería mantener la configuración del servidor consistente', () => {
      // Act
      new DevOpsMCPServer()

      // Assert
      expect(McpServer).toHaveBeenCalledWith({
        name: 'MCP-DevOps',
        version: '1.0.0',
      })
    })

    it('debería registrar exactamente 10 herramientas', () => {
      // Act
      new DevOpsMCPServer()

      // Assert
      expect(mockMcpServer.registerTool).toHaveBeenCalledTimes(10)
    })
  })
})
