import { HTTPError, HTTPFunction, HTTPIntegration, HTTPIntegrationRequest, HTTPIntegrationResponse, HTTPMethods, registerHandler } from '@cloud-abstraction-layer/cal-core'
import { APIGatewayEventRequestContextV2, APIGatewayProxyCallbackV2, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

type AWS_HTTPInput = {event: APIGatewayProxyEventV2, context: APIGatewayEventRequestContextV2};

class AWS_APIGatewayHTTPIntegrationRequest extends HTTPIntegrationRequest<AWS_HTTPInput> {}

class AWS_APIGatewayHTTPIntegrationResponse extends HTTPIntegrationResponse<{}> {
  private _headers: Record<string, string> = {};
  private _statusCode: number = 200;
  private _body?: string;

  private checkBodyEmpty(): void {
    if (this._body) {
      throw new HTTPError('Cannot set body after it has been already set', 'Internal Server Error', 500);
    }
  }

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
    this.checkBodyEmpty();
    this._body = body;
  }

  json(body: object): void {
    this.checkBodyEmpty(); 
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

class AWS_APIGatewayHTTPIntegration extends HTTPIntegration<AWS_HTTPInput, {}> {
  constructor (event: APIGatewayProxyEventV2, context: APIGatewayEventRequestContextV2) {
    super();
    this.request = new AWS_APIGatewayHTTPIntegrationRequest();
    this.request.baseUrl = event.requestContext.domainName;
    this.request.body = event.body? JSON.parse(event.body) : undefined;
    this.request.cookies = event.cookies?.reduce((acc, cookie) => {
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
    this.request.host = event.headers['Host'];
    this.request.hostname = event.headers['Host']?.split(':')[0];
    this.request.ip = event.requestContext.http.sourceIp;
    this.request.ips = event.requestContext.http.sourceIp;
    this.request.method = event.requestContext.http.method as unknown as HTTPMethods;
    this.request.params = event.pathParameters;
    this.request.path = event.rawPath;
    this.request.protocol = event.headers['X-Forwarded-Proto'];
    this.request.query = event.queryStringParameters;
    this.request.secure = event.headers['X-Forwarded-Proto'] === 'https';
    this.request.subdomains = event.headers?.['Host']?.split('.').slice(0, -2);
    this.request.xhr = event.headers['X-Requested-With'] === 'XMLHttpRequest';
    this.request.headers = event.headers;
    this.request.traceId = event.requestContext.requestId;
    this.request.originalInput = {
      event,
      context,
    };
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