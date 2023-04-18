/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'mocha'
import assert from 'assert'
import { feathers, Application } from '@feathersjs/feathers'
import { memory, MemoryService } from '@feathersjs/memory'
import nock from 'nock'
import { matches } from 'lodash'

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
  let app: Application<{
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
      nock(configUrl).post('/', matches(requestWithNoAccessToken)).reply(200, {
        accessToken: 'accessToken'
      })
      const authResult = await app.service('authentication').remove(null)

      assert.deepStrictEqual(authResult, {
        accessToken: 'accessToken'
      })
    })

    it('passes when id is set and matches accessToken', async () => {
      nock(configUrl).post('/', matches(logoutRequest)).reply(200, {
        accessToken: 'accessToken'
      })
      const authResult = await app.service('authentication').remove('accessToken')

      assert.deepStrictEqual(authResult, {
        accessToken: 'accessToken'
      })
    })
  })
})

describe('authentication/service/rest', () => {
  let app: Application<{
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
      nock(configUrl).delete('/authentication').reply(200, {
        accessToken: 'accessToken'
      })
      const authResult = await app.service('authentication').remove(null, {
        authentication: {
          strategy: 'first',
          username: 'David',
          accessToken: 'accessToken'
        }
      })

      assert.deepStrictEqual(authResult, {
        accessToken: 'accessToken'
      })
    })

    it('passes when id is set and matches accessToken', async () => {
      nock(configUrl).delete('/authentication/accessToken').reply(200, {
        accessToken: 'test'
      })
      const authResult = await app.service('authentication').remove('accessToken', {
        authentication: {
          strategy: 'first',
          username: 'David',
          accessToken: 'test'
        }
      })

      assert.deepStrictEqual(authResult, {
        accessToken: 'test'
      })
    })
  })
})
