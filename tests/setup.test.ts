/// <reference types="node" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Integration test for scripts/setup.js
 *
 * Spawns setup.js in a disposable temp directory that mirrors the real
 * project layout.  A thin runner script replaces readline with canned
 * answers so the setup runs non-interactively.  The script will fail
 * at `npm install` (no real node_modules in the temp dir) but every
 * file-mutation step happens before that call, so we can assert
 * post-setup state.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(__dirname, '..', 'scripts');
const SETUP_SCRIPT = path.join(SCRIPTS_DIR, 'setup.js');
const UPDATE_META_VERSION_SCRIPT = path.join(SCRIPTS_DIR, 'update-meta-version.js');

const BASE_ANSWERS = ['My Script', 'A cool script', 'Test Author', 'testuser', 'my-script', 'y'];
const KEEP_PROVENANCE_ANSWERS = [...BASE_ANSWERS, 'y'];
const SKIP_PROVENANCE_ANSWERS = [...BASE_ANSWERS, 'n'];

/**
 * A small ESM wrapper that stubs `readline` and `child_process` so
 * setup.js can run without a TTY and without `npm install`.
 */
function writeRunner(dir: string, answers: string[]) {
  const answersJson = JSON.stringify(answers);

  const readlineStub = [
    'const _answers = ' + answersJson + ';',
    'let _idx = 0;',
    'const readline = {',
    '  createInterface() {',
    '    return {',
    '      question(q, cb) { cb(_answers[_idx++]); },',
    '      on() { return this; },',
    '      close() {},',
    '    };',
    '  },',
    '};',
  ].join('\n');

  const runner = [
    "import { readFileSync, writeFileSync } from 'node:fs';",
    '',
    "let src = readFileSync('scripts/setup.js', 'utf8');",
    '',
    'src = src.replace(',
    '  /import readline from [\'"]readline[\'"];/,',
    '  ' + JSON.stringify(readlineStub) + ',',
    ');',
    '',
    'src = src.replace(',
    '  /import {[^}]*} from [\'"]child_process[\'"];/,',
    "  'const execSync = () => {}; const execFileSync = () => {};',",
    ');',
    '',
    "writeFileSync('scripts/_setup_runner.js', src);",
    "await import('./scripts/_setup_runner.js');",
  ].join('\n');

  fs.writeFileSync(path.join(dir, '_run.js'), runner);
}

function fixturePackageJson() {
  return JSON.stringify(
    {
      name: 'typescript-userscript-template',
      version: '4.0.0',
      description: 'A template for building userscripts with TypeScript',
      type: 'module',
      scripts: {
        build: 'rollup -c --environment BUILD:production',
        test: 'vitest run',
        lint: 'eslint "src/**/*.ts"',
        'check-grants': 'node scripts/check-grants.js',
        validate:
          'npm run lint && npm run type-check && npm run test && npm run check-grants && npm run build',
        setup: 'node scripts/setup.js',
      },
      author: '',
      repository: {
        type: 'git',
        url: 'https://github.com/matthiasseghers/typescript-userscript-template.git',
      },
      userscript: { templateMode: true },
    },
    null,
    2
  );
}

function fixtureMetaJson() {
  return JSON.stringify(
    {
      name: 'My TypeScript Userscript',
      namespace: 'https://github.com/yourusername',
      version: '4.2.0',
      description: 'A userscript built with TypeScript',
      author: 'Your Name',
      match: ['https://example.com/*'],
      grant: ['none'],
      'run-at': 'document-end',
    },
    null,
    2
  );
}

const FIXTURE_README_TEMPLATE = '# {{name}}\n{{description}}\n';
const FIXTURE_HUSKY_PRECOMMIT = '# Run validation\nnpm run check-grants && npm run validate\n';

let tmpDir: string;

