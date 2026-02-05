#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
const packageJsonPath = path.join(projectRoot, 'package.json');

function readPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return {
    version: pkg.version,
    repository: pkg.repository,
  };
}

function sanitizeRepoUrl(repo) {
  if (!repo) return null;
  let url = typeof repo === 'string' ? repo : repo.url;
  if (!url) return null;
  url = url.replace(/^git\+/, '').replace(/\.git$/, '');
  return url.replace(/\/$/, '');
}

function runGit(command) {
  try {
    return execSync(command, {
      cwd: projectRoot,
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    return '';
  }
}

function getPreviousTag() {
  const tag = runGit("git describe --tags --match 'v*' --abbrev=0");
  return tag || null;
}

function getCommits(range) {
  const logRange = range ? `${range} ` : '';
  const logOutput = runGit(`git log ${logRange}--no-merges --pretty=format:%H%x09%s`);
  if (!logOutput) {
    return [];
  }

  return logOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hash, subject] = line.split('\t');
      return {
        hash,
        subject: subject || '',
      };
    })
    .filter((commit) => commit.subject && !/^chore: prepare release v/iu.test(commit.subject));
}

function parseCommitSubject(subject) {
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!?):\s*(.+)$/i);
  if (!match) {
    return {
      type: 'other',
      scope: null,
      description: subject.trim(),
      breaking: false,
    };
  }

  return {
    type: match[1].toLowerCase(),
    scope: match[2] || null,
    breaking: match[3] === '!',
    description: match[4].trim(),
  };
}

const typeToSection = new Map([
  ['feat', 'Features'],
  ['fix', 'Bug Fixes'],
  ['perf', 'Performance Improvements'],
  ['refactor', 'Refactors'],
  ['docs', 'Documentation'],
  ['test', 'Tests'],
  ['build', 'Build System'],
  ['ci', 'CI'],
  ['chore', 'Chores'],
  ['style', 'Styling'],
  ['revert', 'Reverts'],
]);

const sectionOrder = [
  'Features',
  'Bug Fixes',
  'Performance Improvements',
  'Refactors',
  'Documentation',
  'Tests',
  'Build System',
  'CI',
  'Chores',
  'Styling',
  'Reverts',
  'Other Changes',
];

function buildSectionMap(commits, repoUrl) {
  const sections = new Map();

  commits.forEach((commit) => {
    const parsed = parseCommitSubject(commit.subject);
    const section = typeToSection.get(parsed.type) || 'Other Changes';
    const scopeLabel = parsed.scope ? `**${parsed.scope}**: ` : '';
    const shortHash = commit.hash.slice(0, 7);
    const hashLink = repoUrl ? `[${shortHash}](${repoUrl}/commit/${commit.hash})` : shortHash;
    const breakingFlag = parsed.breaking ? ' ⚠️' : '';
    const line = `- ${scopeLabel}${parsed.description} (${hashLink})${breakingFlag}`;

    if (!sections.has(section)) {
      sections.set(section, []);
    }
    sections.get(section).push(line);
  });

  return sections;
}

function formatReleaseNotes({ version, previousTag, repoUrl, commits }) {
  const currentTag = `v${version}`;
  const date = new Date().toISOString().slice(0, 10);
  const heading = previousTag && repoUrl
    ? `## [${version}](${repoUrl}/compare/${previousTag}...${currentTag}) (${date})`
    : `## ${version} (${date})`;

  if (!commits.length) {
    return `${heading}\n\n- No notable changes.\n`;
  }

  const sections = buildSectionMap(commits, repoUrl);
  const body = sectionOrder
    .filter((section) => sections.has(section))
    .map((section) => `### ${section}\n${sections.get(section).join('\n')}`)
    .join('\n\n');

  return `${heading}\n\n${body}\n`;
}

function extractExistingEntries(content) {
  if (!content) {
    return [];
  }

  const normalized = content.replace(/\r\n/g, '\n');
  const introPattern = /# Changelog\s*\n+All notable changes to the ChordPro extension will be documented in this file\.\s*/gi;
  const sanitized = normalized.replace(introPattern, '').trim();

  if (!sanitized) {
    return [];
  }

  return sanitized
    .split(/\n(?=## )/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('## '));
}

function removeVersionEntry(entries, version) {
  return entries.filter((entry) => {
    return (
      !entry.startsWith(`## [${version}]`) &&
      !entry.startsWith(`## ${version} `)
    );
  });
}

function writeChangelog({ releaseNotes, version }) {
  const intro = '# Changelog\n\nAll notable changes to the ChordPro extension will be documented in this file.';
  let existing = '';
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, 'utf8');
  }

  const existingEntries = extractExistingEntries(existing);
  const filteredEntries = removeVersionEntry(existingEntries, version);
  const history = filteredEntries.length ? `\n\n${filteredEntries.join('\n\n')}` : '';
  const newContent = `${intro}\n\n${releaseNotes.trim()}${history}\n`;

  fs.writeFileSync(changelogPath, newContent);
}

const { version, repository } = readPackageVersion();
const repoUrl = sanitizeRepoUrl(repository);
const previousTag = getPreviousTag();
const range = previousTag ? `${previousTag}..HEAD` : '';
const commits = getCommits(range);

const releaseContext = {
  version,
  previousTag,
  repoUrl,
  commits,
};

const releaseNotes = formatReleaseNotes(releaseContext);
writeChangelog({ releaseNotes, version });
