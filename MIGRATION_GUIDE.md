# Migration Guide: Userscript to TypeScript Template

This guide walks you through migrating an existing userscript to the TypeScript template, transforming monolithic JavaScript into modular, typed, testable code. **The examples are generic and intentionally framework-agnostic—adapt them to your specific userscript.**

## Why Migrate?

**Benefits:**

The reasons are the ones listed in the README: type safety, modularity, tests, tooling.

**Trade-offs:**
- Initial time investment (varies by project size)
- Learning curve if new to TypeScript
- Build step required (no more direct editing)

## Prerequisites

- Basic TypeScript knowledge (or willingness to learn)
- Understanding of your original userscript's functionality
- Node.js 20+ and npm installed

## Migration Process

### Phase 1: Setup (30 minutes)

1. **Create project from template**
   ```bash
   # Use the template on GitHub ("Use this template" button) or clone directly
   git clone https://github.com/yourusername/typescript-userscript-template.git my-userscript
   cd my-userscript
   ```

2. **Run setup**
   ```bash
   npm run setup
   ```
   The interactive wizard patches `package.json`, `meta.json`, and `README.md` with your project details, resets the version to `0.1.0`, and installs dependencies.

3. **Configure metadata**
   
   Adjust `meta.json`'s `match` and `grant` for your target site:
   ```json
   {
     "name": "Your Userscript Name",
     "version": "0.1.0",
     "description": "...",
     "author": "Your Name",
     "match": ["https://example.com/*"],
     "grant": [],
     "run-at": "document-end"
   }
   ```

4. **Test the build**
   ```bash
   npm run build
   # Verify dist/userscript.user.js was created
   ```

### Phase 2: Analysis (1-2 hours)

Before writing code, analyze your legacy script:

1. **Identify major components**
   - What does the script do? (List main features)
   - What external libraries does it use? (@require)
   - What DOM elements does it interact with?
   - What GM APIs does it use? (Add to `grant` in meta.json)

2. **Map out data structures**
   - What data does the script work with?
   - What are the main data types?
   - What state is tracked?

3. **List functions and their purposes**
   - Group related functions together
   - Identify utility functions vs. core logic
   - Note dependencies between functions

**Example Analysis Template (fill this in for your project):**
```
Features:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Data Types/Entities:
- [Entity name]: { property1, property2, ... }
- [Entity name]: { property1, property2, ... }

External Dependencies:
- [Library name if any]

GM APIs Used:
- [List any GM_getValue, GM_setValue, etc.]
```

**Real-world example:**
For a shopping site helper: Features: Extract prices, Compare across stores, Save favorites. Data: Product { id, name, price }, Cart { items }. APIs: GM_setValue, GM_getValue


### Phase 3: Type Definitions (1-2 hours)

Start with TypeScript types—they guide the rest of the migration. **TODO items show where to add your specific types.**

1. **Create domain types** (`src/types/domain.ts`)
   ```typescript
   /**
    * TODO: Replace DataEntity with your actual entity name
    * Examples: Product, Task, Comment, Post, User, etc.
    */
   export interface DataEntity {
     id: string | number;
     // Add your properties here
   }

   /**
    * TODO: Define your app's state shape
    */
   export interface AppState {
     // items: DataEntity[]
     // isLoading?: boolean
     // error?: string | null
   }

   /**
    * Generic result type for operations that might fail
    */
   export type Result<T> = 
     | { success: true; data: T }
     | { success: false; error: string };
   ```

2. **Add external library types** (`src/types/external.d.ts`)
   ```typescript
   /**
    * TODO: Add type definitions if you use @require
    * Replace 'externalLib' with the actual global name
    */
   declare global {
     interface Window {
       externalLib?: {
         method(arg: unknown): unknown;
         // Add other methods your library exposes
       };
     }
   }
   ```

