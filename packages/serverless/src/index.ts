import { Application, BodyProperties, FeathersApplication, Middleware } from './declarations'
import { extractParams } from './extract-params'
import { runMiddleware } from './middleware'
import { configureAuthentication } from './authentication'
import { APIGatewayProxyResult } from 'aws-lambda'
import { routing } from '@feathersjs/transport-commons'
export * from './declarations'

export function serverless<S = any, C = any>(
  feathersApp: FeathersApplication<S, C>,
  ...middlewares: Middleware[]
): Application<S, C> {
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
  const app = feathersApp as any as Application<S, C>
  Object.assign(app, {
    set<L extends keyof C & string>(name: L, value: C[L]) {
      if (!this.variables) {
        this.variables = {}
      }

      Object.assign(this.variables, {
        [name]: value
      })

      return this
    },

    get(key: string) {
      return this.variables?.[key]
    },

    handler() {
      this.emit('handlerstarted')
      return async (event, context, cb) => {

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
  } as Application)

  app.configure(routing() as any)

  return app
}
