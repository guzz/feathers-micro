// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { serverless } from '@feathers-micro/serverless'

import { configurationValidator } from './configuration'
import type { Application } from './declarations'
import { authentication } from './authentication'
import { logError } from './hooks/log-error'
import { sqlite } from './sqlite'
import { services } from './services/index'

const app: Application = serverless(feathers(), async (ctx, params) => {
  console.log('UserComponentLog: ', {
    ...params,
    sessionId: ctx.event.headers['Session-Id']
  })
})

// Load our app configuration (see config/ folder)
app.configure(configuration(configurationValidator))

app.configure(sqlite)
app.configure(services)
app.configure(authentication)

// Register hooks that run on all service methods
app.hooks({
  around: {
    all: [logError]
  },
  before: {},
  after: {},
  error: {}
})
// Register application setup and teardown hooks here
app.hooks({
  setup: [],
  teardown: []
})

export { app }
