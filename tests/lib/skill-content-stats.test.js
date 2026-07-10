/**
 * Tests for scripts/lib/skill-content-stats.js
 *
 * Run with: node tests/lib/skill-content-stats.test.js
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { buildSkillContentStats, formatReport, countWords } = require('../../scripts/lib/skill-content-stats');

function createTestDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-skill-content-stats-'));
}

function cleanupTestDir(testDir) {
  fs.rmSync(testDir, { recursive: true, force: true });
}

function writeSkill(root, name, body) {
  const dir = path.join(root, 'skills', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), body);
}

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS ${name}`);
    return true;
  } catch (error) {
    console.log(`  FAIL ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing skill-content-stats.js ===\n');

  let passed = 0;
  let failed = 0;

  if (test('countWords counts whitespace-separated tokens', () => {
    assert.strictEqual(countWords(''), 0);
    assert.strictEqual(countWords('   '), 0);
    assert.strictEqual(countWords('one two  three'), 3);
  })) passed++; else failed++;

  if (test('buildSkillContentStats only counts directories with SKILL.md', () => {
    const testDir = createTestDir();
    try {
      writeSkill(testDir, 'alpha', '# Alpha\n\none two three four five');
      writeSkill(testDir, 'beta', '# Beta\n\none two');
      fs.mkdirSync(path.join(testDir, 'skills', 'no-skill-file'), { recursive: true });
      fs.writeFileSync(path.join(testDir, 'skills', 'no-skill-file', 'README.md'), 'ignored');

      const stats = buildSkillContentStats(testDir);

      assert.strictEqual(stats.totalSkills, 2);
      assert.strictEqual(stats.totalWords, 11);
      assert.deepStrictEqual(stats.skills.map(s => s.name), ['alpha', 'beta']);
    } finally {
      cleanupTestDir(testDir);
    }
  })) passed++; else failed++;

  if (test('buildSkillContentStats returns empty stats when skills dir is missing', () => {
    const testDir = createTestDir();
    try {
      const stats = buildSkillContentStats(testDir);
      assert.strictEqual(stats.totalSkills, 0);
      assert.strictEqual(stats.totalWords, 0);
      assert.deepStrictEqual(stats.skills, []);
    } finally {
      cleanupTestDir(testDir);
    }
  })) passed++; else failed++;

  if (test('formatReport lists skills sorted by word count, most first', () => {
    const testDir = createTestDir();
    try {
      writeSkill(testDir, 'small', 'one two');
      writeSkill(testDir, 'big', 'one two three four five six');

      const stats = buildSkillContentStats(testDir);
      const report = formatReport(stats, { top: 5 });

      assert.ok(report.includes('Skills: 2'));
      assert.ok(report.indexOf('big') < report.indexOf('small'));
    } finally {
      cleanupTestDir(testDir);
    }
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
