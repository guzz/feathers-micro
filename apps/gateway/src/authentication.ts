// For more information about this file see https://dove.feathersjs.com/guides/cli/authentication.html
import { AuthenticationService } from '@feathersjs/authentication'
import { MicroAuthentication } from '@feathers-micro/microservice'

import type { Application } from './declarations'

declare module './declarations' {
  interface ServiceTypes {
    authentication: AuthenticationService
  }
}

export const authentication = (app: Application) => {
  const authentication = new MicroAuthentication(app, 'authentication', { url: 'http://localhost:3010/dev' })
  // @ts-ignore
  app.use('authentication', authentication)
}
