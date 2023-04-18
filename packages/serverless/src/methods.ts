import { HttpMethodValues, Maybe } from './declarations'

export const FeathersMethod = {
  FIND: 'find',
  GET: 'get',
  CREATE: 'create',
  UPDATE: 'update',
  PATCH: 'patch',
  REMOVE: 'remove'
} as const

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const

export function getFeathersMethod(httpMethod: HttpMethodValues, feathersId: Maybe<string>) {
  if (httpMethod === HttpMethod.GET) {
    return feathersId ? FeathersMethod.GET : FeathersMethod.FIND
  }

  return {
    [HttpMethod.POST]: FeathersMethod.CREATE,
    [HttpMethod.PUT]: FeathersMethod.UPDATE,
    [HttpMethod.PATCH]: FeathersMethod.PATCH,
    [HttpMethod.DELETE]: FeathersMethod.REMOVE
  }[httpMethod]
}
