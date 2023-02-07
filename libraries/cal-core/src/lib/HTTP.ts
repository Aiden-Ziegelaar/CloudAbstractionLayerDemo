import { ParsedQs } from "qs";
import { BaseClass } from "./base";

export enum HTTPMethods {
  'OPTIONS',
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'TRACE',
  'CONNECT'
}

export interface HTTPIntegrationRequest<T> extends BaseClass<T> {
  baseUrl: string;
  body?: object;
  cookies?: Record<string, string|string[]>;
  host?: string;
  hostname?: string;
  ip: string;
  ips: string[];
  method?: HTTPMethods | string;
  params?: Record<string, string|undefined>;
  path: string;
  protocol?: string;
  query?: Record<string, string | string[] | ParsedQs | ParsedQs[] | undefined>;
  secure: boolean;
  subdomains?: string[];
  xhr: boolean;
  headers: Record<string, string|string[]|undefined>;
  traceId?: string;

  get( header:string ): string | string[] | undefined;
}

export interface HTTPIntegrationResponse<T> extends BaseClass<T> {
  set( header:string, value:string|string[] ): void
  status( statusCode:number ): void
  send( body:string ): void
  json( body:object ): void
}

export class HTTPError extends Error {
  public userMessage: string;
  public status: number;
  constructor (message: string, userMessage: string, status: number) {
    super(message);
    this.userMessage = userMessage;
    this.status = status;
  }
}

export interface HTTPIntegration<T, U> extends BaseClass<T> {
  request: HTTPIntegrationRequest<T>;
  response: HTTPIntegrationResponse<U>;
}

export type HTTPFunction<T, U> = (context: HTTPIntegration<T, U> ) => Promise<void>;
