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