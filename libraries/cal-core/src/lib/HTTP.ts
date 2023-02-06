import { BaseClass } from "./base";

export enum HTTPMethods {
  'OPTIONS',
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE'
}

export abstract class HTTPIntegrationRequest<T> extends BaseClass<T> {
  public baseUrl!: string;
  public body?: object;
  public cookies?: Record<string, string|string[]>;
  public host?: string;
  public hostname?: string;
  public ip!: string;
  public ips!: string;
  public method!: HTTPMethods;
  public params?: Record<string, string|undefined>;
  public path!: string;
  public protocol?: string;
  public query?: Record<string, string|undefined>;
  public secure!: boolean;
  public subdomains?: string[];
  public xhr!: boolean;
  public headers!: Record<string, string|string[]|undefined>;
  public traceId?: string;

  get( header:string ): string | string[] | undefined {
    return this.headers[ header.toLowerCase() ];
  }  
}

export abstract class HTTPIntegrationResponse<T> extends BaseClass<T> {
  abstract set( header:string, value:string|string[] ): void
  abstract status( statusCode:number ): void
  abstract send( body:string ): void
  abstract json( body:object ): void
}

export class HTTPError extends Error {
  constructor (message: string, public userMessage: string, public status: number) {
    super(message);
  }
}

export abstract class HTTPIntegration<T, U> extends BaseClass<T> {
  abstract request: HTTPIntegrationRequest<T>;
  abstract response: HTTPIntegrationResponse<U>;
}

export type HTTPFunction<T, U> = (context: HTTPIntegration<T, U> ) => Promise<void>;
