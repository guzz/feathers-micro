import { getService } from './get-service'
import { getFeathersMethod } from './methods'
import { getArgs } from './get-args'
import { FeathersApplication, ServerlessParams, APIGatewayProxyEvent } from './declarations'
import { AuthenticationRequest } from '@feathersjs/authentication/lib'

export const extractParams = (
  event: APIGatewayProxyEvent,
  app: FeathersApplication,
  extraParams: AuthenticationRequest = {}
): ServerlessParams => {
  const { httpMethod, body: bodyAsString, path, queryStringParameters } = event
  const parsedBody = bodyAsString ? JSON.parse(bodyAsString) : {}
  const getParamsFromBody = httpMethod === 'POST' && !!parsedBody.service && !!parsedBody.method
  const body = getParamsFromBody ? parsedBody.data : parsedBody
  const method = getParamsFromBody ? parsedBody.method : httpMethod
  const { service: serviceName, feathersId } = getParamsFromBody
    ? { service: parsedBody.service, feathersId: parsedBody.id }
    : getService(app, path)
  const query = (getParamsFromBody ? parsedBody.query : queryStringParameters) || {}
  const feathersMethod = getParamsFromBody ? method : getFeathersMethod(method, feathersId)
  const params = { headers: event.headers, ...extraParams }
  const args = getArgs(feathersMethod, { query, feathersId, body, params })
  return { body, method, serviceName, feathersId, query, args, feathersMethod, getParamsFromBody }
}
