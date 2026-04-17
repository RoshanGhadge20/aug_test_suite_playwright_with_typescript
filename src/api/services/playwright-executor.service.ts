import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { RunRequest } from '../types/run.types';
import type { RunManager } from './run-manager.service';
import { logger } from '../../../utils/logger/logger';

export function buildPlaywrightArgs(req: RunRequest): string[] {
  const args: string[] = ['test'];
  if (req.projects) {
    for (const p of req.projects) args.push(`--project=${p}`);
  }
  if (req.grep) args.push(`--grep=${req.grep}`);
  if (req.grepInvert) args.push(`--grep-invert=${req.grepInvert}`);
  if (typeof req.workers === 'number') args.push(`--workers=${req.workers}`);
  if (typeof req.retries === 'number') args.push(`--retries=${req.retries}`);
  if (req.headed) args.push('--headed');

  if (req.specFiles) {
    for (const f of req.specFiles) {
      if (f.includes('..')) throw new Error(`spec file path traversal not allowed: ${f}`);
      if (path.isAbsolute(f)) throw new Error(`spec file absolute path not allowed: ${f}`);
      args.push(f);
    }
  }
  return args;
}

export interface ExecuteOptions {
  runId: string;
  request: RunRequest;
  runManager: RunManager;
  artifactDir: string;
  cwd?: string;
  extraEnv?: NodeJS.ProcessEnv;
}

export async function executePlaywright(opts: ExecuteOptions): Promise<number> {
  fs.mkdirSync(opts.artifactDir, { recursive: true });
  const args = buildPlaywrightArgs(opts.request);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...opts.extraEnv,
    HEADLESS: opts.request.headed ? 'false' : 'true',
    ...(opts.request.env ? { ENV: opts.request.env } : {}),
    PLAYWRIGHT_HTML_REPORT: path.join(opts.artifactDir, 'html'),
    PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(opts.artifactDir, 'results.json'),
  };

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright', ...args], {
      cwd: opts.cwd ?? process.cwd(),
      env,
    });
    const stdoutLog = fs.createWriteStream(path.join(opts.artifactDir, 'stdout.log'));
    const stderrLog = fs.createWriteStream(path.join(opts.artifactDir, 'stderr.log'));

    child.stdout.on('data', (chunk) => {
      stdoutLog.write(chunk);
      opts.runManager.appendStdoutTail(opts.runId, chunk.toString());
    });
    child.stderr.on('data', (chunk) => {
      stderrLog.write(chunk);
      opts.runManager.appendStderrTail(opts.runId, chunk.toString());
    });
    child.on('error', (err) => {
      logger.error('playwright spawn error', { runId: opts.runId, err: err.message });
      reject(err);
    });
    child.on('close', (code) => {
      stdoutLog.end();
      stderrLog.end();
      resolve(code ?? 1);
    });
  });
}
