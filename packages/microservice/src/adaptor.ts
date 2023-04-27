import { _ } from '@feathersjs/commons'
import {
  AdapterBase,
  AdapterServiceOptions,
  PaginationOptions,
  AdapterParams
} from '@feathersjs/adapter-commons'
import { NullableId, Id, Params, Paginated } from '@feathersjs/feathers'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

export interface MicroServiceOptions extends AdapterServiceOptions {
  url: string
  path: string
  getParamsFromBody?: boolean
}

export type CustomParams = {
  data: { [key: string]: unknown } | { [key: string]: unknown }[]
  method: string
}

export class MicroAdapter<
  Result = any,
  Data = Partial<Result>,
  ServiceParams extends Params = Params,
  PatchData = Partial<Data>
> extends AdapterBase<Result, Data, PatchData, ServiceParams, MicroServiceOptions> {
  fetch: AxiosInstance
  constructor(options: MicroServiceOptions) {
    super({
      ...options,
      url: options.getParamsFromBody ? '/' : `/${options.path}`
    })
    this.fetch = axios.create({
      baseURL: options.url,
      withCredentials: true
    })
  }

  getBodyParams(
    method: string,
    params: ServiceParams,
    data?:
      | Partial<Data>
      | Partial<Data>[]
      | PatchData
      | { [key: string]: unknown }
      | { [key: string]: unknown }[],
    id?: NullableId
  ) {
    const { path } = this.getOptions(params)
    const { query } = params
    return {
      query,
      method,
      service: path,
      data,
      id
    }
  }

  getHeaders(params: ServiceParams) {
    const { headers } = params
    return {
      Cookie: headers?.cookie,
      Authorization: headers?.authorization || headers?.Authorization,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      'Session-Id': params.sessionId
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

  async _find(_params?: ServiceParams & { paginate?: PaginationOptions }): Promise<Paginated<Result>>
  async _find(_params?: ServiceParams & { paginate: false }): Promise<Result[]>
  async _find(_params?: ServiceParams): Promise<Paginated<Result> | Result[]>
  async _find(params: ServiceParams = {} as ServiceParams): Promise<Paginated<Result> | Result[]> {
    const { url, getParamsFromBody } = this.getOptions(params)
    const { query } = params
    const bodyParams = this.getBodyParams('find', params)
    return this.makeRequest({
      url,
      method: getParamsFromBody ? 'post' : 'get',
      params: getParamsFromBody ? undefined : query,
      data: getParamsFromBody ? bodyParams : undefined,
      headers: this.getHeaders(params)
    })
  }

  async _get(id: Id, params: ServiceParams = {} as ServiceParams): Promise<Result> {
    const { url, getParamsFromBody } = this.getOptions(params)
    const bodyParams = this.getBodyParams('get', params, {}, id)
    return this.makeRequest({
      url: getParamsFromBody ? url : `${url}/${id}`,
      method: getParamsFromBody ? 'post' : 'get',
      data: getParamsFromBody ? bodyParams : undefined,
      headers: this.getHeaders(params)
    })
  }

  async _create(data: Partial<Data>, params?: ServiceParams): Promise<Result>
  async _create(data: Partial<Data>[], params?: ServiceParams): Promise<Result[]>
  async _create(data: Partial<Data> | Partial<Data>[], _params?: ServiceParams): Promise<Result | Result[]>
  async _create(
    data: Partial<Data> | Partial<Data>[],
    params: ServiceParams = {} as ServiceParams
  ): Promise<Result | Result[]> {
    const { url, getParamsFromBody } = this.getOptions(params)
    const { query } = params
    const bodyParams = this.getBodyParams('create', params, data)
    return this.makeRequest({
      url,
      method: 'post',
      params: getParamsFromBody ? undefined : query,
      data: getParamsFromBody ? bodyParams : data,
      headers: this.getHeaders(params)
    })
  }

  async _update(id: Id, data: Data, params: ServiceParams = {} as ServiceParams): Promise<Result> {
    const { url, getParamsFromBody } = this.getOptions(params)
    const { query } = params
    const bodyParams = this.getBodyParams('update', params, data, id)
    return this.makeRequest({
      url: getParamsFromBody ? url : `${url}/${id}`,
      method: getParamsFromBody ? 'post' : 'put',
      params: getParamsFromBody ? undefined : query,
      data: getParamsFromBody ? bodyParams : data,
      headers: this.getHeaders(params)
    })
  }

  async _patch(id: null, data: PatchData, params?: ServiceParams): Promise<Result[]>
  async _patch(id: Id, data: PatchData, params?: ServiceParams): Promise<Result>
  async _patch(id: NullableId, data: PatchData, _params?: ServiceParams): Promise<Result | Result[]>
  async _patch(
    id: NullableId,
    data: PatchData,
    params: ServiceParams = {} as ServiceParams
  ): Promise<Result | Result[]> {
    const { url, getParamsFromBody } = this.getOptions(params)
    const { query } = params
    const bodyParams = this.getBodyParams('patch', params, data, id)
    return this.makeRequest({
      url: getParamsFromBody ? url : `${url}/${id}`,
      method: getParamsFromBody ? 'post' : 'patch',
      params: getParamsFromBody ? undefined : query,
      data: getParamsFromBody ? bodyParams : data,
      headers: this.getHeaders(params)
    })
  }

  async _remove(id: null, params?: ServiceParams): Promise<Result[]>
  async _remove(id: Id, params?: ServiceParams): Promise<Result>
  async _remove(id: NullableId, _params?: ServiceParams): Promise<Result | Result[]>
  async _remove(id: NullableId, params: ServiceParams = {} as ServiceParams): Promise<Result | Result[]> {
    const { url, getParamsFromBody } = this.getOptions(params)
    const { query } = params
    const bodyParams = this.getBodyParams('remove', params, {}, id)
    return this.makeRequest({
      url: getParamsFromBody ? url : `${url}/${id}`,
      method: getParamsFromBody ? 'post' : 'delete',
      params: getParamsFromBody ? undefined : query,
      data: getParamsFromBody ? bodyParams : undefined,
      headers: this.getHeaders(params)
    })
  }

  async _custom(args: CustomParams, params?: ServiceParams): Promise<Result>
  async _custom(args: CustomParams, params: ServiceParams = {} as ServiceParams): Promise<Result | Result[]> {
    const { data, method } = args
    const { url } = this.getOptions(params)
    const bodyParams = this.getBodyParams(method, params, data)
    return this.makeRequest({
      url,
      method: 'post',
      data: bodyParams,
      headers: this.getHeaders(params)
    })
  }
}

export class MicroService<
  Result = any,
  Data = Partial<Result>,
  ServiceParams extends Params<any> = AdapterParams,
  PatchData = Partial<Data>
> extends MicroAdapter<Result, Data, ServiceParams, PatchData> {
  async find(params?: ServiceParams & { paginate?: PaginationOptions }): Promise<Paginated<Result>>
  async find(params?: ServiceParams & { paginate: false }): Promise<Result[]>
  async find(params?: ServiceParams): Promise<Paginated<Result> | Result[]>
  async find(params?: ServiceParams): Promise<Paginated<Result> | Result[]> {
    const query = await this.sanitizeQuery(params)
    const mergedParams = Object.assign({}, params, query)
    return this._find(mergedParams)
  }

  async get(id: Id, params?: ServiceParams): Promise<Result> {
    const query = await this.sanitizeQuery(params)
    const mergedParams = Object.assign({}, params, query)
    return this._get(id, mergedParams)
  }

  async create(data: Data, params?: ServiceParams): Promise<Result>
  async create(data: Data[], params?: ServiceParams): Promise<Result[]>
  async create(data: Data | Data[], params?: ServiceParams): Promise<Result | Result[]> {
    return this._create(data, params)
  }

  async update(id: Id, data: Data, params?: ServiceParams): Promise<Result> {
    const query = await this.sanitizeQuery(params)
    const mergedParams = Object.assign({}, params, query)
    return this._update(id, data, mergedParams)
  }

  async patch(id: Id, data: PatchData, params?: ServiceParams): Promise<Result>
  async patch(id: null, data: PatchData, params?: ServiceParams): Promise<Result[]>
  async patch(id: NullableId, data: PatchData, params?: ServiceParams): Promise<Result | Result[]> {
    const { $limit, ...query } = await this.sanitizeQuery(params)
    const mergedParams = Object.assign({}, params, query)

    return this._patch(id, data, mergedParams)
  }

  async remove(id: Id, params?: ServiceParams): Promise<Result>
  async remove(id: null, params?: ServiceParams): Promise<Result[]>
  async remove(id: NullableId, params?: ServiceParams): Promise<Result | Result[]> {
    const { $limit, ...query } = await this.sanitizeQuery(params)
    const mergedParams = Object.assign({}, params, query)

    return this._remove(id, mergedParams)
  }

  async custom(args: CustomParams, params?: ServiceParams): Promise<Result | Result[]> {
    return this._custom(args, params)
  }
}
