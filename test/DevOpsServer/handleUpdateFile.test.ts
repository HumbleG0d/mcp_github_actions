import { DevOpsMCPServer } from '../../src/core/DevOpsMCPServer';
import { GithubClient } from '../../src/github/GithubClient';
import { ToolParamsUpdateFile, UpdateFile } from '../../src/types/types';

// Mock del GithubClient
jest.mock('../../src/github/GithubClient');

describe('DevOpsMCPServer - handleUpdateFile', () => {
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
        it('debería actualizar un archivo cuando la operación es exitosa', async () => {
            // Arrange
            const mockUpdateResult: UpdateFile = {
                message: 'File updated successfully',
                sha: 'new-sha-123',
                content: 'Updated file content'
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'package.json',
                content: '{"name": "updated-project", "version": "2.0.0"}',
                sha: 'old-sha-123',
                message: 'Update package.json version'
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(mockGithubClient.initialize).toHaveBeenCalledTimes(1);
            expect(mockGithubClient.updateFile).toHaveBeenCalledWith(
                'test-repo',
                'package.json',
                '{"name": "updated-project", "version": "2.0.0"}',
                'old-sha-123',
                'Update package.json version'
            );
            expect(result).toEqual({
                content: [
                    {
                        type: "text",
                        text: `Update file: ${JSON.stringify(mockUpdateResult, null, 2)}`
                    }
                ]
            });
        });

        it('debería manejar actualización de archivos con contenido vacío', async () => {
            // Arrange
            const mockUpdateResult: UpdateFile = {
                message: 'File cleared successfully',
                sha: 'empty-sha',
                content: ''
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'empty.txt',
                content: '',
                sha: 'old-sha',
                message: 'Clear file content'
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(result.content[0].text).toContain('File cleared successfully');
            expect(result.content[0].text).toContain('"content": ""');
        });

        it('debería manejar actualización de diferentes tipos de archivos', async () => {
            // Arrange
            const fileUpdates = [
                {
                    path: 'script.js',
                    content: 'console.log("Updated JavaScript");',
                    message: 'Update JavaScript file'
                },
                {
                    path: 'config.json',
                    content: '{"updated": true, "version": "2.0"}',
                    message: 'Update configuration'
                },
                {
                    path: 'README.md',
                    content: '# Updated README\n\nThis is the updated content.',
                    message: 'Update documentation'
                },
                {
                    path: 'Dockerfile',
                    content: 'FROM node:18\nWORKDIR /app\nCOPY . .\nRUN npm install',
                    message: 'Update Docker configuration'
                }
            ];

            for (const fileUpdate of fileUpdates) {
                const mockUpdateResult: UpdateFile = {
                    message: fileUpdate.message,
                    sha: `sha-${fileUpdate.path}`,
                    content: fileUpdate.content
                };
                const params: ToolParamsUpdateFile = {
                    repositoryName: 'test-repo',
                    path: fileUpdate.path,
                    content: fileUpdate.content,
                    sha: `old-sha-${fileUpdate.path}`,
                    message: fileUpdate.message
                };
                mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

                // Act
                const result = await server.handleUpdateFile(params);

                // Assert
                expect(result.content[0].text).toContain(fileUpdate.message);
                // El contenido se escapa en JSON.stringify, así que buscamos el contenido escapado
                const escapedContent = JSON.stringify(fileUpdate.content).slice(1, -1); // Remover las comillas del JSON
                expect(result.content[0].text).toContain(escapedContent);
            }
        });

        it('debería manejar actualización de archivos con contenido muy largo', async () => {
            // Arrange
            const longContent = 'A'.repeat(10000);
            const mockUpdateResult: UpdateFile = {
                message: 'Large file updated',
                sha: 'large-sha',
                content: longContent
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'large-file.txt',
                content: longContent,
                sha: 'old-large-sha',
                message: 'Update large file'
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(result.content[0].text).toContain(longContent);
        });

        it('debería manejar actualización de archivos con caracteres especiales', async () => {
            // Arrange
            const specialContent = 'Special chars: @#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';
            const mockUpdateResult: UpdateFile = {
                message: 'Special characters updated',
                sha: 'special-sha',
                content: specialContent
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'special.txt',
                content: specialContent,
                sha: 'old-special-sha',
                message: 'Update special characters'
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            // El contenido se escapa en JSON.stringify, así que buscamos el contenido escapado
            const escapedContent = JSON.stringify(specialContent).slice(1, -1); // Remover las comillas del JSON
            expect(result.content[0].text).toContain(escapedContent);
        });
    });

    describe('Errores', () => {
        it('debería manejar errores de inicialización del cliente de GitHub', async () => {
            // Arrange
            const errorMessage = 'Failed to initialize GitHub client';
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'package.json',
                content: '{"updated": true}',
                sha: 'old-sha',
                message: 'Update file'
            };
            mockGithubClient.initialize.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleUpdateFile(params);

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

        it('debería manejar errores al actualizar archivos', async () => {
            // Arrange
            const errorMessage = 'Failed to update file';
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'package.json',
                content: '{"updated": true}',
                sha: 'old-sha',
                message: 'Update file'
            };
            mockGithubClient.updateFile.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleUpdateFile(params);

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

        it('debería manejar errores de archivo no encontrado', async () => {
            // Arrange
            const errorMessage = 'File not found';
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'non-existent-file.txt',
                content: 'New content',
                sha: 'invalid-sha',
                message: 'Update non-existent file'
            };
            mockGithubClient.updateFile.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleUpdateFile(params);

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

        it('debería manejar errores de SHA inválido', async () => {
            // Arrange
            const errorMessage = 'Invalid SHA provided';
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'package.json',
                content: '{"updated": true}',
                sha: 'invalid-sha',
                message: 'Update with invalid SHA'
            };
            mockGithubClient.updateFile.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleUpdateFile(params);

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
            const params: ToolParamsUpdateFile = {
                repositoryName: 'non-existent-repo',
                path: 'package.json',
                content: '{"updated": true}',
                sha: 'valid-sha',
                message: 'Update in non-existent repo'
            };
            mockGithubClient.updateFile.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleUpdateFile(params);

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
            const errorMessage = 'Insufficient permissions to update file';
            const params: ToolParamsUpdateFile = {
                repositoryName: 'private-repo',
                path: 'restricted-file.txt',
                content: 'Restricted content',
                sha: 'valid-sha',
                message: 'Update restricted file'
            };
            mockGithubClient.updateFile.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleUpdateFile(params);

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

        it('debería manejar errores de conflicto de merge', async () => {
            // Arrange
            const errorMessage = 'Merge conflict detected';
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'conflicted-file.txt',
                content: 'Conflicted content',
                sha: 'outdated-sha',
                message: 'Update conflicted file'
            };
            mockGithubClient.updateFile.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await server.handleUpdateFile(params);

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
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'package.json',
                content: '{"updated": true}',
                sha: 'old-sha',
                message: 'Update file'
            };
            mockGithubClient.updateFile.mockRejectedValue('Unknown error');

            // Act
            const result = await server.handleUpdateFile(params);

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
            const mockUpdateResult: UpdateFile = {
                message: 'File updated in special repo',
                sha: 'special-repo-sha',
                content: 'Updated content'
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'repo-with-special-chars-@#$%',
                path: 'test.txt',
                content: 'Updated content',
                sha: 'old-sha',
                message: 'Update in special repo'
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(mockGithubClient.updateFile).toHaveBeenCalledWith(
                'repo-with-special-chars-@#$%',
                'test.txt',
                'Updated content',
                'old-sha',
                'Update in special repo'
            );
            expect(result.content[0].text).toContain('Updated content');
        });

        it('debería manejar rutas de archivo con caracteres especiales', async () => {
            // Arrange
            const mockUpdateResult: UpdateFile = {
                message: 'Special path file updated',
                sha: 'special-path-sha',
                content: 'Updated content'
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'folder with spaces/special@file#.txt',
                content: 'Updated content',
                sha: 'old-sha',
                message: 'Update special path file'
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(mockGithubClient.updateFile).toHaveBeenCalledWith(
                'test-repo',
                'folder with spaces/special@file#.txt',
                'Updated content',
                'old-sha',
                'Update special path file'
            );
            expect(result.content[0].text).toContain('Updated content');
        });

        it('debería manejar rutas de archivo muy largas', async () => {
            // Arrange
            const longPath = 'a'.repeat(1000) + '/file.txt';
            const mockUpdateResult: UpdateFile = {
                message: 'Long path file updated',
                sha: 'long-path-sha',
                content: 'Updated content'
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: longPath,
                content: 'Updated content',
                sha: 'old-sha',
                message: 'Update long path file'
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(mockGithubClient.updateFile).toHaveBeenCalledWith(
                'test-repo',
                longPath,
                'Updated content',
                'old-sha',
                'Update long path file'
            );
            expect(result.content[0].text).toContain('Updated content');
        });

        it('debería manejar SHA muy largos', async () => {
            // Arrange
            const longSha = 'a'.repeat(100);
            const mockUpdateResult: UpdateFile = {
                message: 'File with long SHA updated',
                sha: longSha + '-new',
                content: 'Updated content'
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'test.txt',
                content: 'Updated content',
                sha: longSha,
                message: 'Update with long SHA'
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(result.content[0].text).toContain(longSha + '-new');
        });

        it('debería manejar mensajes de commit muy largos', async () => {
            // Arrange
            const longMessage = 'A'.repeat(1000);
            const mockUpdateResult: UpdateFile = {
                message: longMessage,
                sha: 'long-message-sha',
                content: 'Updated content'
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'test.txt',
                content: 'Updated content',
                sha: 'old-sha',
                message: longMessage
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(result.content[0].text).toContain(longMessage);
        });

        it('debería manejar parámetros con valores undefined', async () => {
            // Arrange
            const mockUpdateResult: UpdateFile = {
                message: 'File updated with undefined params',
                sha: 'undefined-sha',
                content: 'Updated content'
            };
            const params = {
                repositoryName: 'test-repo',
                path: undefined,
                content: undefined,
                sha: undefined,
                message: undefined
            } as any;
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(mockGithubClient.updateFile).toHaveBeenCalledWith(
                'test-repo',
                undefined,
                undefined,
                undefined,
                undefined
            );
            expect(result.content[0].text).toContain('Updated content');
        });

        it('debería manejar contenido con caracteres Unicode', async () => {
            // Arrange
            const unicodeContent = 'Unicode content: 中文, 日本語, 한국어, العربية, русский, español';
            const mockUpdateResult: UpdateFile = {
                message: 'Unicode content updated',
                sha: 'unicode-sha',
                content: unicodeContent
            };
            const params: ToolParamsUpdateFile = {
                repositoryName: 'test-repo',
                path: 'unicode.txt',
                content: unicodeContent,
                sha: 'old-sha',
                message: 'Update Unicode content'
            };
            mockGithubClient.updateFile.mockResolvedValue(mockUpdateResult);

            // Act
            const result = await server.handleUpdateFile(params);

            // Assert
            expect(result.content[0].text).toContain('中文');
            expect(result.content[0].text).toContain('日本語');
            expect(result.content[0].text).toContain('한국어');
            expect(result.content[0].text).toContain('العربية');
            expect(result.content[0].text).toContain('русский');
            expect(result.content[0].text).toContain('español');
        });
    });
});
