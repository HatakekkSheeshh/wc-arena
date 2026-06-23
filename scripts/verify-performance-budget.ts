import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { strict as assert } from 'node:assert';

const distDir = 'dist';
const assetsDir = join(distDir, 'assets');

const budgets = {
  initialJsBytes: 350_000,
  vendorJsBytes: 250_000,
  routeJsBytes: 60_000,
  cssBytes: 80_000,
  imageBytes: 130_000,
  totalAssetsBytes: 1_600_000,
};

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const files = listFiles(assetsDir).map((path) => ({
  path,
  name: relative(distDir, path).replaceAll('\\', '/'),
  size: statSync(path).size,
}));

const totalAssetsBytes = files.reduce((total, file) => total + file.size, 0);
assert.ok(totalAssetsBytes <= budgets.totalAssetsBytes, `dist assets total is ${totalAssetsBytes} bytes, above ${budgets.totalAssetsBytes}.`);

for (const file of files) {
  if (file.name.endsWith('.css')) {
    assert.ok(file.size <= budgets.cssBytes, `${file.name} is ${file.size} bytes, above CSS budget ${budgets.cssBytes}.`);
  }

  if (/\.(png|jpe?g|webp|avif|svg)$/i.test(file.name)) {
    assert.ok(file.size <= budgets.imageBytes, `${file.name} is ${file.size} bytes, above image budget ${budgets.imageBytes}.`);
  }

  if (!file.name.endsWith('.js')) continue;

  const isVendor = file.name.includes('vendor');
  const isInitial = /assets\/index-[\w-]+\.js$/.test(file.name);
  const maxBytes = isInitial ? budgets.initialJsBytes : isVendor ? budgets.vendorJsBytes : budgets.routeJsBytes;
  assert.ok(file.size <= maxBytes, `${file.name} is ${file.size} bytes, above JS budget ${maxBytes}.`);
}

console.log(`Performance budget verified. dist assets: ${Math.round(totalAssetsBytes / 1024)} KB.`);