3. **GM API types** (automatically available)
   ```typescript
   // @types/tampermonkey provides GM_* functions
   // If you need custom definitions, add them here:
   declare global {
     function GM_setValue(name: string, value: any): void;
     function GM_getValue(name: string, defaultValue?: any): any;
   }
   ```


### Phase 4: Module Structure (2-4 hours)

Break your code into focused modules. This recommended order keeps dependencies clear:

#### 1. Constants (`src/constants.ts`)
Extract magic strings and values. **TODO: Add your actual selectors and config:**
```typescript
export const SELECTORS = {
  MAIN_CONTAINER: '#main',
  BUTTON_ACTION: '.action-btn',
  INPUT_FIELD: 'input[type="text"]',
  // Add more as needed
} as const;

export const CONFIG = {
  DEBOUNCE_DELAY: 300,
  TIMEOUT_MS: 5000,
  RETRY_COUNT: 3,
} as const;

export const STORAGE_KEYS = {
  PREFERENCES: 'userscript_prefs',
  CACHE: 'userscript_cache',
} as const;
```

#### 2. Utilities (`src/utils.ts`)
General-purpose helpers:
```typescript
// TODO: Add your utility functions
export function formatData(value: unknown): string {
  return String(value);
}

export function parseInput(value: string): number | null {
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

// Rate limiting
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function log(message: string): void {
  console.log(`[MyScript] ${message}`);
}
```

#### 3. DOM Utilities (`src/dom-utils.ts`)
Type-safe DOM helpers:
```typescript
import { SELECTORS } from './constants';

export function getElement<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

export function getAllElements<T extends HTMLElement>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector));
}

export function createElement(tag: string, className?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

// TODO: Add domain-specific DOM helpers
export function getMainContainer(): HTMLElement | null {
  return getElement(SELECTORS.MAIN_CONTAINER);
}
```

#### 4. State Management (`src/state.ts`)
Centralize your app's data. **TODO: Adapt to your data structure:**
```typescript
import type { AppState } from './types/domain';

let state: AppState = {
  // TODO: Initialize with your actual state shape
  // items: [],
  // isInitialized: false,
};

export function getState(): Readonly<AppState> {
  return { ...state };
}

export function updateState(updates: Partial<AppState>): void {
  state = { ...state, ...updates };
}

export function clear(): void {
  // TODO: Reset state if needed
}
```

#### 5. Core Logic (One or more files)
Split business logic by responsibility. **TODO: Adapt to your features:**

```typescript
// src/parser.ts - Extract data from the page
import type { DataEntity } from './types/domain';

export function parsePageData(): DataEntity[] {
  // TODO: Extract and return your data
  const elements = document.querySelectorAll('[data-item]');
  return Array.from(elements).map(el => ({
    id: el.getAttribute('data-id') || '',
    // Map other properties
  }));
}

// src/processor.ts - Process/transform data
import type { DataEntity, Result } from './types/domain';

export function processData(data: DataEntity[]): Result<DataEntity[]> {
  try {
    const processed = data.filter(item => !!item.id);
    return { success: true, data: processed };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// src/storage.ts - Handle persistent storage
import { STORAGE_KEYS } from './constants';

export function loadPreferences(): Record<string, any> {
  const stored = GM_getValue(STORAGE_KEYS.PREFERENCES, '{}');
  return typeof stored === 'string' ? JSON.parse(stored) : stored;
}

export function savePreferences(prefs: Record<string, any>): void {
  GM_setValue(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
}
```

#### 6. UI Components (`src/ui.ts`)
Create and update the UI. **TODO: Build your UI:**
```typescript
import type { DataEntity } from './types/domain';
import { createElement } from './dom-utils';

export function createResultsContainer(): HTMLElement {
  const container = createElement('div', 'results-container');
  // TODO: Build your UI structure
  return container;
}

export function updateResultsDisplay(items: DataEntity[]): void {
  const container = document.querySelector('.results-container');
  if (!container) return;
  container.innerHTML = items.map(item => `<div>${item.id}</div>`).join('');
}

export function showLoadingState(loading: boolean): void {
  const indicator = document.querySelector('.loading');
  if (indicator) indicator.style.display = loading ? 'block' : 'none';
}
```

