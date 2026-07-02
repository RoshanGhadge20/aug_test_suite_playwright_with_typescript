import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import { logger } from '../utils/logger/logger';

export default async function globalSetup(_config: FullConfig): Promise<void> {
  for (const dir of ['storage', 'reports']) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  logger.info('global setup complete', { env: process.env.ENV, headless: process.env.HEADLESS });
}
