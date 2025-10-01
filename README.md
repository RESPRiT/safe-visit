**safe-visit** is a script that allow you use to navigate KOL in the relay browser without "clashing" with ongoing script actions.


TO-DO:
# Build
- [x] Setup build files for mafia relay script
  - [x] package.json
    - [x] deps
    - [x] scripts
  - [x] esbuild
  - [x] babel
  - [x] typescript
  - [x] eslint
- [x] Setup build files for web scripts
  - [x] package.json
    - [x] deps
    - [x] scripts
  - [x] esbuild/vite?
  - [x] typescript
  - [x] eslint
- [ ] Setup symlinks between dist folders and mafia folder
- [ ] Setup build files for monorepo building
  - [ ] package.json
- [ ] Setup git workflow for release branch

# index.ts
- [ ] Create observer that re-attaches click listeners whenever a new frame is loaded
- [ ] Update mafia checks to use API calls
- [ ] Clean up console logs and unused logic

# utils.ts
- [x] Implement (copy) mafia API logic

# Architecture
- [ ] Possibly refactor mafia API logic into its own script