#### 7. Event Handlers (`src/events.ts`)
Handle user interactions. **TODO: Add your event listeners:**
```typescript
import { updateState } from './state';

export function attachEventListeners(): void {
  document.addEventListener('click', handleClick);
  document.addEventListener('change', handleChange);
}

function handleClick(event: Event): void {
  const target = event.target as HTMLElement;
  
  if (target.matches('.action-btn')) {
    // TODO: Handle your button clicks
  }
}

function handleChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  
  if (target.matches('input[type="text"]')) {
    // TODO: Handle input changes
  }
}
```

#### 8. Observers (`src/observers.ts`)
Monitor for DOM/page changes. **TODO: Define what to watch:**
```typescript
export function monitorPageChanges(): void {
  const observer = new MutationObserver(() => {
    // TODO: What should happen when the page changes?
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
```

#### 9. Main Entry Point (`src/index.ts`)
Tie everything together:
```typescript
import { log } from './utils';
import { parsePageData } from './parser';
import { processData } from './processor';
import { updateResultsDisplay } from './ui';
import { attachEventListeners } from './events';
import { monitorPageChanges } from './observers';
import { updateState } from './state';

async function main(): Promise<void> {
  try {
    log('Initializing userscript...');
    
    const data = parsePageData();
    const result = processData(data);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    updateState({ items: result.data });
    updateResultsDisplay(result.data);
    attachEventListeners();
    monitorPageChanges();
    
    log('Userscript initialized');
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

main();
```


### Phase 5: Testing (1-2 hours)

Write tests to verify your modules work correctly. The template includes Vitest.

1. **Test utilities** (`tests/utils.test.ts`)
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { parseInput, debounce } from '../src/utils';

   describe('utils', () => {
     it('should parse valid numbers', () => {
       expect(parseInput('123')).toBe(123);
       expect(parseInput('0')).toBe(0);
     });

     it('should return null for invalid input', () => {
       expect(parseInput('abc')).toBe(null);
     });
   });
   ```

2. **Test parsing logic** (`tests/parser.test.ts`)
   ```typescript
   import { describe, it, expect, beforeEach } from 'vitest';
   import { parsePageData } from '../src/parser';

   describe('parsePageData', () => {
     beforeEach(() => {
       // Set up test DOM
       document.body.innerHTML = `
         <div data-item data-id="1">Item 1</div>
         <div data-item data-id="2">Item 2</div>
       `;
     });

     it('should extract items from page', () => {
       const items = parsePageData();
       expect(items).toHaveLength(2);
       expect(items[0].id).toBe('1');
     });
   });
   ```

3. **Run tests**
   ```bash
   npm test                 # Run once
   npm run test:watch      # Watch mode during development
   npm run test:coverage   # See coverage report
   npm run test:ui         # Interactive UI dashboard
   ```

### Phase 6: Validation & Deployment (1 hour)

1. **Run all checks**
   ```bash
   npm run validate
   # Runs: lint, format:check, type-check, tests, grant checks, duplicate check, build
   ```

2. **Test in browser**
   - Copy `dist/userscript.user.js` to Tampermonkey
   - Verify all features work
   - Check browser console for errors

3. **Compare with original**
   - Test the same scenarios in both versions
   - Ensure behavior is identical (or improved)

4. **Update documentation**
   - Update README.md with project-specific info
   - Document any changes from original behavior
   - Add usage examples

5. **Commit and deploy**
   ```bash
   git add .
   git commit -m "feat: migrate to TypeScript"
   git push
   # GitHub Actions will build and deploy automatically
   ```

## Common Patterns

### Pattern 1: Converting Global Variables to State

**Before:**
```javascript
var globalData = null;
var globalConfig = {};
```

**After (TypeScript + Modules):**
```typescript
// src/state.ts
let state = { data: null, config: {} };

