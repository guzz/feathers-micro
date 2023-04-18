import { randomUUID } from 'crypto'
import session from 'koa-session'
import type { Middleware, Application, Koa } from '@feathersjs/koa'

export const setGateway = (keys: string | string[]) => (app: Application) => {
  app.keys = Array.isArray(keys) ? keys : [keys]
  // @ts-ignore
  app.use(session(app.get('session') ?? {}, app))
  app.use(sessionMiddleware)
}
export const sessionMiddleware: Middleware = async (ctx, next) => {
  if (ctx.session && !ctx.session.id) {
    const id = randomUUID()
    ctx.session.id = id
  }
  ctx.feathers = {
    ...ctx.feathers,
    sessionId: ctx?.session?.id
  }
  await next()
}

declare module '@feathersjs/feathers' {
  interface Params {
    sessionId?: string
  }
}
