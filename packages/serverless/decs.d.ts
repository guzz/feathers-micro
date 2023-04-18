declare module 'uberproto' {
  import Proto from 'uberproto'
  import { BodyProperties, FeathersApplication } from './src/serverless/types.d'
  interface ProtoType {
    mixin: (mixin: BodyProperties, feathersApp: FeathersApplication) => BodyProperties & FeathersApplication
  }
  export default Proto as ProtoType
}
