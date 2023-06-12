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

**Update your app.ts**

```js
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { serverless } from '@feathers-micro/serverless'

...
// configure your serverless handler
const app: Application = serverless(feathers(),
// add your middlewares
async (ctx, params) => {
  console.log('TodoComponentLog: ', {
    ...params,
    sessionId: ctx.event.headers['Session-Id']
  })
})
...

```

