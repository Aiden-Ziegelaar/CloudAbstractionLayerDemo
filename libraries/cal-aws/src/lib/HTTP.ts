import { HTTPError, HTTPFunction, HTTPIntegration, HTTPIntegrationRequest, HTTPIntegrationResponse, HTTPMethods, registerHandler } from '@cloud-abstraction-layer/cal-core'
import { APIGatewayEventRequestContextV2, APIGatewayProxyCallbackV2, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import qs = require('qs');

type AWS_HTTPInput = {event: APIGatewayProxyEventV2, context: APIGatewayEventRequestContextV2};

class AWS_APIGatewayHTTPIntegrationRequest implements HTTPIntegrationRequest<AWS_HTTPInput> {

  constructor(event: APIGatewayProxyEventV2, context: APIGatewayEventRequestContextV2) {
    this.baseUrl = event.requestContext.domainName;
    this.body = event.body? JSON.parse(event.body) : undefined;

    const headerKeys = Object.keys(event.headers);
    this.headers = headerKeys.reduce((acc, key: string) => {
      acc[key.toLowerCase()] = event.headers[key];
      return acc;
    }, {} as Record<string, string | undefined>);
    this.cookies = event.cookies?.reduce((acc, cookie) => {
      const [name, value] = cookie.split('=').reduce((acc, part, index) => {
        if (index === 0) {
          acc.push(part);
          acc.push('');
        } else {
          acc[1] += part;
        }
        return acc;
      }, [] as string[]);
      acc[name] = value;
      return acc;
    }, {} as Record<string, string|string[]>);
    this.host = event.headers['Host'];
    this.hostname = event.headers['Host']?.split(':')[0];
    this.ip = event.requestContext.http.sourceIp;
    this.ips = [event.requestContext.http.sourceIp];
    this.method = event.requestContext.http.method as unknown as HTTPMethods;
    this.params = event.pathParameters;
    this.path = event.rawPath;
    this.protocol = event.headers['x-forwarded-proto'];
    this.query = qs.parse(event.rawQueryString);
    this.secure = event.headers['x-forwarded-proto'] === 'https';
    this.subdomains = event.headers?.['Host']?.split('.').slice(0, -2);
    this.xhr = event.headers['x-requested-with'] === 'XMLHttpRequest';
    this.headers = event.headers;
    this.traceId = event.requestContext.requestId;
    this.originalInput = {
      event,
      context,
    };
  }

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
  query?: Record<string, string | string[] | qs.ParsedQs | qs.ParsedQs[] | undefined> | undefined;
  secure: boolean;
  subdomains?: string[] | undefined;
  xhr: boolean;
  headers: Record<string, string | string[] | undefined>;
  traceId?: string | undefined;
  originalInput?: AWS_HTTPInput | undefined;
  baseUrl: string;

  get(header: string): string | string[] | undefined {
    return this.headers[header.toLowerCase()];
  }
}

class AWS_APIGatewayHTTPIntegrationResponse implements HTTPIntegrationResponse<{}> {
  private _headers: Record<string, string> = {};
  private _statusCode: number = 200;
  private _body?: string;

  set(header: string, value: string | string[]): void {
    if (Array.isArray(value)) {
      this._headers[header.toLowerCase()] = value.join(',');
    } else {
      this._headers[header.toLowerCase()] = value;
    }
  }

  status(statusCode: number): void {
    this._statusCode = statusCode;
  }

  send(body: string): void {
    this._body = body;
  }

  json(body: object): void {
    this._body = JSON.stringify(body);
  }

  formatResponse(): APIGatewayProxyResultV2 {
    return {
      statusCode: this._statusCode,
      headers: this._headers,
      body: this._body,
    };
  }
}

class AWS_APIGatewayHTTPIntegration implements HTTPIntegration<AWS_HTTPInput, {}> {
  constructor (event: APIGatewayProxyEventV2, context: APIGatewayEventRequestContextV2) {
    this.request = new AWS_APIGatewayHTTPIntegrationRequest(event, context);
    this.response = new AWS_APIGatewayHTTPIntegrationResponse();
  }
  request: AWS_APIGatewayHTTPIntegrationRequest;
  response: AWS_APIGatewayHTTPIntegrationResponse;
}

export const registerHTTPFunction: registerHandler<HTTPFunction<AWS_HTTPInput, {}>> = (fn: HTTPFunction<AWS_HTTPInput, {}>) => {
  return (event: APIGatewayProxyEventV2, context: APIGatewayEventRequestContextV2, callback: APIGatewayProxyCallbackV2) => {

    const integration = new AWS_APIGatewayHTTPIntegration(
      event,
      context,
    );

    fn(integration).catch((err: any) => {
      console.log(err);
      if (err instanceof HTTPError) {
        integration.response.status(err.status);
        integration.response.send(err.userMessage);
      } else {
        integration.response.status(500);
        integration.response.send('Internal Server Error');
      }
    }).finally(() => {
      callback(null, integration.response.formatResponse());
    });
  }
}