import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer'
import { GithubClient } from '../../src/github/GithubClient'
import { GitHubResponse, ToolParams } from '../../src/types/types'

// Mock del GithubClient
jest.mock('../../src/github/GithubClient')

describe('DevOpsMCPServer - handleShowWorkflows', () => {
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
    it('debería retornar los workflows cuando la operación es exitosa', async () => {
      // Arrange
      const mockWorkflows: GitHubResponse = {
        workflow_runs: [
          {
            id: 1,
            name: 'CI/CD Pipeline',
            conclusion: 'success',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            name: 'Deploy to Production',
            conclusion: 'failure',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockResolvedValue(
        mockWorkflows.workflow_runs
      )

      // Act
      const result = await server.handleShowWorkflows(params)

      // Assert
      expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1)
      expect(mockGithubClient.getDataWorkflows).toHaveBeenCalledWith(
        'test-repo'
      )
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Workflows found: ${JSON.stringify(mockWorkflows.workflow_runs, null, 2)}`,
          },
        ],
      })
    })

    it('debería manejar una lista vacía de workflows', async () => {
      // Arrange
      const mockWorkflows: GitHubResponse = {
        workflow_runs: [],
      }
      const params: ToolParams = {
        repositoryName: 'empty-repo',
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockResolvedValue(
        mockWorkflows.workflow_runs
      )

      // Act
      const result = await server.handleShowWorkflows(params)

      // Assert
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Workflows found: ${JSON.stringify(mockWorkflows.workflow_runs, null, 2)}`,
          },
        ],
      })
    })

    it('debería manejar workflows con diferentes estados', async () => {
      // Arrange
      const mockWorkflows: GitHubResponse = {
        workflow_runs: [
          {
            id: 1,
            name: 'Success Workflow',
            conclusion: 'success',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            name: 'Failed Workflow',
            conclusion: 'failure',
            updated_at: '2024-01-02T00:00:00Z',
          },
          {
            id: 3,
            name: 'Cancelled Workflow',
            conclusion: 'cancelled',
            updated_at: '2024-01-03T00:00:00Z',
          },
          {
            id: 4,
            name: 'Skipped Workflow',
            conclusion: 'skipped',
            updated_at: '2024-01-04T00:00:00Z',
          },
        ],
      }
      const params: ToolParams = {
        repositoryName: 'multi-status-repo',
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockResolvedValue(
        mockWorkflows.workflow_runs
      )

      // Act
      const result = await server.handleShowWorkflows(params)

      // Assert
      expect(result.content[0].text).toContain('Success Workflow')
      expect(result.content[0].text).toContain('Failed Workflow')
      expect(result.content[0].text).toContain('Cancelled Workflow')
      expect(result.content[0].text).toContain('Skipped Workflow')
    })
  })

  describe('Errores', () => {
    it('debería manejar errores de inicialización del cliente de GitHub', async () => {
      // Arrange
      const errorMessage = 'Failed to initialize GitHub client'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.initialize.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleShowWorkflows(params)

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

    it('debería manejar errores al obtener workflows', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch workflows'
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleShowWorkflows(params)

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
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleShowWorkflows(params)

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
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockRejectedValue(
        new Error(errorMessage)
      )

      // Act
      const result = await server.handleShowWorkflows(params)

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
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockRejectedValue('Unknown error')

      // Act
      const result = await server.handleShowWorkflows(params)

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
      const mockWorkflows: GitHubResponse = {
        workflow_runs: [
          {
            id: 1,
            name: 'Test Workflow',
            conclusion: 'success',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      }
      const params: ToolParams = {
        repositoryName: 'repo-with-special-chars-@#$%',
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockResolvedValue(
        mockWorkflows.workflow_runs
      )

      // Act
      const result = await server.handleShowWorkflows(params)

      // Assert
      expect(mockGithubClient.getDataWorkflows).toHaveBeenCalledWith(
        'repo-with-special-chars-@#$%'
      )
      expect(result.content[0].text).toContain('Test Workflow')
    })

    it('debería manejar workflows con nombres muy largos', async () => {
      // Arrange
      const longWorkflowName = 'A'.repeat(1000)
      const mockWorkflows: GitHubResponse = {
        workflow_runs: [
          {
            id: 1,
            name: longWorkflowName,
            conclusion: 'success',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockResolvedValue(
        mockWorkflows.workflow_runs
      )

      // Act
      const result = await server.handleShowWorkflows(params)

      // Assert
      expect(result.content[0].text).toContain(longWorkflowName)
    })

    it('debería manejar workflows con IDs muy grandes', async () => {
      // Arrange
      const mockWorkflows: GitHubResponse = {
        workflow_runs: [
          {
            id: Number.MAX_SAFE_INTEGER,
            name: 'Large ID Workflow',
            conclusion: 'success',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      }
      const params: ToolParams = {
        repositoryName: 'test-repo',
        id: 1,
        dirName: '',
        path: '',
        nameBranch: '',
      }
      mockGithubClient.getDataWorkflows.mockResolvedValue(
        mockWorkflows.workflow_runs
      )

      // Act
      const result = await server.handleShowWorkflows(params)

      // Assert
      expect(result.content[0].text).toContain(
        Number.MAX_SAFE_INTEGER.toString()
      )
    })

    it('debería manejar parámetros con valores undefined', async () => {
      // Arrange
      const mockWorkflows: GitHubResponse = {
        workflow_runs: [],
      }
      const params = {
        repositoryName: 'test-repo',
        id: undefined,
        dirName: undefined,
        path: undefined,
        nameBranch: undefined,
      } as any
      mockGithubClient.getDataWorkflows.mockResolvedValue(
        mockWorkflows.workflow_runs
      )

      // Act
      const result = await server.handleShowWorkflows(params)

      // Assert
      expect(mockGithubClient.getDataWorkflows).toHaveBeenCalledWith(
        'test-repo'
      )
      expect(result.content[0].text).toContain('Workflows found')
    })
  })
})
