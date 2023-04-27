/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'mocha'
import assert from 'assert'

import { Person, createTestApp, TestApplication } from './fixtures'

import { MixinApp, ServerlessGatewayProxyEvent, APIGatewayProxyEvent, LambdaContext } from '../src'

const samplePerson: Person = {
  email: 'email@email.com',
  password: 'password'
}

const sampleEvent: ServerlessGatewayProxyEvent = {
  body: '',
  headers: {},
  httpMethod: 'POST',
  path: '',
  queryStringParameters: {},
  resource: ''
}

const createHandler = (
  app: MixinApp<TestApplication>,
  service: string,
  method: string,
  id?: number,
  body?: { [key: string]: string },
  query?: { [key: string]: string },
  authentication?: string,
  getParamsFromBody?: boolean
) => {
  const handlerEvent = {
    ...sampleEvent,
    resource: service,
    ...(authentication ? { headers: { Authorization: `Bearer ${authentication}` } } : {}),
    ...(query ? { queryStringParameters: query } : {})
  }
  const methods = {
    get: () => {
      if (getParamsFromBody) {
        return {
          ...handlerEvent,
          body: JSON.stringify({
            service,
            method,
            id
          })
        }
      } else {
        return {
          ...handlerEvent,
          httpMethod: 'GET',
          path: `/${service}/${id}`
        }
      }
    },
    find: () => {
      if (getParamsFromBody) {
        return {
          ...handlerEvent,
          body: JSON.stringify({
            service,
            method
          })
        }
      } else {
        return {
          ...handlerEvent,
          httpMethod: 'GET',
          path: `/${service}`
        }
      }
    },
    create: () => {
      if (getParamsFromBody) {
        return {
          ...handlerEvent,
          body: JSON.stringify({
            service,
            method,
            data: body
          })
        }
      } else {
        return {
          ...handlerEvent,
          httpMethod: 'POST',
          path: `/${service}`,
          body: JSON.stringify(body)
        }
      }
    },
    patch: () => {
      if (getParamsFromBody) {
        return {
          ...handlerEvent,
          body: JSON.stringify({
            service,
            method,
            id,
            data: body
          })
        }
      } else {
        return {
          ...handlerEvent,
          httpMethod: 'PATCH',
          path: `/${service}/${id}`,
          body: JSON.stringify(body)
        }
      }
    },
    update: () => {
      if (getParamsFromBody) {
        return {
          ...handlerEvent,
          body: JSON.stringify({
            service,
            method,
            id,
            data: body
          })
        }
      } else {
        return {
          ...handlerEvent,
          httpMethod: 'PUT',
          path: `/${service}/${id}`,
          body: JSON.stringify(body)
        }
      }
    },
    remove: () => {
      if (getParamsFromBody) {
        return {
          ...handlerEvent,
          body: JSON.stringify({
            service,
            method,
            id
          })
        }
      } else {
        return {
          ...handlerEvent,
          httpMethod: 'DELETE',
          path: `/${service}/${id}`
        }
      }
    },
    test: () => {
      if (getParamsFromBody) {
        return {
          ...handlerEvent,
          body: JSON.stringify({
            service,
            method,
            id,
            body
          })
        }
      } else {
        return {
          ...handlerEvent,
          httpMethod: 'OPTIONS',
          path: `/${service}`
        }
      }
    }
  }
  return (
    app
      .handler()
      // @ts-ignore
      .bind(this, methods[method]?.() as APIGatewayProxyEvent, {} as LambdaContext, (...args) => args)
  )
}