export function getState() {
  return { ...state };
}

export function setState(updates) {
  state = { ...state, ...updates };
}
```

### Pattern 2: Breaking Down Large Functions

**Before (monolithic):**
```javascript
function doEverything() {
  // 200 lines of mixed concerns
  var data = extractDataFromPage();
  var results = processTheData(data);
  updateTheUIWithResults(results);
  handleErrors();
}
```

**After (modular):**
```typescript
// Each function in its own file, single responsibility
// src/parser.ts
export function extractDataFromPage() { ... }

// src/processor.ts
export function processTheData(data) { ... }

// src/ui.ts
export function updateTheUIWithResults(results) { ... }

// src/index.ts - Orchestrate it all
async function main() {
  const data = extractDataFromPage();
  const results = processTheData(data);
  updateTheUIWithResults(results);
}
```

### Pattern 3: Type-Safe Event Handlers

**Before (no type safety):**
```javascript
input.addEventListener('input', function(e) {
  var value = e.target.value;  // any type
  doSomething(value);
});
```

**After (typed):**
```typescript
function handleInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = input.value;  // Browser knows this is a string
  doSomething(value);
}

input.addEventListener('input', handleInput);
```

### Pattern 4: External Library Integration

**Before (unsafe global):**
```javascript
// @require https://example.com/library.js
var result = window.Library.method(data);  // no types
```

**After (typed):**
```typescript
// src/types/external.d.ts
declare global {
  interface Window {
    Library: {
      method(data: InputType): OutputType;
    };
  }
}

// typed — autocomplete works
const result = window.Library?.method(data);
```


## Tips & Gotchas

### Tree-Shaking

Rollup will remove unused code, so make sure you actually call exported functions:

```typescript
// Removed if never imported/called
export function unusedFunction() { ... }

// Stays because it's called
export function usedFunction() { ... }
usedFunction();  // keep this call, or tree-shaking drops the function
```

### Debugging with Sourcemaps

Development builds include sourcemaps for easier debugging:

```bash
npm run dev  # Watch mode with sourcemaps
```

In browser DevTools:
- You'll see original TypeScript filenames
- Set breakpoints in your actual source code
- Step through TypeScript, not compiled output

### Common Mistakes

1. **Not adding GM APIs to `grant` array** → Userscript functions won't work
2. **Not testing in browser first** → Works locally but fails on live sites
3. **Missing type definitions for external libraries** → No IDE autocomplete
4. **Not splitting modules early** → Code becomes hard to maintain
5. **Assuming tree-shaking won't remove your code** → Always call/import what you need


## Incremental Migration Strategy

Don't feel you need to migrate everything at once. You can:

1. **Start with utilities**
   - Move helper functions to TypeScript
   - Add types gradually
   - Keep main logic in original script

2. **One feature at a time**
   - Migrate one feature completely
   - Test it works
   - Move to next feature

3. **Keep both versions**
   - Maintain legacy script during transition
   - Users can switch back if needed
   - Remove old version once confident

## Getting Help

- **TypeScript questions:** [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Testing help:** [Vitest Documentation](https://vitest.dev/)
- **Userscript APIs:** [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php)
- **Template issues:** Open an issue on the template repository

## Conclusion

Migrating to TypeScript requires upfront effort but provides lasting value:

- Catch bugs before they reach users
- Easier to maintain and extend in the future
- Better IDE support (autocomplete, refactoring)
- Tests give confidence when making changes
- CI, linting, and formatting run the same way locally and in GitHub Actions

The key is incremental progress: **analyze → define types → build modules → test → validate**.

Once migrated, template updates work as described in [docs/UPDATING.md](docs/UPDATING.md).
