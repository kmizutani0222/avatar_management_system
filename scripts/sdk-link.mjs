#!/usr/bin/env node

const packages = ['@ams/shared-types', '@ams/sdk-web', '@ams/sdk-three'];

console.log('');
console.log('SDK packages linked globally:');
for (const name of packages) {
  console.log(`  - ${name}`);
}
console.log('');
console.log('In your other local project, run:');
console.log('');
console.log('  pnpm link --global @ams/shared-types @ams/sdk-web @ams/sdk-three');
console.log('  pnpm add three@^0.170.0 @pixiv/three-vrm@^3.3.0');
console.log('');
console.log('Or link directly without global setup:');
console.log('');
console.log('  pnpm sdk:link:to /path/to/your-other-product');
console.log('');
console.log('After SDK changes in AMS, rebuild:');
console.log('');
console.log('  pnpm sdk:build');
console.log('');
