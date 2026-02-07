# CI Build Fix: @apex/middleware

## Issues Resolved
1. **Missing Root `tsconfig.json`**: The package configuration was extending a file that didn't exist in the project root, causing `tsc` to fail.
2. **Missing `express` Types**: The middleware used `express` types but didn't list `@types/express` in its dependencies.

## Changes
- Created `tsconfig.json` in the root directory.
- Added `@types/express` to `packages/middleware/package.json`.

## Command to Verify
```bash
bun turbo run build --filter=@apex/middleware
```
