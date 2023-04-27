/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'mocha'
import assert from 'assert'
import { feathers, Application as FeathersApplication, HookContext } from '@feathersjs/feathers'
import { memory, MemoryService } from '@feathersjs/memory'
import { koa, rest, bodyParser, errorHandler, cors, Application } from '@feathersjs/koa'
import { authenticate } from '@feathersjs/authentication'
import nock from 'nock'
import { matches } from 'lodash'
import axios, { AxiosError } from 'axios'

import { defaultOptions as baseOptions } from '@feathersjs/authentication/lib/options'

import { MicroAuthentication } from '../src'

const configUrl = 'http://localhost:3000'

const defaultOptions = {
  ...baseOptions,
  header: 'Authorization',
  schemes: ['Bearer', 'JWT']
}

const logoutRequest = {
  service: 'authentication',
  method: 'remove',
  data: {
    accessToken: 'accessToken',
    strategy: 'jwt'
  }
}

describe('authentication/service/paramsFromBody', () => {
  let app: FeathersApplication<{
    authentication: MicroAuthentication
    users: MemoryService
  }>

  beforeEach(() => {
    app = feathers()
    app.use(
      'authentication',
      new MicroAuthentication(app, 'authentication', {
        url: configUrl,
        getParamsFromBody: true
      })
    )
    app.use('users', memory())
  })

  it('settings returns authentication options', () => {
    assert.deepStrictEqual(
      app.service('authentication').configuration,
      Object.assign({}, defaultOptions, app.get('authentication'))
    )
  })

  it('app.defaultAuthentication()', () => {
    assert.strictEqual(app.defaultAuthentication?.(), app.service('authentication'))
    assert.throws(() => app.defaultAuthentication?.('dummy'), {
      message: "Can not find service 'dummy'"
    })
  })

  describe('create', () => {
    it('make request to microservice', async () => {
      nock(configUrl)
        .post('/')
        .reply(200, {
          user: {
            id: 123,
            name: 'Dave'
          },
          authenticated: true,
          accessToken: 'accessToken'
        })
      const service = app.service('authentication')
      const result = await service.create({
        strategy: 'first',
        username: 'David'
      })

      assert.ok(result.accessToken)
    })

    it('return error from microservice', async () => {
      nock(configUrl).post('/').reply(500, {
        error: 'Invalid Dave'
      })
      try {
        await app.service('authentication').create({
          strategy: 'first',
          username: 'Dave'
        })
        assert.fail('Should never get here')
      } catch (error: any) {
        assert.strictEqual(error.message, 'Invalid Dave')
      }
    })
  })

  describe('remove', () => {
    it('can remove with authentication strategy set', async () => {
      const requestWithNoAccessToken = {
        ...logoutRequest,
        data: {
          ...logoutRequest.data,
          accessToken: null
        }
      }
      nock(configUrl)
        .post('/', matches(requestWithNoAccessToken))
        .reply(200, function (uri, req) {
          return {
            accessToken: this.req.headers.authorization
          }
        })

      const authResult = await app.service('authentication').remove(null, {
        authentication: {
          accessToken: 'accessToken'
        }
      })
      assert.deepStrictEqual(authResult, {
        accessToken: 'accessToken'
      })
    })

    it('passes when id is set and matches accessToken', async () => {
      nock(configUrl)
        .post('/', matches(logoutRequest))
        .reply(200, function (uri, req) {
          return {
            accessToken: this.req.headers.authorization
          }
        })

      const authResult = await app.service('authentication').remove('accessToken')
      assert.deepStrictEqual(authResult, {
        accessToken: 'accessToken'
      })
    })
  })
})

