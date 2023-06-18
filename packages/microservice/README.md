This library is part of the [feathers-micro](https://github.com/guzz/feathers-micro) library.

Check the repository for a working example.

# @feathers-micro/microservice

Create services in your application that will proxy the calls to your feathers serveless applications.

It's expected that you already have a feathers serverless application configured and running to be able to use this library.

This library only support feathers koa for now, it might work with feathers express but it was not tested.

## Usage

```bash
# create a feathers application
npm create feathers@latest my-serverless-component

# install the library in your project
yarn add @feathers-micro/microservice
```

**Create a normal feathers service in your application**

```bash
npx feathers generate service
```

**Update your service with the MicroService class**

```ts

...

import { MicroService, MicroServiceOptions } from '@feathers-micro/microservice'

...

export class TodoService<ServiceParams extends Params = TodoParams> extends MicroService<
  Todo,
  TodoData,
  TodoParams,
  TodoPatch
> {}

export const getOptions = (app: Application): MicroServiceOptions => {
  return {
    path: 'todo', // service path on the serverless application
    url: 'http://localhost:3020/dev', // url of the serverless application
    getParamsFromBody: false // if you configured your serverless application as a single endpoint mark the property as true
  }
}

```

You can create resolvers and hooks as with any normal feathers service.

To check a functional setup, look at the [example apps](https://github.com/guzz/feathers-micro/tree/main/apps).

## Authentication

If you want to have your authentication as a serverless application, configure your authentication.ts file.

```ts
import { AuthenticationService } from '@feathersjs/authentication'
import { MicroAuthentication } from '@feathers-micro/microservice'

import type { Application } from './declarations'

declare module './declarations' {
  interface ServiceTypes {
    authentication: AuthenticationService
  }
}

export const authentication = (app: Application) => {
  const authentication = new MicroAuthentication(app, 'authentication', { url: 'http://localhost:3010/dev', getParamsFromBody: true })
  // @ts-ignore
  app.use('authentication', authentication)
}

```

## Session ID

When dealing with micro services logging is one of the biggest difficulties, is important to have a tracer id from one component to the other to understand the flow of each call.

To configure a session id on your service calls update your app.ts, this feature is only supported in feathers koa.

```ts
...

import { setKoaGateway } from '@feathers-micro/microservice'

...

app.configure(setKoaGateway([app.get('authentication')?.secret ?? '']))

```