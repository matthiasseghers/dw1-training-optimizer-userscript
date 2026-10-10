# Common problems and fixes

### Build fails with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Linting errors about GM_ functions
- TypeScript handles GM_ type checking via `@types/tampermonkey`
- Add GM functions you use to `meta.json` grants
- Run `npm run check-grants` to validate

### Userscript not working in browser
- Check that all GM functions are listed in `meta.json` grants
- Verify the `@match` pattern matches your target URLs
- Check browser console for errors

### TypeScript errors
- Ensure `@types/tampermonkey` is installed: `npm install --save-dev @types/tampermonkey`
- Run `npm run type-check` to see all type errors
- Check that your tsconfig.json is properly configured

### Format/lint errors before commit
- Run `npm run validate` to check everything at once
- Use `npm run lint:fix` and `npm run format` to auto-fix issues

### Release failed
- The Release workflow bumps, tags, builds, and publishes in a single run — if a later step failed after the bump, re-run it with bump type `none` to re-release the existing tag
- Check that `meta.json`'s version matches the tag you are releasing