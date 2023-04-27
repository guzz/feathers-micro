/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'mocha'
import assert from 'assert'
import { feathers, Application as FeathersApplication } from '@feathersjs/feathers'
import nock from 'nock'
import { matches } from 'lodash'
import { koa, rest, bodyParser, errorHandler, cors, Application } from '@feathersjs/koa'
import axios from 'axios'

import { MicroService, setKoaGateway } from '../src'

const configUrl = 'http://localhost:3000'

describe('microservice/paramsFromBody', () => {
  type Person = {
    id: number
    name: string
    age: number
  }

  const samplePerson: Person = {
    id: 0,
    name: 'Dave',
    age: 30
  }
  let app: Application<{
    users: MicroService<Person>
  }>
  let sessionId: string

  app = koa(feathers())
  app.use(errorHandler())
  app.use(cors())
  app.use(bodyParser())
  app.configure(setKoaGateway([app.get('authentication')?.secret ?? '']))
  app.configure(rest())
  app.use('users', new MicroService<Person>({ url: configUrl, path: 'users', getParamsFromBody: true }))
  app.service('users').hooks({
    before: {
      get: [
        (context) => {
          const { params } = context
          sessionId = params.sessionId ?? ''
        }
      ]
    }
  })

  before(async () => {
    await app.listen(9776)
  })

  after(() => app.teardown())

  it('service get', async () => {
    const request = {
      method: 'get',
      service: 'users',
      data: {},
      id: 0
    }
    nock(configUrl).post('/', matches(request)).reply(200, samplePerson)
    const user = await app.service('users').get(0)
    assert.deepEqual(samplePerson, user)
  })

  it('service find', async () => {
    const request = {
      method: 'find',
      service: 'users',
      query: { name: 'Dave' }
    }
    nock(configUrl).post('/', matches(request)).reply(200, samplePerson)
    const user = await app.service('users').find({ query: request.query })
    assert.deepEqual(samplePerson, user)
  })

  it('service create', async () => {
    const request = {
      method: 'create',
      service: 'users',
      data: samplePerson
    }
    nock(configUrl).post('/', matches(request)).reply(200, samplePerson)
    const user = await app.service('users').create(samplePerson)
    assert.deepEqual(samplePerson, user)
  })

  it('service patch', async () => {
    const request = {
      method: 'patch',
      service: 'users',
      data: samplePerson,
      id: 0
    }
    nock(configUrl).post('/', matches(request)).reply(200, samplePerson)
    const user = await app.service('users').patch(0, samplePerson)
    assert.deepEqual(samplePerson, user)
  })

  it('service update', async () => {
    const request = {
      method: 'update',
      service: 'users',
      data: samplePerson,
      id: 0
    }
    nock(configUrl).post('/', matches(request)).reply(200, samplePerson)
    const user = await app.service('users').update(0, samplePerson)
    assert.deepEqual(samplePerson, user)
  })

  it('service remove', async () => {
    const request = {
      method: 'remove',
      service: 'users',
      id: 0
    }
    nock(configUrl).post('/', matches(request)).reply(200, samplePerson)
    const user = await app.service('users').remove(0)
    assert.deepEqual(samplePerson, user)
  })

  it('service custom', async () => {
    const request = {
      method: 'my-method',
      data: {
        any: 'Data'
      }
    }
    nock(configUrl).post('/', matches(request)).reply(200, request)
    const user = await app.service('users').custom(request)
    assert.deepEqual(request, user)
  })

  it('send headers', async () => {
    nock(configUrl)
      .post('/')
      .reply(200, function () {
        if (this.req.headers.authorization === 'accessToken') {
          return samplePerson
        } else {
          return { success: false }
        }
      })
    const user = await app.service('users').get(0, { headers: { authorization: 'accessToken' } })
    assert.deepEqual(samplePerson, user)
  })

  it('send session id', async () => {
    nock(configUrl)
      .post('/')
      .reply(200, function () {
        if (this.req.headers['session-id'] === '1234') {
          return samplePerson
        } else {
          return { success: false }
        }
      })
    const user = await app.service('users').get(0, { sessionId: '1234' })
    assert.deepEqual(samplePerson, user)
  })

  it('default session id', async () => {
    nock(configUrl)
      .post('/')
      .reply(200, function () {
        if (this.req.headers['session-id']) {
          return this.req.headers['session-id']
        } else {
          return { success: false }
        }
      })
    const { data: userSessionId } = await axios.get('http://localhost:9776/users/0')
    assert.deepEqual(userSessionId, sessionId)
  })

  it('return error', async () => {
    const sampleError = {
      message: 'Not found',
      code: 404
    }
    nock(configUrl).post('/').replyWithError(sampleError)
    try {
      await app.service('users').get(0, { sessionId: '1234' })
    } catch (err) {
      const error = err as { message: string }
      assert.deepEqual(sampleError.message, error.message)
    }
  })
})

describe('microservice/rest', () => {
  type Person = {
    id: number
    name: string
    age: number
  }

  const samplePerson: Person = {
    id: 0,
    name: 'Dave',
    age: 30
  }
  let app: FeathersApplication<{
    users: MicroService<Person>
  }>

  app = feathers()
  app.use('users', new MicroService<Person>({ url: configUrl, path: 'users' }))

  it('service get', async () => {
    nock(configUrl).get('/users/0').reply(200, samplePerson)
    const user = await app.service('users').get(0)
    assert.deepEqual(samplePerson, user)
  })

  it('service find', async () => {
    nock(configUrl).get('/users?name=Dave').reply(200, samplePerson)
    const user = await app.service('users').find({ query: { name: 'Dave' } })
    assert.deepEqual(samplePerson, user)
  })

  it('service create', async () => {
    nock(configUrl).post('/users', matches(samplePerson)).reply(200, samplePerson)
    const user = await app.service('users').create(samplePerson)
    assert.deepEqual(samplePerson, user)
  })

  it('service patch', async () => {
    nock(configUrl).patch('/users/0', matches(samplePerson)).reply(200, samplePerson)
    const user = await app.service('users').patch(0, samplePerson)
    assert.deepEqual(samplePerson, user)
  })

  it('service update', async () => {
    nock(configUrl).put('/users/0', matches(samplePerson)).reply(200, samplePerson)
    const user = await app.service('users').update(0, samplePerson)
    assert.deepEqual(samplePerson, user)
  })

  it('service remove', async () => {
    nock(configUrl).delete('/users/0').reply(200, samplePerson)
    const user = await app.service('users').remove(0)
    assert.deepEqual(samplePerson, user)
  })
})
