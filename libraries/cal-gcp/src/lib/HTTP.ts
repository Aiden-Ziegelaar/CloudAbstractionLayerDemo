import { http as httpGCP } from '@google-cloud/functions-framework';

import { HTTPFunction, HTTPIntegration, HTTPIntegrationRequest, HTTPIntegrationResponse, registerHandler } from '@cloud-abstraction-layer/cal-core'

import { Request as ExpressRequest, Response } from 'express';

class GCP_HTTPIntegration implements HTTPIntegration<ExpressRequest, Response> {

  constructor(req: ExpressRequest, res: Response) {
    this.request = req;
    this.response = res;
  }

  request: HTTPIntegrationRequest<ExpressRequest>;
  response: HTTPIntegrationResponse<Response>;
}

export const registerHTTPFunction: registerHandler<HTTPFunction<{}, {}>> = (fn: HTTPFunction<{}, {}>) => {
  httpGCP('entrypoint', async (req, res) => {
    const integration = new GCP_HTTPIntegration(req, res);
    await fn(integration);
  });
}
