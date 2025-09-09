import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer';
import { GithubClient } from '../../src/github/GithubClient';
import { DownloadResult, ToolParams } from '../../src/types/types';

// Mock del GithubClient
jest.mock('../../src/github/GithubClient');

describe('DevOpsMCPServer - handleDownloadLogs', () => {
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
        it('debería retornar éxito cuando la descarga es exitosa', async () => {
            // Arrange
            const mockDownloadResult: DownloadResult = {
                success: true,
                filename: 'workflow-logs-123.zip'
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

            // Act
            const result = await server.handleDownloadLogs(params);

            // Assert
            expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1);
            expect(mockGithubClient.getFileLogs).toHaveBeenCalledWith('test-repo', 123);
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Logs downloaded successfully to: ${mockDownloadResult.filename}`
                    }
                ]
            });
        });

        it('debería manejar descarga exitosa con nombre de archivo largo', async () => {
            // Arrange
            const longFilename = 'very-long-workflow-logs-filename-' + 'a'.repeat(100) + '.zip';
            const mockDownloadResult: DownloadResult = {
                success: true,
                filename: longFilename
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

            // Act
            const result = await server.handleDownloadLogs(params);

            // Assert
            expect(result.content[0].text).toContain(longFilename);
        });

        it('debería manejar descarga exitosa con diferentes extensiones de archivo', async () => {
            // Arrange
            const extensions = ['.zip', '.tar.gz', '.log', '.txt'];
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };

            for (const ext of extensions) {
                const mockDownloadResult: DownloadResult = {
                    success: true,
                    filename: `logs${ext}`
                };
                mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

                // Act
                const result = await server.handleDownloadLogs(params);

                // Assert
                expect(result.content[0].text).toContain(`logs${ext}`);
            }
        });
    });

    describe('Errores', () => {
        it('debería manejar errores cuando la descarga falla', async () => {
            // Arrange
            const mockDownloadResult: DownloadResult = {
                success: false,
                error: 'Failed to download logs'
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

            // Act
            const result = await server.handleDownloadLogs(params);

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Error downloading logs: ${mockDownloadResult.error}`
                    }
                ]
            });
        });

        it('debería manejar errores cuando la descarga falla sin mensaje de error', async () => {
            // Arrange
            const mockDownloadResult: DownloadResult = {
                success: false
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

            // Act
            const result = await server.handleDownloadLogs(params);

            // Assert
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: 'Error downloading logs: Unknown error'
                    }
                ]
            });
        });

        it('debería manejar errores de inicialización del cliente de GitHub', async () => {
            // Arrange
            const errorMessage = 'Failed to initialize GitHub client';
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.initialize.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleDownloadLogs(params);

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

        it('debería manejar errores al obtener logs', async () => {
            // Arrange
            const errorMessage = 'Failed to fetch logs';
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleDownloadLogs(params);

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

        it('debería manejar errores de workflow no encontrado', async () => {
            // Arrange
            const errorMessage = 'Workflow not found';
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: 999999,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleDownloadLogs(params);

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
            const errorMessage = 'Insufficient permissions to download logs';
            const params: ToolParams = {
                repositoryName: 'private-repo',
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleDownloadLogs(params);

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
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockRejectedValue('Unknown error');

            // Act
            const result = await server.handleDownloadLogs(params);

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
        it('debería manejar IDs de workflow muy grandes', async () => {
            // Arrange
            const mockDownloadResult: DownloadResult = {
                success: true,
                filename: 'large-id-logs.zip'
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: Number.MAX_SAFE_INTEGER,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

            // Act
            const result = await server.handleDownloadLogs(params);

            // Assert
            expect(mockGithubClient.getFileLogs).toHaveBeenCalledWith('test-repo', Number.MAX_SAFE_INTEGER);
            expect(result.content[0].text).toContain('large-id-logs.zip');
        });

        it('debería manejar nombres de repositorio con caracteres especiales', async () => {
            // Arrange
            const mockDownloadResult: DownloadResult = {
                success: true,
                filename: 'special-chars-logs.zip'
            };
            const params: ToolParams = {
                repositoryName: 'repo-with-special-chars-@#$%',
                id: 123,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

            // Act
            const result = await server.handleDownloadLogs(params);

            // Assert
            expect(mockGithubClient.getFileLogs).toHaveBeenCalledWith('repo-with-special-chars-@#$%', 123);
            expect(result.content[0].text).toContain('special-chars-logs.zip');
        });

        it('debería manejar IDs de workflow negativos', async () => {
            // Arrange
            const mockDownloadResult: DownloadResult = {
                success: false,
                error: 'Invalid workflow ID'
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: -1,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

            // Act
            const result = await server.handleDownloadLogs(params);

            // Assert
            expect(mockGithubClient.getFileLogs).toHaveBeenCalledWith('test-repo', -1);
            expect(result.content[0].text).toContain('Invalid workflow ID');
        });

        it('debería manejar IDs de workflow cero', async () => {
            // Arrange
            const mockDownloadResult: DownloadResult = {
                success: false,
                error: 'Workflow ID cannot be zero'
            };
            const params: ToolParams = {
                repositoryName: 'test-repo',
                id: 0,
                dirName: '',
                path: '',
                nameBranch: ''
            };
            mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

            // Act
            const result = await server.handleDownloadLogs(params);

            // Assert
            expect(mockGithubClient.getFileLogs).toHaveBeenCalledWith('test-repo', 0);
            expect(result.content[0].text).toContain('Workflow ID cannot be zero');
        });

        it('debería manejar parámetros con valores undefined', async () => {
            // Arrange
            const mockDownloadResult: DownloadResult = {
                success: false,
                error: 'Invalid parameters'
            };
            const params = {
                repositoryName: 'test-repo',
                id: undefined,
                dirName: undefined,
                path: undefined,
                nameBranch: undefined
            } as any;
            mockGithubClient.getFileLogs.mockResolvedValue(mockDownloadResult);

            // Act
            const result = await server.handleDownloadLogs(params);

            // Assert
            expect(mockGithubClient.getFileLogs).toHaveBeenCalledWith('test-repo', undefined);
            expect(result.content[0].text).toContain('Invalid parameters');
        });
    });
});
