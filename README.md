# MCP DevOps

Un servidor MCP (Model Context Protocol) para operaciones de DevOps con GitHub. Este servidor permite a los modelos de IA interactuar directamente con repositorios de GitHub para automatizar tareas comunes de desarrollo y operaciones.

## 🚀 Características

- **Gestión de Repositorios**: Listar y explorar repositorios
- **Gestión de Workflows**: Monitorear, ejecutar y obtener logs de GitHub Actions
- **Manipulación de Archivos**: Leer, actualizar y crear archivos en repositorios
- **Gestión de Branches**: Crear nuevas ramas para desarrollo
- **Análisis de Logs**: Descargar y analizar logs de workflows fallidos
- **Reejecution de Workflows**: Reiniciar workflows que han fallado

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Token de acceso personal de GitHub
- Permisos de repositorio en GitHub

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd mcp-devops
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="tu_token_de_github"
```

## ⚙️ Configuración

### Token de GitHub

1. Ve a GitHub Settings > Developer settings > Personal access tokens
2. Genera un nuevo token con los siguientes permisos:
   - `repo` (acceso completo a repositorios)
   - `actions` (acceso a GitHub Actions)
   - `workflow` (actualizar workflows)

3. Configura el token como variable de entorno:
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_tu_token_aqui"
```

## 🚀 Uso

### Iniciar el servidor

```bash
npm run start
```

El servidor se conectará mediante STDIO y estará listo para recibir comandos MCP.

### Herramientas Disponibles

#### 1. **show_repositories**
Lista todos los repositorios del usuario autenticado.

```typescript
// Sin parámetros requeridos
```

#### 2. **show_workflows**
Muestra los workflows de un repositorio específico.

```typescript
{
  repositoryName: string
}
```

#### 3. **download_logs**
Descarga los logs de un workflow específico.

```typescript
{
  repositoryName: string,
  id: number
}
```

#### 4. **read_logs**
Lee el contenido de los logs descargados.

```typescript
{
  dirName: string
}
```

#### 5. **show_content_files**
Muestra el contenido de un archivo específico.

```typescript
{
  repositoryName: string,
  path: string
}
```

#### 6. **show_content_repo**
Muestra la estructura completa del repositorio.

```typescript
{
  repositoryName: string,
  nameBranch: string
}
```

#### 7. **Update file**
Actualiza el contenido de un archivo.

```typescript
{
  repositoryName: string,
  path: string,
  content: string,
  sha: string,
  message: string
}
```

#### 8. **create_branch**
Crea una nueva rama en el repositorio.

```typescript
{
  repositoryName: string,
  newBranchName: string,
  sha: string
}
```

#### 9. **rerun_workflow**
Reinicia un workflow específico.

```typescript
{
  repositoryName: string,
  id: number
}
```

#### 10. **status_workflow**
Obtiene el estado actual de un workflow.

```typescript
{
  repositoryName: string,
  id: number
}
```

## 📁 Estructura del Proyecto

```
src/
├── core/
│   ├── DevOpsMCPServer.ts    # Servidor principal MCP
│   ├── IDevOpsMCP.ts         # Interface del servidor
│   ├── server.ts             # Punto de entrada
│   └── tools.ts              # Herramientas adicionales
├── github/
│   ├── GithubAPI.ts          # Interface de la API de GitHub
│   ├── GithubClient.ts       # Cliente de GitHub
│   ├── credentialsGithub.ts  # Gestión de credenciales
│   └── utils/
│       └── downloadLogs.ts   # Utilidades para logs
└── types/
    └── types.ts              # Definiciones de tipos
```

## 🔧 Scripts Disponibles

```json
{
  "start": "node dist/core/server.js",
  "dev": "ts-node src/core/server.ts",
  "build": "tsc",
  "test": "jest"
}
```

## 📝 Ejemplos de Uso

### Listar repositorios
```bash
# El servidor MCP manejará automáticamente la llamada
show_repositories
```

### Descargar logs de un workflow fallido
```bash
# Primero obtener los workflows
show_workflows {"repositoryName": "mi-repo"}

# Luego descargar los logs del workflow específico
download_logs {"repositoryName": "mi-repo", "id": 123456789}
```

### Actualizar un archivo
```bash
# Primero obtener el contenido actual
show_content_files {"repositoryName": "mi-repo", "path": "package.json"}

# Luego actualizar con el SHA obtenido
update_file {
  "repositoryName": "mi-repo",
  "path": "package.json",
  "content": "nuevo contenido",
  "sha": "sha_del_archivo_actual",
  "message": "Actualizar package.json"
}
```

## 🛡️ Seguridad

- **Nunca commits tu token de GitHub al repositorio**
- Usa variables de entorno para configuración sensible
- Verifica los permisos del token regularmente
- Implementa validación de entrada en todas las herramientas

## 📊 Manejo de Errores

El servidor incluye manejo robusto de errores:

- Validación de parámetros de entrada
- Manejo de errores de la API de GitHub
- Logs detallados para debugging
- Respuestas consistentes en formato JSON
