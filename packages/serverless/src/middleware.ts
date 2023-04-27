import { Middleware, ServerlessMiddlewareParams, ServerlessParams, MiddlewareResponse } from './declarations'

export const runMiddleware = async (
  context: ServerlessMiddlewareParams,
  params: ServerlessParams,
  middlewares: Middleware[]
): MiddlewareResponse => {
  for (let i = 0; middlewares.length > i; i++) {
    const middleware = middlewares[i]
    if (typeof middleware !== 'function') {
      throw {
        statusCode: 500,
        body: JSON.stringify({ error: `Middleware ${i} is not a function` })
      }
    }
    await middleware(context, params)
  }
  return params
}
