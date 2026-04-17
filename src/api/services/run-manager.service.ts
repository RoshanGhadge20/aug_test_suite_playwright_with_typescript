import { randomUUID } from 'crypto';
import * as path from 'path';
import type { RunRecord, RunRequest, RunStatus, TargetEnv } from '../types/run.types';

export interface RunManagerOptions {
  maxConcurrent?: number;
  reportsRoot?: string;
}

export class RunManager {
  private runs = new Map<string, RunRecord>();
  private readonly maxConcurrent: number;
  private readonly reportsRoot: string;

  constructor(opts: RunManagerOptions = {}) {
    this.maxConcurrent = opts.maxConcurrent ?? 2;
    this.reportsRoot = opts.reportsRoot ?? path.resolve('reports', 'runs');
  }

  create(request: RunRequest, resolvedEnv: TargetEnv): RunRecord {
    const id = randomUUID();
    const record: RunRecord = {
      id,
      status: 'queued',
      request,
      resolvedEnv,
      startedAt: new Date().toISOString(),
      artifactDir: path.join(this.reportsRoot, id),
    };
    this.runs.set(id, record);
    return record;
  }

  get(id: string): RunRecord | undefined { return this.runs.get(id); }

  list(): RunRecord[] {
    return Array.from(this.runs.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  updateStatus(id: string, status: RunStatus): void {
    const r = this.runs.get(id);
    if (r) r.status = status;
  }

  appendStdoutTail(id: string, chunk: string): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.stdoutTail = ((r.stdoutTail ?? '') + chunk).slice(-10_000);
  }

  appendStderrTail(id: string, chunk: string): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.stderrTail = ((r.stderrTail ?? '') + chunk).slice(-10_000);
  }

  markFinished(id: string, exitCode: number): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.exitCode = exitCode;
    r.finishedAt = new Date().toISOString();
    r.status = exitCode === 0 ? 'passed' : 'failed';
  }

  markError(id: string): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.finishedAt = new Date().toISOString();
    r.status = 'error';
  }

  runningCount(): number {
    return Array.from(this.runs.values()).filter((r) => r.status === 'running').length;
  }

  canStartAnother(): boolean {
    return this.runningCount() < this.maxConcurrent;
  }
}
