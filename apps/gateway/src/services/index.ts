import { user } from './users'
import { todo } from './todo'
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import type { Application } from '../declarations'

export const services = (app: Application) => {
  app.configure(user)
  app.configure(todo)
  // All services will be registered here
}
