import { GithubClient } from '../../src/github/GithubClient'
import { getCredentidalGithub } from '../../src/github/credentialsGithub'

//Mockeamos getCredentialGithub()
jest.mock('../../src/github/credentialsGithub', () => ({
  getCredentidalGithub: jest.fn(),
}))

//Mock global
global.fetch = jest.fn()
// Reeplazamos la funcion fetch por un mock
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>

// Limpiar mocks antes de cada test
beforeEach(() => {
  jest.clearAllMocks()
})

//Test1

it('inicializamos con un token y user', async () => {
  //Arrange - configuracion
  ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
    user: { login: 'sergio' },
    token: 'token-test',
  })

  //Si mulamos la respuesta al llamar a getAllRepos
  mockedFetch.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => [],
  } as any)

  //Act - Ejecucion
  const client = new GithubClient()

  //Si se inicio correctamente , initialize no debe retonarnar nada , ese decir undefined
  await expect(client.initialize()).resolves.toBeUndefined()

  //Si se inicio correctament , podemos llamar a un metodo de cleinte
  await expect(client.getAllRepos()).resolves.toEqual([])

  //Assert - verificacion
  // Verifiquemos que client solo se ah llamado una vez
  expect(getCredentidalGithub).toHaveBeenCalledTimes(1)

  //Verficamos la respuesta
  expect(mockedFetch).toHaveBeenCalledTimes(1)
})

//Test 2
it('indempotente: multiples llamadas no reeleen las credenciales', async () => {
  //Arrange - configuracion
  ;(getCredentidalGithub as jest.Mock).mockResolvedValue({
    user: {
      login: 'sergio',
    },
    token: 'test-token',
  })

  //Act - Ejecucuion
  const client = new GithubClient()

  await client.initialize()
  await client.initialize()

  //Assert - verificacion
  expect(getCredentidalGithub).toHaveBeenCalledTimes(1)
})

//Test3
it('lanza error cuando falla la carga de las credenciales', async () => {
  //Arrange - configuracion
  ;(getCredentidalGithub as jest.Mock).mockRejectedValue(
    new Error('Error al cargar las credenciales')
  )

  const client = new GithubClient()

  await expect(client.initialize()).rejects.toThrow(
    'Failed to initialize GitHub client'
  )
})
