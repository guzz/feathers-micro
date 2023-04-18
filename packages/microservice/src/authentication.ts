import { AuthenticationRequest } from '@feathersjs/authentication'
import { Application, Params } from '@feathersjs/feathers'
import {
  AuthenticationService,
  AuthenticationStrategy,
  ConnectionEvent,
  AuthenticationResult
} from '@feathersjs/authentication'
import { SignOptions, Secret, VerifyOptions } from 'jsonwebtoken'
import { IncomingMessage, ServerResponse } from 'http'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

export interface MicroAuthenticationRequest {
  [key: string]: any
}

export type MicroAuthenticationOptions = {
  url: string
  getParamsFromBody?: boolean
}

const SPLIT_HEADER = /(\S+)\s+(\S+)/

export class MicroAuthentication extends AuthenticationService {
  fetch: AxiosInstance
  getParamsFromBody: boolean

  constructor(app: Application, configKey = 'authentication', options: MicroAuthenticationOptions) {
    const { url, getParamsFromBody } = options
    if (!url) {
      throw new Error('Url for microservice not provided')
    }
    super(app, configKey, options)
    this.getParamsFromBody = !!options.getParamsFromBody
    this.fetch = axios.create({
      baseURL: getParamsFromBody ? url : `${url}/${configKey}`,
      withCredentials: true
    })
  }

  get configuration() {
    return {
      ...super.configuration,
      header: 'Authorization',
      schemes: ['Bearer', 'JWT']
    }
  }

  get strategyNames() {
    return super.strategyNames
  }

  register(name: string, strategy: AuthenticationStrategy) {
    super.register(name, strategy)
  }

  getStrategies(...names: string[]) {
    return super.getStrategies(...names)
  }

  getStrategy(name: string) {
    return super.getStrategy(name)
  }

  async createAccessToken(
    payload: string | Buffer | object,
    optsOverride?: SignOptions,
    secretOverride?: Secret
  ) {
    return super.createAccessToken(payload, optsOverride, secretOverride)
  }

  async verifyAccessToken(accessToken: string, optsOverride?: VerifyOptions, secretOverride?: Secret) {
    return super.verifyAccessToken(accessToken, optsOverride, secretOverride)
  }

  async handleConnection(event: ConnectionEvent, connection: any, authResult?: AuthenticationResult) {
    return super.handleConnection(event, connection, authResult)
  }

  async parse(req: IncomingMessage, res: ServerResponse, ...names: string[]) {
    const { header, schemes }: { header: string; schemes: string[] } = this.configuration
    const headerValue = req.headers && req.headers[header.toLowerCase()]

    if (!headerValue || typeof headerValue !== 'string') {
      return super.parse(req, res, ...names)
    }

    const [, scheme, schemeValue] = headerValue.match(SPLIT_HEADER) || []
    const hasScheme = scheme && schemes.some((current) => new RegExp(current, 'i').test(scheme))

    if (scheme && !hasScheme) {
      return super.parse(req, res, ...names)
    }

    return {
      strategy: 'jwt',
      accessToken: hasScheme ? schemeValue : headerValue
    } as AuthenticationRequest
  }

  async setup() {
    return super.setup()
  }

  getAxiosRequestParams(
    type: 'login' | 'logout',
    data: MicroAuthenticationRequest,
    params?: Params,
    id?: string | null
  ): AxiosRequestConfig {
    const paramsForPost = {
      service: this.configKey,
      method: type === 'login' ? 'create' : 'remove',
      data: type === 'login' ? data : { accessToken: id, strategy: 'jwt' }
    }
    return {
      method: this.getParamsFromBody || type === 'login' ? 'post' : 'delete',
      data: this.getParamsFromBody ? paramsForPost : type === 'login' ? data : undefined,
      url: !this.getParamsFromBody && type === 'logout' ? `${id ? '/' + id : ''}` : undefined,
      headers: {
        ...(params?.headers ?? {})
      }
    }
  }

  async makeRequest(config: AxiosRequestConfig) {
    try {
      const { data } = await this.fetch(config)
      return data
    } catch (err) {
      const error = err as AxiosError<{ error: string }>
      let message = error.response?.data?.error ?? error.message
      throw new Error(message)
    }
  }

  async authenticate(authentication: MicroAuthenticationRequest) {
    return this.makeRequest(this.getAxiosRequestParams('login', authentication))
  }

  async create(data: MicroAuthenticationRequest, params?: Params) {
    return this.authenticate(data)
  }

  async remove(id: string | null, params?: Params) {
    return this.makeRequest(this.getAxiosRequestParams('logout', {}, params, id))
  }
}
