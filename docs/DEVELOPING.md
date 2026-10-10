# Writing and building your userscript

Day-to-day development guide for a project created from this template: writing code, testing, building, customizing, and installing your script.

## Development workflow

1. **Write TypeScript code** in the `src/` directory
   - `src/index.ts` is the main entry point
   - Create additional `.ts` files as needed
   - Import/export modules as usual

2. **Write tests** for your code:
   ```bash
   npm test              # Run tests once
   npm run test:watch    # Watch mode for test-driven development
   npm run test:ui       # Interactive UI for exploring tests
   npm run test:coverage # Generate coverage report
   ```

3. **Lint and format your code**:
   ```bash
   npm run lint              # Check TypeScript files
   npm run lint:fix          # Auto-fix TypeScript files
   npm run lint:scripts      # Check JavaScript files in scripts/
   npm run lint:scripts:fix  # Auto-fix JavaScript files
   npm run format            # Format code with Prettier
   ```

4. **Run in watch mode** during development:
   ```bash
   npm run dev  # Includes inline sourcemaps for debugging
   ```

5. **Test in browser**:
   - After each build, copy the updated `dist/userscript.user.js` to your userscript manager
   - Or set up automatic reloading (see Tips below)

## Writing your userscript

### Example: Testing Your Code

The template includes Vitest for testing. Write tests alongside your code:

```typescript
// tests/utils.test.ts
import { describe, it, expect } from 'vitest';
import { log } from '../src/utils';

describe('utils', () => {
  it('should log with prefix', () => {
    // Your test logic here
  });
});
```

The template repository's `MIGRATION_GUIDE.md` has more testing examples.

### Example: Basic Structure

```typescript
// src/index.ts
import { log, waitForElement } from './utils';

async function main(): Promise<void> {
  log('Userscript started!');

  try {
    const element = await waitForElement('#my-element');
    element.textContent = 'Modified by userscript!';
  } catch (error) {
    console.error('Error:', error);
  }
}

// Start the userscript
// Note: With @run-at document-end, the DOM is already loaded
main();
```

### Example: Creating Utilities

```typescript
// src/utils.ts — log() and waitForElement() ship with the template
export function log(message: string): void {
  console.log(`[UserScript] ${message}`);
}

// waitForElement polls with requestAnimationFrame and rejects
// after a configurable timeout (default 5000 ms).
// See src/utils.ts for the full implementation.

// Using GM APIs
export function addStyles(css: string): void {
  GM_addStyle(css);
}

export async function store(key: string, value: any): Promise<void> {
  await GM_setValue(key, value);
}

export async function retrieve<T>(key: string, defaultValue?: T): Promise<T> {
  return await GM_getValue(key, defaultValue);
}

export function notify(text: string, title?: string): void {
  GM_notification({ text, title: title || 'UserScript' });
}
```

The full `GM_*` API is typed via `@types/tampermonkey` — autocomplete as you type. Reference: [Tampermonkey documentation](https://www.tampermonkey.net/documentation.php).

## Tips

- Just start typing `GM_` and your editor will autocomplete the available functions.

- **Grant permissions**: Always add the GM functions you use to the `grant` array in [meta.json](../meta.json), otherwise they won't work

- **Cross-origin requests**: If you use `GM_xmlhttpRequest` to make requests to external domains, add those specific domains to the `connect` array. Example: `"connect": ["api.github.com", "cdn.example.com"]`. Avoid using `"*"` wildcard for security reasons.

- **Multiple userscripts**: Duplicate this template folder for each userscript project

- **Source maps**: Use `npm run dev` for development builds with inline source maps to debug TypeScript in browser DevTools. Production builds (`npm run build`) exclude source maps for smaller file size.

- **Tree-shaking**: Unused exports are automatically removed from the bundle. Only code you actually import and use will be included

- **Background tabs**: `waitForElement` polls with `requestAnimationFrame`, which browsers pause in background tabs — polling resumes and the timeout fires once the tab is visible again.

## Customization

### Adding Dependencies

You can install and use npm packages:

```bash
npm install <package-name>
```

Then import them in your TypeScript files:

```typescript
import { someFunction } from 'package-name';
```

### Modifying Build Configuration

Edit `rollup.config.js` to customize the build process:
- Change output format
- Add additional plugins
- Enable/disable source maps (set `sourcemap: true` for debugging)
- etc.

### TypeScript Configuration

Edit `tsconfig.json` to adjust TypeScript compiler options:
- Target ECMAScript version
- Strict mode settings
- Library inclusions
- `noUnusedLocals` and `noUnusedParameters` - Reports unused variables/parameters at compile time
- etc.

### Linting and Formatting

The template includes ESLint and Prettier:

**Configuration files:**
- `eslint.config.js` - ESLint rules (TypeScript-aware)
- `.prettierrc` - Code formatting preferences
- `.prettierignore` - Files to skip formatting

**Customization:**
- Modify `eslint.config.js` to add/change linting rules
- Update `.prettierrc` for different formatting preferences
- Add GM globals to ESLint if you use additional GM functions

## Scripts Reference

| Command | What it does |
|---|---|
| **Setup (one-time)** | |
| `npm run setup` | Interactive project setup wizard — configures all files, records template provenance, and installs dependencies. Self-deletes after running. |
| **Build** | |
| `npm run build` | Build the userscript for production (no sourcemaps) |
| `npm run dev` | Watch mode for development (with inline sourcemaps) |
| `npm run watch` | Watch mode (alias of dev) |
| **Testing** | |
| `npm test` | Run tests once |
| `npm run test:watch` | Watch mode for tests |
| `npm run test:ui` | Interactive test UI dashboard |
| `npm run test:coverage` | Generate coverage report (80% thresholds enforced in CI) |
| **Code Quality** | |
| `npm run lint` | Check TypeScript files for linting errors |
| `npm run lint:fix` | Auto-fix TypeScript linting errors |
| `npm run lint:scripts` | Check JavaScript files in scripts/ |
| `npm run lint:scripts:fix` | Auto-fix JavaScript linting errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check if code is formatted |
| `npm run type-check` | Run TypeScript type checking (includes unused code detection) |
| `npm run check-duplicates` | Detect duplicated code (jscpd, 5% threshold) |
| **Validation** | |
| `npm run check-grants` | Validate GM API grants |
| `npm run check-links` | Check for broken links in markdown files |
| `npm run validate` | Run all checks including tests (recommended before committing) |

## Installing your build

### Build locally from a clone

Users can clone your repo and build manually:

```bash
git clone https://github.com/user/repo.git
cd repo
npm install
npm run build
# Install dist/userscript.user.js in Tampermonkey/Greasemonkey
```

### Development installation

For development, you can use Tampermonkey's built-in editor or a local file:

```bash
npm run dev  # Watch mode with sourcemaps
# Point Tampermonkey to file:///path/to/dist/userscript.user.js
```