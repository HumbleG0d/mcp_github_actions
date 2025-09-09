import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer';
import { GithubClient } from '../../src/github/GithubClient';
import { GitHubRepo } from '../../src/types/types';

// Mock del GithubClient
jest.mock('../../src/github/GithubClient');

describe('DevOpsMCPServer - handleShowRepos', () => {
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
        it('debería retornar la lista de repositorios cuando la operación es exitosa', async () => {
            // Arrange
            const mockRepos: GitHubRepo[] = [
                { id: 1, name: 'repo1', private: false },
                { id: 2, name: 'repo2', private: true }
            ];
            mockGithubClient.getAllRepos.mockResolvedValue(mockRepos);

            // Act
            const result = await server.handleShowRepos();

            // Assert
            expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1);
            expect(mockGithubClient.getAllRepos).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Repositories found: ${JSON.stringify(mockRepos, null, 2)}`
                    }
                ]
            });
        });

        it('debería manejar una lista vacía de repositorios', async () => {
            // Arrange
            const mockRepos: GitHubRepo[] = [];
            mockGithubClient.getAllRepos.mockResolvedValue(mockRepos);

            // Act
            const result = await server.handleShowRepos();

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Repositories found: ${JSON.stringify([], null, 2)}`
                    }
                ]
            });
        });

        it('debería inicializar el cliente de GitHub solo una vez en múltiples llamadas', async () => {
            // Arrange
            const mockRepos: GitHubRepo[] = [{ id: 1, name: 'repo1', private: false }];
            mockGithubClient.getAllRepos.mockResolvedValue(mockRepos);

            // Act
            await server.handleShowRepos();
            await server.handleShowRepos();

            // Assert
            expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1);
            expect(mockGithubClient.getAllRepos).toHaveBeenCalledTimes(2);
        });
    });

    describe('Errores', () => {
        it('debería manejar errores de inicialización del cliente de GitHub', async () => {
            // Arrange
            const errorMessage = 'Failed to initialize GitHub client';
            mockGithubClient.initialize.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleShowRepos();

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

        it('debería manejar errores al obtener repositorios', async () => {
            // Arrange
            const errorMessage = 'Failed to fetch repositories';
            mockGithubClient.getAllRepos.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleShowRepos();

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
            mockGithubClient.getAllRepos.mockRejectedValue('Unknown error');

            // Act
            const result = await server.handleShowRepos();

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

        it('debería manejar errores de red o timeout', async () => {
            // Arrange
            const networkError = new Error('Network timeout');
            networkError.name = 'TimeoutError';
            mockGithubClient.getAllRepos.mockRejectedValue(networkError);

            // Act
            const result = await server.handleShowRepos();

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: 'Error: Network timeout'
                    }
                ]
            });
        });
    });

    describe('Casos edge', () => {
        it('debería manejar repositorios con caracteres especiales en el nombre', async () => {
            // Arrange
            const mockRepos: GitHubRepo[] = [
                { id: 1, name: 'repo-with-dashes', private: false },
                { id: 2, name: 'repo_with_underscores', private: false },
                { id: 3, name: 'repo.with.dots', private: false },
                { id: 4, name: 'repo@with@symbols', private: false }
            ];
            mockGithubClient.getAllRepos.mockResolvedValue(mockRepos);

            // Act
            const result = await server.handleShowRepos();

            // Assert
            expect(result.content[0].text).toContain('repo-with-dashes');
            expect(result.content[0].text).toContain('repo_with_underscores');
            expect(result.content[0].text).toContain('repo.with.dots');
            expect(result.content[0].text).toContain('repo@with@symbols');
        });

        it('debería manejar repositorios con IDs muy grandes', async () => {
            // Arrange
            const mockRepos: GitHubRepo[] = [
                { id: Number.MAX_SAFE_INTEGER, name: 'large-id-repo', private: false }
            ];
            mockGithubClient.getAllRepos.mockResolvedValue(mockRepos);

            // Act
            const result = await server.handleShowRepos();

            // Assert
            expect(result.content[0].text).toContain('large-id-repo');
            expect(result.content[0].text).toContain(Number.MAX_SAFE_INTEGER.toString());
        });
    });
});
