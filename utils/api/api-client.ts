import { request as pwRequest, APIRequestContext } from '@playwright/test';
import { logger } from '../logger/logger';

export class ApiClient {
  private ctx!: APIRequestContext;

  static async create(baseURL: string, authToken?: string): Promise<ApiClient> {
    const client = new ApiClient();
    client.ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    return client;
  }

  async get<T>(path: string): Promise<T> {
    const res = await this.ctx.get(path);
    if (!res.ok()) throw new Error(`GET ${path} failed: ${res.status()}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    logger.debug('api.post', { path });
    const res = await this.ctx.post(path, { data });
    if (!res.ok()) throw new Error(`POST ${path} failed: ${res.status()}`);
    return res.json() as Promise<T>;
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }
}
