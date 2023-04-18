import { IncomingMessage, ServerResponse } from 'http'
import { AuthenticationRequest } from '@feathersjs/authentication/lib'
import { APIGatewayProxyEvent, FeathersApplication } from './declarations'

export const configureAuthentication = async (
  feathersApp: FeathersApplication,
  event: APIGatewayProxyEvent,
  authServicePath: string = 'authentication'
) => {
  const extraParams = { provider: 'rest' } as {
    authentication: AuthenticationRequest
    provider: 'rest'
  }
  const headers = { ...event.headers }
  if (headers['Authorization']) {
    headers.authorization = headers['Authorization']
  }
  const authSettings = feathersApp.get('authentication') ?? {}

  const authService = feathersApp.defaultAuthentication?.(authServicePath)

  const authStrategies =
    authSettings.strategies || authSettings.parseStrategies || authSettings.authStrategies || []

  if (authStrategies.length > 0 && authService && authSettings) {
    const authentication = await authService.parse(
      { headers } as IncomingMessage,
      {} as ServerResponse,
      ...authStrategies
    )
    extraParams.authentication = authentication
  }
  return extraParams
}
