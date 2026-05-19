#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isGlobal = args.includes('-g') || args.includes('--global');

// Source directory (current package location)
const SOURCE_DIR = __dirname;

// Determine installation directory base
const HOME = process.env.HOME || process.env.USERPROFILE;
const SKILLS_BASE_DIR = isGlobal
  ? path.join(HOME, '.claude/skills')
  : path.join(process.cwd(), '.claude/skills');

console.log(isGlobal ? '🌍 Installing MTA skills globally...' : '📁 Installing MTA skills locally...');
console.log(`📍 Target: ${SKILLS_BASE_DIR}\n`);

// Copy function that preserves directory structure
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);

    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('📦 Copying skill files...');

// Skills to install
const skills = [
  { name: 'mta-analyze', description: 'MTA Analysis skill' },
  { name: 'mta-rules-gen', description: 'MTA Rules Generation skill' },
  { name: 'mta-migration', description: 'MTA Migration Orchestration skill' }
];

let successCount = 0;
let failCount = 0;

skills.forEach(skill => {
  const skillSrc = path.join(SOURCE_DIR, skill.name);
  const skillDest = path.join(SKILLS_BASE_DIR, skill.name);

  if (fs.existsSync(skillSrc)) {
    copyRecursive(skillSrc, skillDest);
    console.log(`  ✓ ${skill.description}`);
    successCount++;
  } else {
    console.error(`  ❌ Error: ${skill.name} directory not found`);
    failCount++;
  }
});

console.log('\n✅ Installation complete!\n');

if (successCount > 0) {
  if (isGlobal) {
    console.log(`${successCount} MTA skill(s) are now available for all AI agent sessions.`);
  } else {
    console.log(`${successCount} MTA skill(s) are now available in this project.`);
  }

  console.log('\n🚀 Usage:\n');
  console.log('Analyze codebase:');
  console.log('  /mta-analyze or "analyze this codebase for migration to EAP 8"\n');
  console.log('Generate custom rules:');
  console.log('  /mta-rules-gen or "create migration rules for Spring Boot 2 to 3"\n');
  console.log('Orchestrate full migration:');
  console.log('  /mta-migration or "migrate this app from Spring Boot 2.7 to 3.2"\n');
}

if (failCount > 0) {
  console.error(`\n⚠️  ${failCount} skill(s) failed to install`);
  process.exit(1);
}
