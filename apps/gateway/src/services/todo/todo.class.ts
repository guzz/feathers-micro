// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MicroService, MicroServiceOptions } from '@feathers-micro/microservice'

import type { Application } from '../../declarations'
import type { Todo, TodoData, TodoPatch, TodoQuery } from 'todo-component'

export type { Todo, TodoData, TodoPatch, TodoQuery }

export interface TodoParams extends Params<TodoQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class TodoService<ServiceParams extends Params = TodoParams> extends MicroService<
  Todo,
  TodoData,
  TodoParams,
  TodoPatch
> {}

export const getOptions = (app: Application): MicroServiceOptions => {
  return {
    path: 'todo',
    url: 'http://localhost:3020/dev'
  }
}
