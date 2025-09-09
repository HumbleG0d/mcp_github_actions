import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer';
import { GithubClient } from '../../src/github/GithubClient';
import { ToolParams, Welcome } from '../../src/types/types';

// Mock del GithubClient
jest.mock('../../src/github/GithubClient');

describe('DevOpsMCPServer - handleShowContentTree', () => {
    let server: DevOpsMCPServer;
    let mockGithubClient: jest.Mocked<GithubClient>;

    beforeEach(() => {
        // Limpiar todos los mocks antes de cada test
        jest.clearAllMocks();
        
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
            getStatusWorkflow: jest.fn()
        } as any;

        // Mock del constructor de GithubClient
        (GithubClient as jest.MockedClass<typeof GithubClient>).mockImplementation(() => mockGithubClient);
        
        server = new DevOpsMCPServer();
    });

    describe('Éxito', () => {
        it('debería retornar el contenido del árbol del repositorio cuando la operación es exitosa', async () => {
            // Arrange
            const mockContentTree: Welcome = {
                sha: 'abc123def456',
                tree: [
                    {
                        path: 'src/main.ts',
                        type: 'blob' as any,
                        sha: 'file-sha-123'
                    },
                    {
                        path: 'src/components',
                        type: 'tree' as any,
                        sha: 'tree-sha-456'
                    },
                    {
                        path: 'README.md',
                        type: 'blob' as any,
                        sha: 'readme-sha-789'
                    }
                ]
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1);
            expect(mockGithubClient.getContentTree).toHaveBeenCalledWith('test-repo', 'main');
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Contenido del repositorio: ${JSON.stringify(mockContentTree.tree, null, 2)}`
                    }
                ]
            });
        });

        it('debería manejar un árbol vacío', async () => {
            // Arrange
            const mockContentTree: Welcome = {
                sha: 'empty-sha',
                tree: []
            };
            const params: ToolParams = {
                repositoryName: 'empty-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Contenido del repositorio: ${JSON.stringify(mockContentTree.tree, null, 2)}`
                    }
                ]
            });
        });

        it('debería manejar diferentes tipos de archivos y directorios', async () => {
            // Arrange
            const mockContentTree: Welcome = {
                sha: 'mixed-sha',
                tree: [
                    {
                        path: 'package.json',
                        type: 'blob' as any,
                        sha: 'package-sha'
                    },
                    {
                        path: 'src',
                        type: 'tree' as any,
                        sha: 'src-sha'
                    },
                    {
                        path: 'tests',
                        type: 'tree' as any,
                        sha: 'tests-sha'
                    },
                    {
                        path: 'Dockerfile',
                        type: 'blob' as any,
                        sha: 'docker-sha'
                    },
                    {
                        path: '.github/workflows',
                        type: 'tree' as any,
                        sha: 'workflows-sha'
                    }
                ]
            };
            const params: ToolParams = {
                repositoryName: 'mixed-repo',
                nameBranch: 'develop',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result.content[0].text).toContain('package.json');
            expect(result.content[0].text).toContain('src');
            expect(result.content[0].text).toContain('tests');
            expect(result.content[0].text).toContain('Dockerfile');
            expect(result.content[0].text).toContain('.github/workflows');
        });

        it('debería manejar diferentes ramas', async () => {
            // Arrange
            const branches = ['main', 'develop', 'feature/new-feature', 'hotfix/critical-bug'];
            const mockContentTree: Welcome = {
                sha: 'branch-sha',
                tree: [
                    {
                        path: 'README.md',
                        type: 'blob' as any,
                        sha: 'readme-sha'
                    }
                ]
            };

            for (const branch of branches) {
                const params: ToolParams = {
                    repositoryName: 'multi-branch-repo',
                    nameBranch: branch,
                    id: 0,
                    dirName: '',
                    path: ''
                };
                mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

                // Act
                const result = await server.handleShowContentTree(params);

                // Assert
                expect(mockGithubClient.getContentTree).toHaveBeenCalledWith('multi-branch-repo', branch);
                expect(result.content[0].text).toContain('README.md');
            }
        });
    });

    describe('Errores', () => {
        it('debería manejar errores de inicialización del cliente de GitHub', async () => {
            // Arrange
            const errorMessage = 'Failed to initialize GitHub client';
            const params: ToolParams = {
                repositoryName: 'test-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.initialize.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Error: ${errorMessage}`
                    }
                ]
            });
        });

        it('debería manejar errores al obtener el contenido del árbol', async () => {
            // Arrange
            const errorMessage = 'Failed to fetch repository tree';
            const params: ToolParams = {
                repositoryName: 'test-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Error: ${errorMessage}`
                    }
                ]
            });
        });

        it('debería manejar errores de repositorio no encontrado', async () => {
            // Arrange
            const errorMessage = 'Repository not found';
            const params: ToolParams = {
                repositoryName: 'non-existent-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Error: ${errorMessage}`
                    }
                ]
            });
        });

        it('debería manejar errores de rama no encontrada', async () => {
            // Arrange
            const errorMessage = 'Branch not found';
            const params: ToolParams = {
                repositoryName: 'test-repo',
                nameBranch: 'non-existent-branch',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Error: ${errorMessage}`
                    }
                ]
            });
        });

        it('debería manejar errores de permisos insuficientes', async () => {
            // Arrange
            const errorMessage = 'Insufficient permissions';
            const params: ToolParams = {
                repositoryName: 'private-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Error: ${errorMessage}`
                    }
                ]
            });
        });

        it('debería manejar errores no identificados', async () => {
            // Arrange
            const params: ToolParams = {
                repositoryName: 'test-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockRejectedValue('Unknown error');

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: 'Error: Unknown error'
                    }
                ]
            });
        });
    });

    describe('Casos edge', () => {
        it('debería manejar nombres de repositorio con caracteres especiales', async () => {
            // Arrange
            const mockContentTree: Welcome = {
                sha: 'special-sha',
                tree: [
                    {
                        path: 'test-file.txt',
                        type: 'blob' as any,
                        sha: 'file-sha'
                    }
                ]
            };
            const params: ToolParams = {
                repositoryName: 'repo-with-special-chars-@#$%',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(mockGithubClient.getContentTree).toHaveBeenCalledWith('repo-with-special-chars-@#$%', 'main');
            expect(result.content[0].text).toContain('test-file.txt');
        });

        it('debería manejar nombres de rama con caracteres especiales', async () => {
            // Arrange
            const mockContentTree: Welcome = {
                sha: 'branch-sha',
                tree: [
                    {
                        path: 'test-file.txt',
                        type: 'blob' as any,
                        sha: 'file-sha'
                    }
                ]
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                nameBranch: 'feature/special-chars-@#$%',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(mockGithubClient.getContentTree).toHaveBeenCalledWith('test-repo', 'feature/special-chars-@#$%');
            expect(result.content[0].text).toContain('test-file.txt');
        });

        it('debería manejar árboles con muchos archivos', async () => {
            // Arrange
            const largeTree = Array.from({ length: 1000 }, (_, i) => ({
                path: `file${i}.txt`,
                type: 'blob' as any,
                sha: `sha-${i}`
            }));
            const mockContentTree: Welcome = {
                sha: 'large-sha',
                tree: largeTree
            };
            const params: ToolParams = {
                repositoryName: 'large-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result.content[0].text).toContain('file0.txt');
            expect(result.content[0].text).toContain('file999.txt');
        });

        it('debería manejar archivos con nombres muy largos', async () => {
            // Arrange
            const longFileName = 'a'.repeat(1000) + '.txt';
            const mockContentTree: Welcome = {
                sha: 'long-name-sha',
                tree: [
                    {
                        path: longFileName,
                        type: 'blob' as any,
                        sha: 'long-file-sha'
                    }
                ]
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result.content[0].text).toContain(longFileName);
        });

        it('debería manejar parámetros con valores undefined', async () => {
            // Arrange
            const mockContentTree: Welcome = {
                sha: 'undefined-sha',
                tree: []
            };
            const params = {
                repositoryName: 'test-repo',
                nameBranch: undefined,
                id: undefined,
                dirName: undefined,
                path: undefined
            } as any;
            mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(mockGithubClient.getContentTree).toHaveBeenCalledWith('test-repo', undefined);
            expect(result.content[0].text).toContain('Contenido del repositorio');
        });

        it('debería manejar SHA muy largos', async () => {
            // Arrange
            const longSha = 'a'.repeat(100);
            const mockContentTree: Welcome = {
                sha: longSha,
                tree: [
                    {
                        path: 'test.txt',
                        type: 'blob' as any,
                        sha: longSha + '-file'
                    }
                ]
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                nameBranch: 'main',
                id: 0,
                dirName: '',
                path: ''
            };
            mockGithubClient.getContentTree.mockResolvedValue(mockContentTree.tree);

            // Act
            const result = await server.handleShowContentTree(params);

            // Assert
            expect(result.content[0].text).toContain(longSha);
        });
    });
});
