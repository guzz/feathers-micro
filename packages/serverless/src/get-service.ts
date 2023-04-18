import { FeathersApplication, Maybe } from './declarations'

// encapsulates the logic to decide the service and feathersId
export function getService(
  feathersApp: FeathersApplication,
  path: string
): { service: Maybe<string>; feathersId: Maybe<string> } {
  const pathArray = path
    .replace(/^\//, '') // removes the first / character
    .split(/\//g)

  let feathersId = null
  let service: Maybe<string> = pathArray.join('/')
  try {
    feathersApp.service(service)
  } catch (e) {
    feathersId = pathArray.pop()
    service = pathArray.join('/')
  }

  try {
    feathersApp.service(service)
  } catch (e) {
    service = null
    feathersId = null
  }

  return { service, feathersId }
}
