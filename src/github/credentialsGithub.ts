import { GitHubCredentials, GitHubUser } from '@/types/types'
// Función para obtener el usuario del token
export const getCredentidalGithub = async (): Promise<GitHubCredentials> => {
  const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  if (!TOKEN) {
    throw new Error(
      'GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not configured. Please set it in your MCP client configuration.'
    )
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${TOKEN}`,
        'User-Agent': 'MCP-DevOps/1.0.0',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `GitHub API Error: ${response.status} - ${response.statusText}. ${errorText}`
      )
    }

    const user = (await response.json()) as GitHubUser

    return {
      user: user,
      token: TOKEN,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error getting GitHub user: ${error.message}`)
    }
    throw new Error('Unknown error getting GitHub user')
  }
}
