#!/usr/bin/env node

const target = process.argv[2];

console.log('');
if (!target) {
  console.log('Usage: pnpm sdk:link:to /path/to/your-other-product');
  process.exit(1);
}

const packages = ['@ams/shared-types', '@ams/sdk-web', '@ams/sdk-three'];
console.log(`Linked to ${target}:`);
for (const name of packages) {
  console.log(`  - ${name}`);
}
console.log('');
console.log('If needed, install peer dependencies in the other project:');
console.log('');
console.log('  pnpm add three@^0.170.0 @pixiv/three-vrm@^3.3.0');
console.log('');
console.log('After SDK changes in AMS:');
console.log('');
console.log('  pnpm sdk:build');
console.log('');