describe('authentication/service/rest', () => {
  let app: FeathersApplication<{
    authentication: MicroAuthentication
    users: MemoryService
  }>

  beforeEach(() => {
    app = feathers()
    app.use(
      'authentication',
      new MicroAuthentication(app, 'authentication', {
        url: configUrl
      })
    )
    app.use('users', memory())
  })

  describe('create', () => {
    it('make request to microservice', async () => {
      nock(configUrl)
        .post('/authentication')
        .reply(200, {
          user: {
            id: 123,
            name: 'Dave'
          },
          authenticated: true,
          accessToken: 'accessToken'
        })
      const service = app.service('authentication')
      const result = await service.create({
        strategy: 'first',
        username: 'David'
      })

      assert.ok(result.accessToken)
    })

    it('return error from microservice', async () => {
      nock(configUrl).post('/authentication').reply(500, {
        error: 'Invalid Dave'
      })
      try {
        await app.service('authentication').create({
          strategy: 'first',
          username: 'Dave'
        })
        assert.fail('Should never get here')
      } catch (error: any) {
        assert.strictEqual(error.message, 'Invalid Dave')
      }
    })
  })

  describe('remove', () => {
    it('can remove with authentication strategy set', async () => {
      nock(configUrl)
        .delete('/authentication')
        .reply(200, function (uri, req) {
          return {
            accessToken: this.req.headers.authorization
          }
        })
      const authResult = await app.service('authentication').remove(null, {
        authentication: {
          accessToken: 'accessToken'
        }
      })

      assert.deepStrictEqual(authResult, {
        accessToken: 'accessToken'
      })
    })

    it('passes when id is set and matches accessToken', async () => {
      nock(configUrl)
        .delete('/authentication/accessToken')
        .reply(200, function (uri, req) {
          return {
            accessToken: this.req.headers.authorization
          }
        })
      const authResult = await app.service('authentication').remove('accessToken', {
        authentication: {
          accessToken: 'test'
        }
      })

      assert.deepStrictEqual(authResult, {
        accessToken: 'accessToken'
      })
    })
  })
})

describe('authentication/hooks', () => {
  type Person = {
    email: string
    password: string
  }

  const samplePerson: Person = {
    email: 'dave@alberto.com',
    password: '123456'
  }
  let app: Application<{
    users: MemoryService<Person>
    dummy: MemoryService
    authentication: MicroAuthentication
  }>

  app = koa(feathers())
  app.use(errorHandler())
  app.use(cors())
  app.use(bodyParser())
  app.configure(rest())
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
  app.use(
    'authentication',
    new MicroAuthentication(app, 'authentication', {
      url: configUrl
    })
  )
  app.use('users', memory())
  app.use('dummy', memory())
  app.service('dummy').hooks({
    before: {
      get: [authenticate('jwt')],
      find: [authenticate('jwt')]
    }
  })

  before(async () => {
    await app.listen(9776)
    await app.service('dummy').create({ teste: 'teste' })
  })

  after(() => app.teardown())

  it('fail authentication while not authenticated', async () => {
    try {
      await axios.get('http://localhost:9776/dummy/0')
      assert.fail('Should never get here')
    } catch (err) {
      let error = err as AxiosError<{ name?: string }>
      const feathersMessage = error.response?.data?.name
      assert.strictEqual(feathersMessage, 'NotAuthenticated')
    }
  })

  it('authenticate with good access token', async () => {
    let authToken: string | undefined
    let authStrategy: string | undefined
    nock(configUrl)
      .post('/authentication')
      .reply(200, function (uri, body: { accessToken: string; strategy: string }) {
        authToken = body?.accessToken
        authStrategy = body?.strategy
      })
    try {
      await axios.get('http://localhost:9776/dummy/0', {
        headers: {
          Authorization: 'Bearer MY_GREAT_TOKEN'
        }
      })
    } catch (err) {
      assert.fail('Should never get here')
    }
    assert.strictEqual(authToken, 'MY_GREAT_TOKEN')
    assert.strictEqual(authStrategy, 'jwt')
  })

  it('authenticate with bad access token', async () => {
    let authToken: string | undefined
    let authStrategy: string | undefined
    nock(configUrl)
      .post('/authentication')
      .reply(200, function (uri, body: { accessToken: string; strategy: string }) {
        console.log('this', this.req?.headers)
        console.log('body', body)
        authToken = body?.accessToken
        authStrategy = body?.strategy
        return {
          ble: 'hte'
        }
      })
    try {
      await axios.get('http://localhost:9776/dummy/0', {
        headers: {
          Authorization: 'PASS MY_GREAT_TOKEN'
        }
      })
      assert.fail('Should never get here')
    } catch (err) {
      let error = err as AxiosError<{ name?: string }>
      const feathersMessage = error.response?.data?.name
      assert.strictEqual(feathersMessage, 'NotAuthenticated')
    }
  })
})
