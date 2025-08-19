import request from 'supertest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import TestAgent from 'supertest/lib/agent';

let _agent: TestAgent | null = null;

export function getAgent() {
  if (_agent) return _agent;
  const { port } = JSON.parse(readFileSync(join(tmpdir(), 'bm_next_test.json'), 'utf-8'));
  _agent = request(`http://127.0.0.1:${port}`);
  return _agent;
}
