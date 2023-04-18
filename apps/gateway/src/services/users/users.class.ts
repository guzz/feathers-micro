// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MicroService, MicroServiceOptions } from '@feathers-micro/microservice'

import type { Application } from '../../declarations'
import type { User, UserData, UserPatch, UserQuery } from 'user-component'

export type { User, UserData, UserPatch, UserQuery }

export interface UserParams extends Params<UserQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class UserService<ServiceParams extends Params = UserParams> extends MicroService<
  User,
  UserData,
  UserParams,
  UserPatch
> {}

export const getOptions = (app: Application): MicroServiceOptions => {
  return {
    path: 'users',
    url: 'http://localhost:3010/dev',
    getParamsFromBody: true
  }
}
