export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'error' | 'cancelled';

export type UiPanel = 'admin' | 'customer' | 'business' | 'new-admin';
export type ApiService = 'api-backend' | 'api-emi' | 'api-lgd';
export type ProjectId = UiPanel | ApiService;

export interface RunRequest {
  projects?: ProjectId[];
  grep?: string;
  grepInvert?: string;
  specFiles?: string[];
  env?: 'dev' | 'staging' | 'production';
  workers?: number;
  retries?: number;
  headed?: boolean;
}

export interface RunRecord {
  id: string;
  status: RunStatus;
  request: RunRequest;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  stdoutTail?: string;
  stderrTail?: string;
  artifactDir: string;
}
