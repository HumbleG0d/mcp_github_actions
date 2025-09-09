import { DevOpsMCPServer } from './DevOpsMCPServer'

const devOpsServer = new DevOpsMCPServer()
devOpsServer.start().catch((error) => {
  console.error('Server startup failed:', error)
  process.exit(1)
})
