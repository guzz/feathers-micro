import { randomUUID } from 'crypto'
import session from 'koa-session'
import type { Middleware, Application } from '@feathersjs/koa'

export const setKoaGateway = (keys: string | string[]) => (app: Application) => {
  app.keys = Array.isArray(keys) ? keys : [keys]
  // @ts-ignore
  app.use(session(app.get('session') ?? {}, app))
  app.use(koaSessionMiddleware)
}
export const koaSessionMiddleware: Middleware = async (ctx, next) => {
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
