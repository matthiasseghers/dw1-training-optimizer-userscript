import readline from 'readline';
import fs from 'fs';
import { execSync, execFileSync } from 'child_process';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// readline delivers each input line either to a pending rl.question callback
// or to 'line' listeners — never both. When stdin is piped (e.g. CI), every
// line can arrive before the next question is asked, so unclaimed lines are
// buffered here and handed out by ask() in order.
const bufferedAnswers = [];
rl.on('line', (line) => bufferedAnswers.push(line));

const ask = (q) => {
  process.stdout.write(q);
  if (bufferedAnswers.length > 0) {
    return Promise.resolve(bufferedAnswers.shift() ?? '');
  }
  return new Promise((res) => rl.question('', (a) => res(a ?? '')));
};

rl.on('SIGINT', () => {
  console.log('\nSetup cancelled.');
  process.exit(0);
});

function normalizeRepoName(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function collectInputs() {
  while (true) {
    console.log('\nTypeScript Userscript Template - Setup\n');

    const name = (await ask('Userscript name: ')).trim();
    const description = (await ask('Description: ')).trim();
    const author = (await ask('Author (your name): ')).trim();
    const username = (await ask('GitHub username: ')).trim();
    const repo = normalizeRepoName(await ask('GitHub repository name: '));

    console.log(`
Please confirm:
  Userscript name:        ${name}
  Description:            ${description}
  Author:                 ${author}
  GitHub username:        ${username}
  GitHub repository name: ${repo}
`);

    const confirm = await ask('Look good? (y/n): ');
    if (confirm.trim().toLowerCase() === 'y') {
      const problems = [];
      if (!name) problems.push('name is required');
      if (!username) problems.push('username is required');
      if (!repo) problems.push('repository name is required');
      if (/\s/.test(username)) problems.push('username must not contain whitespace');
      if (/^[._]/.test(repo))
        problems.push('repository name must not start with a dot or underscore');
      if (!/^[A-Za-z0-9-]+$/.test(username))
        problems.push('username may only contain letters, digits, and hyphens');
      if (problems.length > 0) {
        console.log(`\nCannot continue: ${problems.join('; ')}`);
        console.log('Starting over...');
        continue;
      }
      return { name, description, author, username, repo };
    }

    console.log('\nStarting over...');
  }
}

function removeInheritedTags() {
  if (!fs.existsSync('.git')) return;
  try {
    const tags = execSync('git tag -l "v*"', { encoding: 'utf8' })
      .split('\n')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tags.length === 0) return;
    for (let i = 0; i < tags.length; i += 50) {
      execFileSync('git', ['tag', '-d', ...tags.slice(i, i + 50)], { stdio: 'ignore' });
    }
    console.log(`  removed ${tags.length} inherited template tag(s) (${tags.join(', ')})`);
  } catch (_) {
    console.warn(
      '  warning: could not remove inherited template tags - continuing without tag cleanup'
    );
  }
}

try {
  const { name, description, author, username, repo } = await collectInputs();

  // The inherited meta.json version is the template release this project forked from.
  const templateVersion = JSON.parse(fs.readFileSync('meta.json', 'utf8')).version;

  const keepProvenance =
    (await ask('\nKeep a record of the template version you started from in package.json? (Y/n): '))
      .trim()
      .toLowerCase() !== 'n';

  rl.close();

  const userRepo = `${username}/${repo}`;

  console.log('\nPatching files...');

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.name = repo;
  pkg.description = description;
  pkg.author = author;
  pkg.repository.url = `https://github.com/${userRepo}`;
  delete pkg.userscript;
  if (keepProvenance) {
    pkg.templateProvenance = {
      template: 'matthiasseghers/typescript-userscript-template',
      version: templateVersion,
      forkedAt: new Date().toISOString().slice(0, 10),
    };
  }
  delete pkg.scripts.setup;
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log('  updated package.json');

  const meta = JSON.parse(fs.readFileSync('meta.json', 'utf8'));
  meta.name = name;
  meta.description = description;
  meta.author = author;
  meta.namespace = `https://github.com/${username}`;
  meta.version = '0.1.0';
  fs.writeFileSync('meta.json', JSON.stringify(meta, null, 2) + '\n');
  console.log('  updated meta.json (version reset to 0.1.0)');

  const readmeTemplate = fs.readFileSync('scripts/README.template.md', 'utf8');
  const readme = readmeTemplate
    .replaceAll('{{name}}', name)
    .replaceAll('{{userRepo}}', userRepo)
    .replaceAll('{{description}}', description);
  fs.writeFileSync('README.md', readme);
  console.log('  updated README.md');

  removeInheritedTags();

  // Remove template-specific files — not relevant to the user's project
  for (const file of ['MIGRATION_GUIDE.md', 'tests/setup.test.ts']) {
    if (fs.existsSync(file)) {
      fs.rmSync(file);
      console.log(`  removed ${file}`);
    }
  }

  // Self-delete setup scaffolding only — update-meta-version.js stays (release tooling)
  if (fs.existsSync('scripts/README.template.md')) {
    fs.rmSync('scripts/README.template.md');
  }
  if (fs.existsSync('scripts/setup.js')) {
    fs.rmSync('scripts/setup.js');
  }
  const remainingScripts = fs
    .readdirSync('scripts')
    .filter((entry) => !entry.startsWith('.') && entry !== '_setup_runner.js');

  if (remainingScripts.length === 0) {
    fs.rmdirSync('scripts');
    console.log('  removed setup files (scripts/ deleted)');
  } else {
    console.log(`  kept scripts/ (${remainingScripts.join(', ')})`);
    console.log('     These are project scripts and stay part of your release tooling.');
  }

  console.log('\nInstalling dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log(`
Done! Your userscript project is ready.

   Next steps:
   1. Review the changes: git diff
   2. Edit src/index.ts and start building
   3. When ready to release: Actions -> Release (choose a bump type)
`);
} catch (err) {
  console.log(`\nSetup failed: ${err.message}`);
  process.exit(1);
}