function setupFixtures() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-test-'));

  // Create directory structure
  fs.mkdirSync(path.join(tmpDir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.husky'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });

  // Write fixture files
  fs.writeFileSync(path.join(tmpDir, 'package.json'), fixturePackageJson());
  fs.writeFileSync(path.join(tmpDir, 'meta.json'), fixtureMetaJson());
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# old readme');
  fs.writeFileSync(path.join(tmpDir, 'MIGRATION_GUIDE.md'), '# Migration');
  fs.writeFileSync(path.join(tmpDir, 'scripts', 'README.template.md'), FIXTURE_README_TEMPLATE);
  fs.writeFileSync(path.join(tmpDir, '.husky', 'pre-commit'), FIXTURE_HUSKY_PRECOMMIT);
  fs.writeFileSync(path.join(tmpDir, 'scripts', 'check-grants.js'), '// stub');
  fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), '');

  // Copy the real scripts so we test the actual code
  fs.copyFileSync(SETUP_SCRIPT, path.join(tmpDir, 'scripts', 'setup.js'));
  fs.copyFileSync(
    UPDATE_META_VERSION_SCRIPT,
    path.join(tmpDir, 'scripts', 'update-meta-version.js')
  );
}

function runSetup(answers: string[]) {
  writeRunner(tmpDir, answers);

  try {
    execFileSync('node', ['_run.js'], {
      cwd: tmpDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15_000,
    });
  } catch {
    // The runner may exit non-zero if setup.js itself calls
    // process.exit, but all file mutations are already applied.
  }
}

function readTmpJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(tmpDir, relativePath), 'utf8'));
}

describe('setup.js', () => {
  beforeEach(() => {
    setupFixtures();
    runSetup(KEEP_PROVENANCE_ANSWERS);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should keep scripts/check-grants.js', () => {
    expect(fs.existsSync(path.join(tmpDir, 'scripts', 'check-grants.js'))).toBe(true);
  });

  it('should keep scripts/update-meta-version.js (release tooling)', () => {
    expect(fs.existsSync(path.join(tmpDir, 'scripts', 'update-meta-version.js'))).toBe(true);
  });

  it('should keep the check-grants script in package.json', () => {
    const pkg = readTmpJson('package.json');
    expect(pkg.scripts).toHaveProperty('check-grants');
  });

  it('should keep check-grants in the validate script chain', () => {
    const pkg = readTmpJson('package.json');
    expect(pkg.scripts.validate).toContain('check-grants');
  });

  it('should keep check-grants in the husky pre-commit hook', () => {
    const hookPath = path.join(tmpDir, '.husky', 'pre-commit');
    const content = fs.readFileSync(hookPath, 'utf8');
    expect(content).toContain('check-grants');
  });

  it('should remove setup scaffolding', () => {
    expect(fs.existsSync(path.join(tmpDir, 'scripts', 'setup.js'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'scripts', 'README.template.md'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'MIGRATION_GUIDE.md'))).toBe(false);
  });

  it('should reset meta.json version to 0.1.0', () => {
    const meta = readTmpJson('meta.json');
    expect(meta.version).toBe('0.1.0');
  });

  it('should remove the userscript key and patch identity', () => {
    const pkg = readTmpJson('package.json');
    expect(pkg.userscript).toBeUndefined();
    expect(pkg.name).toBe('my-script');
    expect(pkg.repository.url).toBe('https://github.com/testuser/my-script');
    expect(pkg.scripts.setup).toBeUndefined();
  });

  it('should record template provenance when kept', () => {
    const pkg = readTmpJson('package.json');
    expect(pkg.templateProvenance).toEqual(
      expect.objectContaining({
        template: 'matthiasseghers/typescript-userscript-template',
        version: '4.2.0',
      })
    );
    expect(typeof pkg.templateProvenance.forkedAt).toBe('string');
  });
});

describe('setup.js provenance opt-out', () => {
  beforeEach(() => {
    setupFixtures();
    runSetup(SKIP_PROVENANCE_ANSWERS);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should not record template provenance', () => {
    const pkg = readTmpJson('package.json');
    expect(pkg.templateProvenance).toBeUndefined();
  });

  it('should still patch the package identity', () => {
    const pkg = readTmpJson('package.json');
    expect(pkg.name).toBe('my-script');
  });

  it('should still reset meta.json version to 0.1.0', () => {
    const meta = readTmpJson('meta.json');
    expect(meta.version).toBe('0.1.0');
  });
});
