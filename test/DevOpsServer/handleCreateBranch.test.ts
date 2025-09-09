import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer'
import { GithubClient } from '../../src/github/GithubClient'
import { ToolParamsCreateBranch, CreateBranch } from '../../src/types/types'

// Mock del GithubClient
jest.mock('../../src/github/GithubClient')

describe('DevOpsMCPServer - handleCreateBranch', () => {
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
    it('debería crear una rama cuando la operación es exitosa', async () => {
      // Arrange
      const mockCreateResult: CreateBranch = {
        message: 'Branch created successfully',
        sha: 'new-branch-sha-123',
      }
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: 'feature/new-feature',
        sha: 'base-sha-123',
      }
      mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

      // Act
      const result = await server.handleCreateBranch(params)

      // Assert
      expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1)
      expect(mockGithubClient.createBranch).toHaveBeenCalledWith(
        'test-repo',
        'feature/new-feature',
        'base-sha-123'
      )
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Create branch: ${JSON.stringify(mockCreateResult, null, 2)}`,
          },
        ],
      })
    })

    it('debería manejar creación de diferentes tipos de ramas', async () => {
      // Arrange
      const branchTypes = [
        { name: 'feature/user-authentication', type: 'feature' },
        { name: 'bugfix/critical-error', type: 'bugfix' },
        { name: 'hotfix/security-patch', type: 'hotfix' },
        { name: 'release/v2.0.0', type: 'release' },
        { name: 'develop', type: 'development' },
        { name: 'main', type: 'main' },
      ]

      for (const branchType of branchTypes) {
        const mockCreateResult: CreateBranch = {
          message: `${branchType.type} branch created`,
          sha: `sha-${branchType.name}`,
        }
        const params: ToolParamsCreateBranch = {
          repositoryName: 'test-repo',
          newBranchName: branchType.name,
          sha: 'base-sha',
        }
        mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

        // Act
        const result = await server.handleCreateBranch(params)

        // Assert
        expect(result.content[0].text).toContain(
          `${branchType.type} branch created`
        )
        expect(result.content[0].text).toContain(`sha-${branchType.name}`)
      }
    })

    it('debería manejar nombres de rama con caracteres especiales', async () => {
      // Arrange
      const specialBranchNames = [
        'feature/special-chars-@#$%',
        'bugfix/unicode-中文',
        'hotfix/spaces in name',
        'release/v2.0.0-beta.1',
        'feature/very-long-branch-name-with-many-words-and-descriptions',
      ]

      for (const branchName of specialBranchNames) {
        const mockCreateResult: CreateBranch = {
          message: 'Special branch created',
          sha: `sha-${branchName.replace(/[^a-zA-Z0-9]/g, '-')}`,
        }
        const params: ToolParamsCreateBranch = {
          repositoryName: 'test-repo',
          newBranchName: branchName,
          sha: 'base-sha',
        }
        mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

        // Act
        const result = await server.handleCreateBranch(params)

        // Assert
        expect(result.content[0].text).toContain('Special branch created')
      }
    })

    it('debería manejar SHA muy largos', async () => {
      // Arrange
      const longSha = 'a'.repeat(100)
      const mockCreateResult: CreateBranch = {
        message: 'Branch with long SHA created',
        sha: longSha + '-new',
      }
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: 'feature/long-sha',
        sha: longSha,
      }
      mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

      // Act
      const result = await server.handleCreateBranch(params)

      // Assert
      expect(result.content[0].text).toContain(longSha + '-new')
    })
  })

  describe('Errores', () => {
    it('debería manejar errores de inicialización del cliente de GitHub', async () => {
      // Arrange
      const errorMessage = 'Failed to initialize GitHub client'
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: 'feature/test',
        sha: 'base-sha',
      }
      mockGithubClient.initialize.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleCreateBranch(params)

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

    it('debería manejar errores al crear ramas', async () => {
      // Arrange
      const errorMessage = 'Failed to create branch'
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: 'feature/test',
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleCreateBranch(params)

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

    it('debería manejar errores de rama ya existente', async () => {
      // Arrange
      const errorMessage = 'Branch already exists'
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: 'existing-branch',
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleCreateBranch(params)

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

    it('debería manejar errores de SHA inválido', async () => {
      // Arrange
      const errorMessage = 'Invalid SHA provided'
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: 'feature/test',
        sha: 'invalid-sha',
      }
      mockGithubClient.createBranch.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleCreateBranch(params)

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
      const params: ToolParamsCreateBranch = {
        repositoryName: 'non-existent-repo',
        newBranchName: 'feature/test',
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleCreateBranch(params)

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
      const errorMessage = 'Insufficient permissions to create branch'
      const params: ToolParamsCreateBranch = {
        repositoryName: 'private-repo',
        newBranchName: 'feature/test',
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleCreateBranch(params)

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

    it('debería manejar errores de nombre de rama inválido', async () => {
      // Arrange
      const errorMessage = 'Invalid branch name'
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: 'invalid/branch/name/with/slashes',
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockRejectedValue(new Error(errorMessage))

      // Act
      const result = await server.handleCreateBranch(params)

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
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: 'feature/test',
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockRejectedValue('Unknown error')

      // Act
      const result = await server.handleCreateBranch(params)

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
      const mockCreateResult: CreateBranch = {
        message: 'Branch created in special repo',
        sha: 'special-repo-sha',
      }
      const params: ToolParamsCreateBranch = {
        repositoryName: 'repo-with-special-chars-@#$%',
        newBranchName: 'feature/test',
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

      // Act
      const result = await server.handleCreateBranch(params)

      // Assert
      expect(mockGithubClient.createBranch).toHaveBeenCalledWith(
        'repo-with-special-chars-@#$%',
        'feature/test',
        'base-sha'
      )
      expect(result.content[0].text).toContain('Branch created in special repo')
    })

    it('debería manejar nombres de rama muy largos', async () => {
      // Arrange
      const longBranchName = 'a'.repeat(1000)
      const mockCreateResult: CreateBranch = {
        message: 'Long branch name created',
        sha: 'long-branch-sha',
      }
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: longBranchName,
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

      // Act
      const result = await server.handleCreateBranch(params)

      // Assert
      expect(mockGithubClient.createBranch).toHaveBeenCalledWith(
        'test-repo',
        longBranchName,
        'base-sha'
      )
      expect(result.content[0].text).toContain('Long branch name created')
    })

    it('debería manejar nombres de rama vacíos', async () => {
      // Arrange
      const mockCreateResult: CreateBranch = {
        message: 'Empty branch name handled',
        sha: 'empty-branch-sha',
      }
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: '',
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

      // Act
      const result = await server.handleCreateBranch(params)

      // Assert
      expect(mockGithubClient.createBranch).toHaveBeenCalledWith(
        'test-repo',
        '',
        'base-sha'
      )
      expect(result.content[0].text).toContain('Empty branch name handled')
    })

    it('debería manejar SHA vacíos', async () => {
      // Arrange
      const mockCreateResult: CreateBranch = {
        message: 'Empty SHA handled',
        sha: 'empty-sha-result',
      }
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: 'feature/test',
        sha: '',
      }
      mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

      // Act
      const result = await server.handleCreateBranch(params)

      // Assert
      expect(mockGithubClient.createBranch).toHaveBeenCalledWith(
        'test-repo',
        'feature/test',
        ''
      )
      expect(result.content[0].text).toContain('Empty SHA handled')
    })

    it('debería manejar parámetros con valores undefined', async () => {
      // Arrange
      const mockCreateResult: CreateBranch = {
        message: 'Undefined params handled',
        sha: 'undefined-sha',
      }
      const params = {
        repositoryName: 'test-repo',
        newBranchName: undefined,
        sha: undefined,
      } as any
      mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

      // Act
      const result = await server.handleCreateBranch(params)

      // Assert
      expect(mockGithubClient.createBranch).toHaveBeenCalledWith(
        'test-repo',
        undefined,
        undefined
      )
      expect(result.content[0].text).toContain('Undefined params handled')
    })

    it('debería manejar nombres de rama con caracteres Unicode', async () => {
      // Arrange
      const unicodeBranchName = 'feature/unicode-中文-日本語-한국어'
      const mockCreateResult: CreateBranch = {
        message: 'Unicode branch created',
        sha: 'unicode-sha',
      }
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: unicodeBranchName,
        sha: 'base-sha',
      }
      mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

      // Act
      const result = await server.handleCreateBranch(params)

      // Assert
      expect(mockGithubClient.createBranch).toHaveBeenCalledWith(
        'test-repo',
        unicodeBranchName,
        'base-sha'
      )
      expect(result.content[0].text).toContain('Unicode branch created')
    })

    it('debería manejar múltiples creaciones de rama en el mismo repositorio', async () => {
      // Arrange
      const branchNames = [
        'feature/branch1',
        'feature/branch2',
        'feature/branch3',
      ]
      const params: ToolParamsCreateBranch = {
        repositoryName: 'test-repo',
        newBranchName: '',
        sha: 'base-sha',
      }

      for (let i = 0; i < branchNames.length; i++) {
        const mockCreateResult: CreateBranch = {
          message: `Branch ${i + 1} created`,
          sha: `sha-${i + 1}`,
        }
        params.newBranchName = branchNames[i]
        mockGithubClient.createBranch.mockResolvedValue(mockCreateResult)

        // Act
        const result = await server.handleCreateBranch(params)

        // Assert
        expect(result.content[0].text).toContain(`Branch ${i + 1} created`)
      }
    })
  })
})