describe('serverless/handler', () => {
  let app: MixinApp<TestApplication>
  let authResult: { accessToken?: string }

  beforeEach(async () => {
    const resp = await createTestApp(samplePerson)
    app = resp.app
    authResult = resp.authResult
  })

  it('set setup func', async () => {
    // @ts-ignore
    const setup = async (...args) => args
    const newApp = await app.setup(setup)
    assert.deepEqual(newApp.setupFunc, setup)
  })

  it('get an inexistent service', async () => {
    const handler = createHandler(app, 'dummy', 'get', 0, undefined, undefined, undefined, false)
    const res: unknown = await handler()
    const response = res as [unknown, { statusCode: number; body: string }]
    assert.deepEqual(response[1].statusCode, 404)
    const body = JSON.parse(response[1].body) as unknown as { error: string }
    assert.deepEqual(body.error, 'Service not found: dummy')
  })

  it('try to execute an custom method without body params', async () => {
    const handler = createHandler(app, 'users', 'test', 0, undefined, undefined, undefined, false)
    const res: unknown = await handler()
    const response = res as [unknown, { statusCode: number; body: string }]
    assert.deepEqual(response[1].statusCode, 404)
    const body = JSON.parse(response[1].body) as unknown as { error: string }
    assert.deepEqual(body.error, 'Method not allowed: OPTIONS')
  })

  it('get user without authentication', async () => {
    const handler = createHandler(app, 'users', 'get', 0, undefined, undefined, undefined, false)
    const res: unknown = await handler()
    const response = res as [unknown, { statusCode: number; body: string }]
    assert.deepEqual(response[1].statusCode, 401)
    const body = JSON.parse(response[1].body) as unknown as { error: string }
    assert.deepEqual(body.error, 'Not authenticated')
  })

  it('get user with authentication', async () => {
    const handler = createHandler(
      app,
      'users',
      'get',
      0,
      undefined,
      undefined,
      authResult?.accessToken,
      false
    )
    const res: unknown = await handler()
    const response = res as [unknown, { statusCode: number; body: string }]
    assert.deepEqual(response[1].statusCode, 200)
    const body = JSON.parse(response[1].body) as unknown as Person
    assert.deepEqual(body.email, samplePerson.email)
  })

  it('create new user', async () => {
    const handler = createHandler(
      app,
      'users',
      'create',
      undefined,
      { email: 'other@email.com', password: 'password' },
      undefined,
      undefined,
      false
    )
    const res: unknown = await handler()
    const response = res as [unknown, { statusCode: number; body: string }]
    assert.deepEqual(response[1].statusCode, 200)
    const body = JSON.parse(response[1].body) as unknown as Person
    assert.deepEqual(body.email, 'other@email.com')
  })

  it('create new user with body params option', async () => {
    const handler = createHandler(
      app,
      'users',
      'create',
      undefined,
      { email: 'yeat_another@email.com', password: 'password' },
      undefined,
      undefined,
      true
    )
    const res: unknown = await handler()
    const response = res as [unknown, { statusCode: number; body: string }]
    assert.deepEqual(response[1].statusCode, 200)
    const body = JSON.parse(response[1].body) as unknown as Person
    assert.deepEqual(body.email, 'yeat_another@email.com')
  })
})

describe('serverless/middleware', () => {
  let app: MixinApp<TestApplication>
  let authResult: { accessToken?: string }

  beforeEach(async () => {
    const resp = await createTestApp(samplePerson, [
      async (ctx, params) => {
        params.body.email = 'teste'
      }
    ])
    app = resp.app
    authResult = resp.authResult
  })

  it('test middleware execution', async () => {
    const handler = createHandler(
      app,
      'users',
      'create',
      undefined,
      { email: 'other@email.com', password: 'password' },
      undefined,
      undefined,
      false
    )
    const res: unknown = await handler()
    const response = res as [unknown, { statusCode: number; body: string }]
    assert.deepEqual(response[1].statusCode, 200)
    const body = JSON.parse(response[1].body) as unknown as Person
    assert.deepEqual(body.email, 'teste')
  })
})

describe('serverless/middleware/error', () => {
  let app: MixinApp<TestApplication>
  let authResult: { accessToken?: string }

  beforeEach(async () => {
    // @ts-ignore
    const resp = await createTestApp(samplePerson, ['teste'])
    app = resp.app
    authResult = resp.authResult
  })

  it('test middleware execution', async () => {
    const handler = createHandler(
      app,
      'users',
      'create',
      undefined,
      { email: 'other@email.com', password: 'password' },
      undefined,
      undefined,
      false
    )
    const res: unknown = await handler()
    const response = res as [unknown, { statusCode: number; body: string }]
    assert.deepEqual(response[1].statusCode, 500)
    const body = JSON.parse(response[1].body) as unknown as { error: string }
    assert.deepEqual(body.error, 'Middleware 0 is not a function')
  })
})
