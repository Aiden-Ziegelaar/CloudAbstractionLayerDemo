import { Context, HttpRequest } from "@azure/functions"

import { HTTPFunction, HTTPIntegration, HTTPIntegrationRequest, HTTPIntegrationResponse, HTTPMethods, registerHandler } from '@cloud-abstraction-layer/cal-core'
import { ParsedQs } from "qs";


class AZURE_HTTPIntegrationRequest implements HTTPIntegrationRequest<HttpRequest> {

  constructor(req: HttpRequest) {
    this.baseUrl = req.url;
    this.body = req.body;
    this.headers = req.headers;
    this.query = req.query;
    this.params = req.params;
    this.path = req.url.split('?')[0].split('#')[0].split('/').slice(1).join('/');
    this.method = req.method || undefined;
    this.secure = req.url.startsWith('https');
    this.protocol = this.secure ? 'https' : 'http';
    this.ip = req.get('x-forwarded-for') || '';
    this.xhr = req.get('x-requested-with') === 'XMLHttpRequest';
    this.ips = this.ip.split(',').map(ip => ip.trim());
    this.originalInput = req;
  }
  get(header: string): string | string[] | undefined {
    return this.originalInput.get(header);
  }
  baseUrl: string;
  body?: object | undefined;
  cookies?: Record<string, string | string[]> | undefined;
  host?: string | undefined;
  hostname?: string | undefined;
  ip: string;
  ips: string[];
  method?: string | HTTPMethods | undefined;
  params?: Record<string, string | undefined> | undefined;
  path: string;
  protocol?: string | undefined;
  query?: Record<string, string | string[] | ParsedQs | ParsedQs[] | undefined> | undefined;
  secure: boolean;
  subdomains?: string[] | undefined;
  xhr: boolean;
  headers: Record<string, string | string[] | undefined>;
  traceId?: string | undefined;
  originalInput: HttpRequest;
}

class AZURE_HTTPIntegrationResponse implements HTTPIntegrationResponse<Context> {
  headers: Record<string, string | string[] | undefined> = {};
  statusCode: number = 200;
  body?: string | undefined;

  constructor (context: Context) {
    this.originalInput = context;
  }

  set(header: string, value: string | string[]): void {
    this.headers[header.toLowerCase()] = value;
  }
  status(statusCode: number): void {
    this.statusCode = statusCode;
  }

  send(body: string): void {
    this.body = body;
  }

  json(body: object): void {
    this.body = JSON.stringify(body);
  }

  format() {
    return {
      status: this.statusCode,
      body: this.body,
      headers: this.headers
    };
  }

  originalInput: Context;
}

class AZURE_HTTPIntegration implements HTTPIntegration<HttpRequest, Context> {

  constructor(req: HttpRequest, res: Context) {
    this.request = new AZURE_HTTPIntegrationRequest(req);
    this.response = new AZURE_HTTPIntegrationResponse(res);
  }

  request: AZURE_HTTPIntegrationRequest;
  response: AZURE_HTTPIntegrationResponse;
}

export const registerHTTPFunction: registerHandler<HTTPFunction<{}, {}>> = (fn: HTTPFunction<{}, {}>) => {
  return async function (context: Context, req: HttpRequest): Promise<void> {
    const integration = new AZURE_HTTPIntegration(req, context);
    await fn(integration);
    context.res = integration.response.format();
  };
}
