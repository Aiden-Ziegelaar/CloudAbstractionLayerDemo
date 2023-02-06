import { HTTPFunction } from '@cloud-abstraction-layer/cal-core'
import { registerHTTPFunction } from '@cloud-abstraction-layer/cal-aws';

const entrypoint: HTTPFunction<{}, {}> = async (context) => {
  context.response.status(200);
  context.response.send('Hello World!');
}

export const handler = registerHTTPFunction(entrypoint);
