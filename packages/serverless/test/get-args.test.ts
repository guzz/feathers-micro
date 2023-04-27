import { MemoryService, memory } from '@feathersjs/memory'
/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'mocha'
import { feathers, Application } from '@feathersjs/feathers'
import assert from 'assert'

import { getArgs, GetArgsOptions } from '../src/get-args'

describe('microservice/rest', () => {
  type Person = {
    id: number
    name: string
    age: number
  }

  const sampleArgs: GetArgsOptions = {
    query: { name: 'Dave' },
    params: { headers: { Authorization: 'TOKEN' } },
    body: { age: 30 },
    feathersId: '1234'
  }

  let app: Application<{
    users: MemoryService<Person>
  }>

  app = feathers()
  app.use('users', memory())

  it('get arguments', () => {
    const args = getArgs('get', sampleArgs)
    assert.deepEqual(args, [sampleArgs.feathersId, sampleArgs.params])
  })

  it('find arguments', () => {
    const args = getArgs('find', sampleArgs)
    assert.deepEqual(args, [{ ...sampleArgs.params, query: sampleArgs.query }])
  })

  it('create arguments', () => {
    const args = getArgs('create', sampleArgs)
    assert.deepEqual(args, [sampleArgs.body, sampleArgs.params])
  })

  it('patch arguments', () => {
    const args = getArgs('patch', sampleArgs)
    assert.deepEqual(args, [
      sampleArgs.feathersId,
      sampleArgs.body,
      { ...sampleArgs.params, query: sampleArgs.query }
    ])
  })

  it('update arguments', () => {
    const args = getArgs('update', sampleArgs)
    assert.deepEqual(args, [
      sampleArgs.feathersId,
      sampleArgs.body,
      { ...sampleArgs.params, query: sampleArgs.query }
    ])
  })

  it('remove arguments', () => {
    const args = getArgs('remove', sampleArgs)
    assert.deepEqual(args, [sampleArgs.feathersId, { ...sampleArgs.params, query: sampleArgs.query }])
  })

  it('custom method arguments', () => {
    const args = getArgs('custom', sampleArgs)
    assert.deepEqual(args, undefined)
  })
})
