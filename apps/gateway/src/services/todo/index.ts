// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { MicroService } from '@feathers-micro/microservice'
import { hooks as schemaHooks } from '@feathersjs/schema'

import type { Application, HookContext } from '../../declarations'
import { TodoService, getOptions } from './todo.class'
import { todoResultResolver, todoCreateDataResolver } from './todo.resolvers'
import { todoPath, todoMethods } from 'todo-component'
import { authenticate } from '@feathersjs/authentication'

export * from './todo.class'

const onlyOwner = async (context: HookContext) => {
  const { id, params, app } = context
  if (!id) {
    throw new Error('No ID?! hummmmm...')
  }
  const { user } = params
  const todo = await app.service('todo').get(id)
  if (user?.id !== todo.userId) {
    throw new Error("Can't touch this")
  }
}

// A configure function that registers the service and its hooks via `app.configure`
export const todo = (app: Application) => {
  // Register our service on the Feathers application
  app.use(todoPath, new MicroService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: todoMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(todoPath).hooks({
    around: {
      all: [schemaHooks.resolveResult(todoResultResolver)],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },
    before: {
      all: [],
      find: [],
      get: [],
      create: [authenticate('jwt'), schemaHooks.resolveData(todoCreateDataResolver)],
      patch: [authenticate('jwt'), onlyOwner],
      remove: [authenticate('jwt'), onlyOwner]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [todoPath]: TodoService
  }
}
