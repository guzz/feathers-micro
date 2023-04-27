import { MemoryService, memory } from '@feathersjs/memory'
/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'mocha'
import { feathers, Application } from '@feathersjs/feathers'
import assert from 'assert'

import { getService } from '../src/get-service'

describe('microservice/rest', () => {
  type Person = {
    id: number
    name: string
    age: number
  }

  let app: Application<{
    users: MemoryService<Person>
  }>

  app = feathers()
  app.use('users', memory())

  it('unknown service', () => {
    const { feathersId, service } = getService(app, '/foo')
    assert.deepEqual(feathersId, null)
    assert.deepEqual(service, null)
  })

  it('users service', () => {
    const { feathersId, service } = getService(app, '/users')
    assert.deepEqual(feathersId, null)
    assert.deepEqual(service, 'users')
  })

  it('users service with id', () => {
    const { feathersId, service } = getService(app, '/users/1234')
    assert.deepEqual(feathersId, '1234')
    assert.deepEqual(service, 'users')
  })
})
