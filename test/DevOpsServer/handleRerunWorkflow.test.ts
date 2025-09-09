import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer'
import { GithubClient } from '../../src/github/GithubClient'
import { ToolParams, RerunWorkflow } from '../../src/types/types'

// Mock del GithubClient
jest.mock('../../src/github/GithubClient')

describe('DevOpsMCPServer - handleRerunWorkflow', () => {
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
    it('debería re-ejecutar un workflow cuando la operación es exitosa', async () => {
      // Arrange
      const mockRerunResult: RerunWorkflow = {
        message: 'Workflow rerun successfully',
        status: 'queued',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

      // Act
      const result = await server.handleRerunWorkflow(params)

      // Assert
      expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1)
      expect(mockGithubClient.rerunWorkflow).toHaveBeenCalledWith(
        'test-repo',
        123
      )
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Rerun workflow: ${JSON.stringify(mockRerunResult, null, 2)}`,
          },
        ],
      })
    })

    it('debería manejar diferentes estados de re-ejecución', async () => {
      // Arrange
      const statuses = [
        'queued',
        'in_progress',
        'completed',
        'cancelled',
        'failed',
      ]
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }

      for (const status of statuses) {
        const mockRerunResult: RerunWorkflow = {
          message: `Workflow rerun with status: ${status}`,
          status: status,
        }
        mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

        // Act
        const result = await server.handleRerunWorkflow(params)

        // Assert
        expect(result.content[0].text).toContain(
          `Workflow rerun with status: ${status}`
        )
        expect(result.content[0].text).toContain(`"status": "${status}"`)
      }
    })

    it('debería manejar IDs de workflow muy grandes', async () => {
      // Arrange
      const largeId = Number.MAX_SAFE_INTEGER
      const mockRerunResult: RerunWorkflow = {
        message: 'Large ID workflow rerun',
        status: 'queued',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: largeId,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

      // Act
      const result = await server.handleRerunWorkflow(params)

      // Assert
      expect(mockGithubClient.rerunWorkflow).toHaveBeenCalledWith(
        'test-repo',
        largeId
      )
      expect(result.content[0].text).toContain('Large ID workflow rerun')
    })

    it('debería manejar múltiples re-ejecuciones del mismo workflow', async () => {
      // Arrange
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }

      for (let i = 1; i <= 3; i++) {
        const mockRerunResult: RerunWorkflow = {
          message: `Workflow rerun attempt ${i}`,
          status: 'queued',
        }
        mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

        // Act
        const result = await server.handleRerunWorkflow(params)

        // Assert
        expect(result.content[0].text).toContain(`Workflow rerun attempt ${i}`)
      }
    })
  })

  describe('Errores', () => {
    it('debería manejar errores de inicialización del cliente de GitHub', async () => {
      // Arrange
      const errorMessage = 'Failed to initialize GitHub client'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.initialize.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleRerunWorkflow(params)

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

    it('debería manejar errores al re-ejecutar workflows', async () => {
      // Arrange
      const errorMessage = 'Failed to rerun workflow'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleRerunWorkflow(params)

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

    it('debería manejar errores de workflow no encontrado', async () => {
      // Arrange
      const errorMessage = 'Workflow not found'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 999999,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleRerunWorkflow(params)

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
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleRerunWorkflow(params)

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
      const errorMessage = 'Insufficient permissions to rerun workflow'
      const params: ToolParams = {
        repositoryName: 'private-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleRerunWorkflow(params)

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

    it('debería manejar errores de workflow ya en ejecución', async () => {
      // Arrange
      const errorMessage = 'Workflow is already running'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleRerunWorkflow(params)

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

    it('debería manejar errores de límite de re-ejecuciones', async () => {
      // Arrange
      const errorMessage = 'Maximum rerun attempts exceeded'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleRerunWorkflow(params)

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
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockRejectedValue('Unknown error')

      // Act
      const result = await server.handleRerunWorkflow(params)

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
      const mockRerunResult: RerunWorkflow = {
        message: 'Workflow rerun in special repo',
        status: 'queued',
      }
      const params: ToolParams = {
        repositoryName: 'repo-with-special-chars-@#$%',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

      // Act
      const result = await server.handleRerunWorkflow(params)

      // Assert
      expect(mockGithubClient.rerunWorkflow).toHaveBeenCalledWith(
        'repo-with-special-chars-@#$%',
        123
      )
      expect(result.content[0].text).toContain('Workflow rerun in special repo')
    })

    it('debería manejar IDs de workflow negativos', async () => {
      // Arrange
      const mockRerunResult: RerunWorkflow = {
        message: 'Negative ID workflow handled',
        status: 'failed',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: -1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

      // Act
      const result = await server.handleRerunWorkflow(params)

      // Assert
      expect(mockGithubClient.rerunWorkflow).toHaveBeenCalledWith(
        'test-repo',
        -1
      )
      expect(result.content[0].text).toContain('Negative ID workflow handled')
    })

    it('debería manejar IDs de workflow cero', async () => {
      // Arrange
      const mockRerunResult: RerunWorkflow = {
        message: 'Zero ID workflow handled',
        status: 'failed',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 0,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

      // Act
      const result = await server.handleRerunWorkflow(params)

      // Assert
      expect(mockGithubClient.rerunWorkflow).toHaveBeenCalledWith(
        'test-repo',
        0
      )
      expect(result.content[0].text).toContain('Zero ID workflow handled')
    })

    it('debería manejar parámetros con valores undefined', async () => {
      // Arrange
      const mockRerunResult: RerunWorkflow = {
        message: 'Undefined params handled',
        status: 'queued',
      }
      const params = {
        repositoryName: 'test-repo',
        id: undefined,
        dirName: undefined,
        path: undefined,
        nameBranch: undefined,
      } as any
      mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

      // Act
      const result = await server.handleRerunWorkflow(params)

      // Assert
      expect(mockGithubClient.rerunWorkflow).toHaveBeenCalledWith(
        'test-repo',
        undefined
      )
      expect(result.content[0].text).toContain('Undefined params handled')
    })

    it('debería manejar mensajes de respuesta muy largos', async () => {
      // Arrange
      const longMessage = 'A'.repeat(1000)
      const mockRerunResult: RerunWorkflow = {
        message: longMessage,
        status: 'completed',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

      // Act
      const result = await server.handleRerunWorkflow(params)

      // Assert
      expect(result.content[0].text).toContain(longMessage)
    })

    it('debería manejar estados de workflow con caracteres especiales', async () => {
      // Arrange
      const specialStatus = 'in_progress_with_special_chars@#$%'
      const mockRerunResult: RerunWorkflow = {
        message: 'Special status workflow rerun',
        status: specialStatus,
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

      // Act
      const result = await server.handleRerunWorkflow(params)

      // Assert
      expect(result.content[0].text).toContain(specialStatus)
    })

    it('debería manejar múltiples workflows en diferentes repositorios', async () => {
      // Arrange
      const repositories = ['repo1', 'repo2', 'repo3']
      const workflowIds = [100, 200, 300]

      for (let i = 0; i < repositories.length; i++) {
        const mockRerunResult: RerunWorkflow = {
          message: `Workflow ${workflowIds[i]} rerun in ${repositories[i]}`,
          status: 'queued',
        }
        const params: ToolParams = {
          repositoryName: repositories[i],
          id: workflowIds[i],
          dirName: '',
          path: '',
          nameBranch: '',
        }
        mockGithubClient.rerunWorkflow.mockResolvedValue(mockRerunResult)

        // Act
        const result = await server.handleRerunWorkflow(params)

        // Assert
        expect(result.content[0].text).toContain(
          `Workflow ${workflowIds[i]} rerun in ${repositories[i]}`
        )
      }
    })
  })
})
