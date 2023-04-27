import Proto from 'uberproto'

import { BodyProperties, MixinApp, FeathersApplication, Middleware } from './declarations'
import { extractParams } from './extract-params'
import { runMiddleware } from './middleware'
import { configureAuthentication } from './authentication'
import { APIGatewayProxyResult } from 'aws-lambda'
export * from './declarations'

export const serverless = (feathersApp: FeathersApplication, ...middlewares: Middleware[]) => {
  feathersApp.hooks({
    around: {
      all: [
        async (ctx, next) => {
          await next()
          if (ctx.params.provider) {
            ctx.result = ctx.dispatch ?? ctx.result
          }
        }
      ]
    }
  })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const mixin: MixinApp<FeathersApplication> = {
    set(key: string, value: BodyProperties) {
      if (!this.variables) {
        this.variables = {}
      }

      Object.assign(this.variables, {
        [key]: value
      })

      return this
    },

    get(key: string) {
      return this.variables?.[key]
    },

    async setup(func) {
      this.setupFunc = func
      return this
    },

    handler() {
      this.emit('handlerstarted')
      return async (event, context, cb) => {
        if (!this.setupPromise) {
          this.setupPromise = typeof this.setupFunc === 'function' ? this.setupFunc(this) : Promise.resolve()
        }

        await this.setupPromise

        const extraParams = await configureAuthentication(feathersApp, event)

        const { resource } = event

        const middlewareContext = {
          event,
          cb,
          feathersApp
        }

        const params = extractParams(event, feathersApp, extraParams)

        try {
          await runMiddleware(middlewareContext, params, middlewares)
        } catch (err) {
          return cb(null, err as APIGatewayProxyResult)
        }

        const { serviceName, method, args, feathersMethod, getParamsFromBody, body, query } = params

        if (!serviceName || !this.service(serviceName)) {
          return cb(null, {
            statusCode: 404,
            body: JSON.stringify({ error: `Service not found: ${resource}` })
          })
        }

        const service = this.service(serviceName)

        if ((!feathersMethod && !getParamsFromBody) || !service[feathersMethod]) {
          return cb(null, {
            statusCode: 404,
            body: JSON.stringify({ error: `Method not allowed: ${method}` })
          })
        }

        const fallbackArgs = args ?? [{ ...body, ...query }, params]

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return service[feathersMethod](...fallbackArgs)
          .then((data: BodyProperties) => {
            return cb(null, {
              statusCode: 200,
              body: JSON.stringify(data)
            })
          })
          .catch((e: { code: number; message: string }) => {
            return cb(null, {
              statusCode: e.code || 500,
              body: JSON.stringify({ error: e.message })
            })
          })
      }
    }
  }

  return Proto.mixin(mixin, feathersApp)
}
