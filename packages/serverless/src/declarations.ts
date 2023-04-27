import { FeathersApplication, Query } from '@feathersjs/feathers'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  Context as LambdaContext,
  APIGatewayProxyResult,
  Callback
} from 'aws-lambda'
import { FeathersMethod, HttpMethod } from './methods'
export { FeathersApplication, Query }
export { APIGatewayProxyHandler, APIGatewayProxyEvent, LambdaContext }
export type ServerlessGatewayProxyEvent = Pick<
  APIGatewayProxyEvent,
  'httpMethod' | 'body' | 'path' | 'queryStringParameters' | 'headers' | 'resource'
>
export type Maybe<T> = T | undefined | null
export type BodyPropertiesValues =
  | string
  | number
  | boolean
  | Array<BodyPropertiesValues>
  | BodyProperties
  | ((...args: BodyPropertiesValues[]) => unknown)
export type BodyProperties = { [key: string]: BodyPropertiesValues }
type HttpMethodType = typeof HttpMethod
type HttpMethodKeys = keyof HttpMethodType
export type HttpMethodValues = (typeof HttpMethod)[HttpMethodKeys]
type FeathersMethodType = typeof FeathersMethod
type FeathersMethodKeys = keyof FeathersMethodType
export type FeathersMethodValues = (typeof FeathersMethod)[FeathersMethodKeys]
export interface ServerlessConnectorMixin {
  variables?: BodyProperties
  setupFunc: Maybe<(app: FeathersApplication) => Promise<unknown>>
  setupPromise: Maybe<Promise<unknown>>
  emit: (key: string) => void
  set: (key: string, value: BodyProperties) => FeathersApplication
  get: (key: string) => Maybe<BodyProperties[string]>
  setup: (func: Promise<unknown>) => Promise<FeathersApplication>
  handler: () => APIGatewayProxyHandler
}
export type ServerlessParams = {
  body: BodyProperties
  method: FeathersMethodValues
  serviceName: string
  feathersId: string
  query: Query
  args: unknown
  feathersMethod: FeathersMethodValues
  getParamsFromBody: boolean
}
export type MixinApp<T> = T & ServerlessConnectorMixin
export type ServerlessMiddlewareParams = {
  event: ServerlessGatewayProxyEvent
  cb: Callback<APIGatewayProxyResult>
  feathersApp: FeathersApplication
}
export type MiddlewareResponse = Promise<ServerlessParams | APIGatewayProxyResult | void>
export type Middleware = (ctx: ServerlessMiddlewareParams, params: ServerlessParams) => MiddlewareResponse
