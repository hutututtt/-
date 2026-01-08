import fs from 'node:fs';
import path from 'node:path';

const EVENT_PATH = path.join('data', 'events.jsonl');

export function appendEvent(event: unknown) {
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data', { recursive: true });
  }
  fs.appendFileSync(EVENT_PATH, `${JSON.stringify(event)}\n`);
}
