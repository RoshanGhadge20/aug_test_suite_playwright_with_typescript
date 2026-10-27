import type { APIResponse } from '@playwright/test';

export interface ApiLogRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  payload?: unknown;
}

/** Keeps bearer tokens out of full console output: `Bearer eyJhbGciOi...(312 chars)`. */
function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = k.toLowerCase() === 'authorization' ? `${v.slice(0, 17)}...(${v.length} chars)` : v;
  }
  return out;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Console dump of one API call — request (method, URL, headers, payload) and response (status, body). */
export async function logApiCall(testCaseId: string, req: ApiLogRequest, res: APIResponse): Promise<void> {
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // non-JSON body — log as text
  }
  console.log(
    [
      `\n========== [${testCaseId}] ==========`,
      `REQUEST  : ${req.method} ${res.url()}`,
      `HEADERS  : ${pretty(maskHeaders(req.headers ?? {}))}`,
      `PAYLOAD  : ${req.payload === undefined ? '(none)' : pretty(req.payload)}`,
      `RESPONSE : ${res.status()} ${res.statusText()}`,
      `BODY     : ${pretty(body)}`,
      `==========================================`,
    ].join('\n'),
  );
}
