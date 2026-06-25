import { statSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const budgets = [
  { path: 'src/assets/pts.png', maxBytes: 120_000 },
  { path: 'public/favicon.svg', maxBytes: 20_000 },
  { path: 'public/web-app-manifest-512x512.png', maxBytes: 120_000 },
  { path: 'public/web-app-manifest-192x192.png', maxBytes: 40_000 },
  { path: 'public/apple-touch-icon.png', maxBytes: 40_000 },
  { path: 'public/favicon-96x96.png', maxBytes: 20_000 },
];

for (const badgeFile of readdirSync('badge_png')) {
  if (badgeFile.endsWith('.png')) {
    budgets.push({ path: join('badge_png', badgeFile), maxBytes: 120_000 });
  }
}

for (const budget of budgets) {
  const size = statSync(budget.path).size;
  assert.ok(
    size <= budget.maxBytes,
    `${budget.path} is ${size} bytes, above the ${budget.maxBytes} byte production asset budget.`,
  );
}

console.log('Asset size budget verified.');
