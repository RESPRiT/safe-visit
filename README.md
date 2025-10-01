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
- [x] Update mafia checks to use API calls
- [ ] Clean up console logs and unused logic
- [ ] Clean up use of async
- [ ] Need to hardcode certain exceptions into canVisitUrl(), e.g. the Witchess chess can be escaped from at any time.
- [ ] Add a timeout to the polling
- [ ] Allow the ability to toggle waiting
  - [ ] Is there a way to check if a script is currently running to auto-toggle?

# utils.ts
- [x] Implement (copy) mafia API logic

# dom.ts
- [ ] Drawing loading indicator to show when requests have been paused

# Architecture
- [ ] Possibly refactor mafia API logic into its own script

# Notes
## gCLI (and not-so-gCLI)
### Standard gCLI Behavior
In mafia, the gCLI is "single-threaded," in that commands cannot run in parallel, and calling a command
while another command is running results in the command being added to a queue.

### Remote API gCLI Behavior
However, if you make calls to the API endpoint that execute command in the gCLI, you don't have to honor
this single-threaded-ness. For example, if there is a script currently running the gCLI, and then I use
the API endpoint to call another script via `cli_execute`, that other script will start running right
away (and likely break if it requires adventuring).

The "gotcha" is that mafia will stop executing a "remote" (API-based) gCLI command if the source that
requested it, e.g. the browser, does not receive mafia's response, e.g. if you remotely ask mafia to
wait for 10 seconds, and then print "hello" afterwards via a relay script, if you close the browser
tab that made those initial calls, mafia will not execute the print command once the wait resolves.

The above applies to individual commands (mafia needing a response), but mafia will just "run with it"
if everything you want the thread to do is bundled into the initial remote request, i.e. using a wrapper
script, or a really long `ash` or `js` command. This is because the first command always fires instantly.

In other words: each remote request source has their own individual queue, and the queue will be
cleared if the source fails to receive a response from mafia after a queue item is finished executing.

### Practical Usage
The implication is that you can have multiple threads of scripts running at once, so long as you can
affirm to mafia that whoever is handling the script execution (e.g. browser, a server) is still around.

This all makes sense, but is not evidently documented anywhere; the best place to understand this logic
would be to look through the mafia source code yourself, but that's a whole mess of stuff.

Presumably, there is nothing stopping mafia from implementing this into the native UI directly, although
it makes a lot of sense why you wouldn't want to surface that feature, since scripts would need to do a
ton of asynchronous handling for this to work well.

However, for informational scripts, which retrieve information from mafia that is not blocked by other
actions, having additional threads can be quite useful!