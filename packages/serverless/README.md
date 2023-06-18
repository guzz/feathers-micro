This library is part of the [feathers-micro](https://github.com/guzz/feathers-micro) library.

Check the repository for a working example.

# @feathers-micro/serverless

## Usage

```bash
# create a feathers application
npm create feathers@latest my-serverless-component

# install the library in your project
yarn add @feathers-micro/serverless
```

**Update your app.ts and declarations.ts**

```js
// ./src/app.ts
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { serverless } from '@feathers-micro/serverless'
import type { Application } from './declarations'

...
// configure your serverless handler
const app: Application = serverless(feathers(),
// add your middlewares
// these are not feathers middlewares, they receive the context from the serverless function
async (ctx, params) => {
  console.log('TodoComponentLog: ', {
    ...params,
    sessionId: ctx.event.headers['Session-Id']
  })
})
...

// ./src/declarations.ts
...

import { Application as ServerlessApplication } from '@feathers-micro/serverless'

...

// The application instance type that will be used everywhere else
export type Application = ServerlessApplication<ServiceTypes, Configuration>
...

```

**Install serveless in yor application**

```bash
yarn add -D serverless serverless-offline
```

The `serverless-offline` library is used to run your application on your local environment, to know more check the [documentation](https://www.serverless.com/plugins/serverless-offline).

**Create a serverless.yml in the root of your application**

You can configure your application in 2 different ways, having a endpoint for each feathers method or with just one endpoint and passing the parameters needed in the payload.

You can find an example on how to configure it in the example apps:

- [todo-component](https://github.com/guzz/feathers-micro/blob/main/apps/todo-component/serverless.yml): Multiple endpoints
- [user-component](https://github.com/guzz/feathers-micro/blob/main/apps/user-component/serverless.yml): Single endpoint

Payload example for the single endpoint configuration:

```js
const payload = {
  query: {}, // feathers query
  method: 'create', // feathers method
  service: 'todo', // feathers service
  data: {}, // body data
  id: 2 // feathers id (for 'get', 'patch', 'update' and 'delete')
}
```

**Create new scripts on to your package.json**

The bellow scripts are using [npm-run-all](https://www.npmjs.com/package/npm-run-all) to execute multiple scripts at once or you can just use the `sls-offline` script directly and run the tsc build manually.

```json
{
  "scripts": {
    "sls-offline": "sls offline",
    "watch": "tsc --watch",
    "dev": "run-p watch sls-offline",
  }
}
```