import { LocalStrategy, hooks } from '@feathersjs/authentication-local'
import { AuthenticationService, JWTStrategy, authenticate } from '@feathersjs/authentication'
import { MemoryService, memory } from '@feathersjs/memory'
/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'mocha'
import { feathers } from '@feathersjs/feathers'

import { serverless, Application as ServerlessApplication, Middleware } from '../src'

export type Person = {
  email: string
  password: string
}

export type TestApplication = ServerlessApplication<{
  users: MemoryService<Person>
  authentication: AuthenticationService
}>

export const createTestApp = async (samplePerson: Person, middlewares?: Middleware[]) => {
  const app: TestApplication = serverless(feathers(), ...(middlewares ?? []))
  app.set('authentication', {
    entity: 'user',
    service: 'users',
    secret: 'supersecret',
    authStrategies: ['local', 'jwt'],
    parseStrategies: ['jwt'],
    local: {
      usernameField: 'email',
      passwordField: 'password'
    }
  })
  app.use('authentication', new AuthenticationService(app))
  app.use('users', memory())
  app.service('authentication').register('local', new LocalStrategy())
  app.service('authentication').register('jwt', new JWTStrategy())
  app.service('users').hooks({
    before: {
      create: [hooks.hashPassword('password')],
      get: [authenticate('jwt')]
    }
  })
  await app.service('users').create(samplePerson)
  const authResult: { accessToken?: string } = await app
    .service('authentication')
    .create({ ...samplePerson, strategy: 'local' })
  return { app, authResult }
}
