import { FeathersMethod } from './methods'
import { BodyProperties, FeathersMethodValues, Maybe, Query } from './declarations'

type GetArgsOptions = {
  query?: Query
  feathersId?: Maybe<string>
  body?: BodyProperties | BodyProperties[]
  params?: { [key: string]: unknown }
}

export function getArgs(
  feathersMethod: FeathersMethodValues,
  { query, feathersId, body, params = {} }: GetArgsOptions
): unknown {
  return {
    [FeathersMethod.FIND]: [{ ...params, query }],
    [FeathersMethod.GET]: [feathersId, params],
    [FeathersMethod.CREATE]: [body, params],
    [FeathersMethod.UPDATE]: [feathersId || null, body, { ...params, query }],
    [FeathersMethod.PATCH]: [feathersId || null, body, { ...params, query }],
    [FeathersMethod.REMOVE]: [feathersId || null, { ...params, query }]
  }[feathersMethod]
}
