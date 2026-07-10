#!/usr/bin/env node
/**
 * Report word counts for each skills/<name>/SKILL.md, so you can see which
 * skills are heaviest on context before enabling them.
 *
 * Usage:
 *   node scripts/lib/skill-content-stats.js
 *   node scripts/lib/skill-content-stats.js --top 20
 */

'use strict';

const fs = require('fs');
const path = require('path');

function countWords(text) {
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}

function listSkillNames(root) {
  const skillsRoot = path.join(root, 'skills');
  if (!fs.existsSync(skillsRoot)) {
    return [];
  }

  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => fs.existsSync(path.join(skillsRoot, name, 'SKILL.md')))
    .sort();
}

function buildSkillContentStats(root) {
  const skills = listSkillNames(root).map(name => {
    const text = fs.readFileSync(path.join(root, 'skills', name, 'SKILL.md'), 'utf8');
    return { name, words: countWords(text), chars: text.length };
  }).sort((a, b) => b.words - a.words);

  const totalWords = skills.reduce((sum, skill) => sum + skill.words, 0);
  const totalChars = skills.reduce((sum, skill) => sum + skill.chars, 0);

  return { totalSkills: skills.length, totalWords, totalChars, skills };
}

function formatReport(stats, { top = 10 } = {}) {
  const averageWords = stats.totalSkills ? Math.round(stats.totalWords / stats.totalSkills) : 0;
  const lines = [
    `Skills: ${stats.totalSkills}`,
    `Total words across SKILL.md files: ${stats.totalWords}`,
    `Average words per skill: ${averageWords}`,
    '',
    `Largest ${Math.min(top, stats.skills.length)} skills by word count:`,
  ];

  for (const skill of stats.skills.slice(0, top)) {
    lines.push(`  ${skill.words.toString().padStart(6)}  ${skill.name}`);
  }

  return lines.join('\n');
}

function main() {
  const root = path.join(__dirname, '..', '..');
  const topIndex = process.argv.indexOf('--top');
  const top = topIndex !== -1 ? parseInt(process.argv[topIndex + 1], 10) : 10;

  console.log(formatReport(buildSkillContentStats(root), { top }));
}

if (require.main === module) {
  main();
}

module.exports = { buildSkillContentStats, formatReport, countWords };
