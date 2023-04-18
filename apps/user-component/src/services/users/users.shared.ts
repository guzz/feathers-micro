// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { User, UserData, UserPatch, UserQuery, UserService } from './users.class'

export type { User, UserData, UserPatch, UserQuery }

export type UserClientService = Pick<UserService<Params<UserQuery>>, (typeof userMethods)[number]>

export const userPath = 'users'

export const userMethods = ['find', 'get', 'create', 'patch', 'remove'] as const
