import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer'
import { GithubClient } from '../../src/github/GithubClient'
import { ToolParams, StatusWorkflow } from '../../src/types/types'

// Mock del GithubClient
jest.mock('../../src/github/GithubClient')

describe('DevOpsMCPServer - handleGetStatusWorkflow', () => {
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
    it('debería obtener el estado de un workflow cuando la operación es exitosa', async () => {
      // Arrange
      const mockStatusResult: StatusWorkflow = {
        status: 'completed',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1)
      expect(mockGithubClient.getStatusWorkflow).toHaveBeenCalledWith(
        'test-repo',
        123
      )
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Status workflow: ${JSON.stringify(mockStatusResult, null, 2)}`,
          },
        ],
      })
    })

    it('debería manejar diferentes estados de workflow', async () => {
      // Arrange
      const statuses = [
        'queued',
        'in_progress',
        'completed',
        'cancelled',
        'failed',
        'skipped',
        'timed_out',
        'action_required',
      ]
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }

      for (const status of statuses) {
        const mockStatusResult: StatusWorkflow = {
          status: status,
        }
        mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

        // Act
        const result = await server.handleGetStatusWorkflow(params)

        // Assert
        expect(result.content[0].text).toContain(`"status": "${status}"`)
      }
    })

    it('debería manejar workflows con estado pendiente', async () => {
      // Arrange
      const mockStatusResult: StatusWorkflow = {
        status: 'pending',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(result.content[0].text).toContain('"status": "pending"')
    })

    it('debería manejar workflows con estado en ejecución', async () => {
      // Arrange
      const mockStatusResult: StatusWorkflow = {
        status: 'running',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(result.content[0].text).toContain('"status": "running"')
    })

    it('debería manejar IDs de workflow muy grandes', async () => {
      // Arrange
      const largeId = Number.MAX_SAFE_INTEGER
      const mockStatusResult: StatusWorkflow = {
        status: 'completed',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: largeId,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(mockGithubClient.getStatusWorkflow).toHaveBeenCalledWith(
        'test-repo',
        largeId
      )
      expect(result.content[0].text).toContain('"status": "completed"')
    })

    it('debería manejar múltiples consultas de estado del mismo workflow', async () => {
      // Arrange
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }

      const statuses = ['queued', 'in_progress', 'completed']
      for (let i = 0; i < statuses.length; i++) {
        const mockStatusResult: StatusWorkflow = {
          status: statuses[i],
        }
        mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

        // Act
        const result = await server.handleGetStatusWorkflow(params)

        // Assert
        expect(result.content[0].text).toContain(`"status": "${statuses[i]}"`)
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
      const result = await server.handleGetStatusWorkflow(params)

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

    it('debería manejar errores al obtener el estado del workflow', async () => {
      // Arrange
      const errorMessage = 'Failed to get workflow status'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleGetStatusWorkflow(params)

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
      mockGithubClient.getStatusWorkflow.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleGetStatusWorkflow(params)

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
      mockGithubClient.getStatusWorkflow.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleGetStatusWorkflow(params)

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
      const errorMessage = 'Insufficient permissions to get workflow status'
      const params: ToolParams = {
        repositoryName: 'private-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleGetStatusWorkflow(params)

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

    it('debería manejar errores de workflow eliminado', async () => {
      // Arrange
      const errorMessage = 'Workflow has been deleted'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleGetStatusWorkflow(params)

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

    it('debería manejar errores de timeout', async () => {
      // Arrange
      const errorMessage = 'Request timeout'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleGetStatusWorkflow(params)

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
      mockGithubClient.getStatusWorkflow.mockRejectedValue('Unknown error')

      // Act
      const result = await server.handleGetStatusWorkflow(params)

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
      const mockStatusResult: StatusWorkflow = {
        status: 'completed',
      }
      const params: ToolParams = {
        repositoryName: 'repo-with-special-chars-@#$%',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(mockGithubClient.getStatusWorkflow).toHaveBeenCalledWith(
        'repo-with-special-chars-@#$%',
        123
      )
      expect(result.content[0].text).toContain('"status": "completed"')
    })

    it('debería manejar IDs de workflow negativos', async () => {
      // Arrange
      const mockStatusResult: StatusWorkflow = {
        status: 'failed',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: -1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(mockGithubClient.getStatusWorkflow).toHaveBeenCalledWith(
        'test-repo',
        -1
      )
      expect(result.content[0].text).toContain('"status": "failed"')
    })

    it('debería manejar IDs de workflow cero', async () => {
      // Arrange
      const mockStatusResult: StatusWorkflow = {
        status: 'failed',
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 0,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(mockGithubClient.getStatusWorkflow).toHaveBeenCalledWith(
        'test-repo',
        0
      )
      expect(result.content[0].text).toContain('"status": "failed"')
    })

    it('debería manejar parámetros con valores undefined', async () => {
      // Arrange
      const mockStatusResult: StatusWorkflow = {
        status: 'completed',
      }
      const params = {
        repositoryName: 'test-repo',
        id: undefined,
        dirName: undefined,
        path: undefined,
        nameBranch: undefined,
      } as any
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(mockGithubClient.getStatusWorkflow).toHaveBeenCalledWith(
        'test-repo',
        undefined
      )
      expect(result.content[0].text).toContain('"status": "completed"')
    })

    it('debería manejar estados de workflow con caracteres especiales', async () => {
      // Arrange
      const specialStatus = 'custom_status_with_special_chars@#$%'
      const mockStatusResult: StatusWorkflow = {
        status: specialStatus,
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(result.content[0].text).toContain(specialStatus)
    })

    it('debería manejar estados de workflow muy largos', async () => {
      // Arrange
      const longStatus = 'a'.repeat(1000)
      const mockStatusResult: StatusWorkflow = {
        status: longStatus,
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(result.content[0].text).toContain(longStatus)
    })

    it('debería manejar múltiples workflows en diferentes repositorios', async () => {
      // Arrange
      const repositories = ['repo1', 'repo2', 'repo3']
      const workflowIds = [100, 200, 300]
      const statuses = ['completed', 'failed', 'in_progress']

      for (let i = 0; i < repositories.length; i++) {
        const mockStatusResult: StatusWorkflow = {
          status: statuses[i],
        }
        const params: ToolParams = {
          repositoryName: repositories[i],
          id: workflowIds[i],
          dirName: '',
          path: '',
          nameBranch: '',
        }
        mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

        // Act
        const result = await server.handleGetStatusWorkflow(params)

        // Assert
        expect(result.content[0].text).toContain(`"status": "${statuses[i]}"`)
      }
    })

    it('debería manejar estados de workflow con valores null', async () => {
      // Arrange
      const mockStatusResult: StatusWorkflow = {
        status: null as any,
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      expect(result.content[0].text).toContain('"status": null')
    })

    it('debería manejar estados de workflow con valores undefined', async () => {
      // Arrange
      const mockStatusResult: StatusWorkflow = {
        status: undefined as any,
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 123,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getStatusWorkflow.mockResolvedValue(mockStatusResult)

      // Act
      const result = await server.handleGetStatusWorkflow(params)

      // Assert
      // JSON.stringify omite propiedades con valor undefined, por lo que el resultado será {}
      expect(result.content[0].text).toContain('Status workflow: {}')
    })
  })
})
