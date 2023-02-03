export enum HTTPMethods {
  'OPTIONS',
  
}

export abstract class HTTPIntegrationRequest {
  public baseUrl!: string;
  public body!: object;
  public cookies!: Record<string, string|string[]>;
  public hostname!: string;
  public ip!: string;
  public ips!: string;
  public method!:
}