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
- [o] Setup symlinks between dist folders and mafia folder
- [ ] Setup build files for monorepo building
  - [ ] package.json
- [ ] Setup git workflow for release branch

# index.ts
- [x] ~~Create observer that re-attaches click listeners whenever a new frame is loaded~~
  - Observers don't work with frames!
- [x] Add eventlistener to re-attach click listeners whenever frame content reloads
- [x] Update mafia checks to use API calls
- [x] Clean up console logs and unused logic
- [ ] Clean up use of async
- [ ] Need to hardcode certain exceptions into canVisitUrl(), e.g. the Witchess chess can be escaped from at any time.
- [x] Add a timeout to the polling
  - [ ] On timeout, allow user to proceed anyways (or keep waiting?)
- [ ] Allow the ability to toggle waiting
  - [ ] Is there a way to check if a script is currently running to auto-toggle?
- [ ] Extra niceties
  - [ ] Improve polling by disallowing overlapping POST requests
  - [ ] Special hagnk handling

# utils.ts
- [x] Implement (copy) mafia API logic

# dom.ts
- [x] Drawing loading indicator to show when requests have been paused
  - [ ] Add timeout indicator
  - [ ] Add timer
- [ ] Visual indicator that `safe-visit` is active

# misc
- [ ] Allow user to easily disable `safe-visit`
- [ ] Is it possible to also handle and delay chat macros?

# Architecture
- [ ] Possibly refactor mafia API logic into its own script

# Notes
## How It Works
Here is an overview of exactly what `safe-visit` does:
- Relay browser is opened for the first time
  - Relay browser opens to `main.php`; mafia calls `relay/main.js`
  - `main.js` modifies the HTML of `main.php` to include a `<script>` tag in the `<head>` of `<frame name="mainpane">`, linked to `relay/safe-visit/hook.js`[^1]
  - `hook.js` modifies the HTML outside of its `<frame>` to include a `<script>` tag in the `<head>` of the root document (i.e. the "top" of the webpage), linked to `relay/safe-visit/index.js`
  - `index.js` finds all the `<frame>` elements on the page (i.e. charpane, topmenu, mainpane, chatpane), and attaches two event handlers[^2]:
    - The first handler listens for user input (see below)
    - The second handler re-attaches the first handler to the `<frame>` if its contents are reloaded
  - `index.js` remains active on the webpage for the rest of the session (but, doesn't do anything else)
- safe-visit is active
  - On any user inputs (i.e. mouse, keyboard press), the handler:
    - Checks if that input was a "link visit," and, if so, whether or not to handle it
      - If the input should be handled, the link visit is intercepted and paused
    - While paused, the handler asks mafia if the link is "safe" to visit via a `POST` request[^3][^4]
      - If yes, the handler unpauses
      - If not, the handler continues to pause, checking in with mafia at increasing intervals (80ms, 160ms, 320ms, etc.)
        - After 10s, if mafia still says that the link is "unsafe," the handler times out and unpauses
    - Finally, the link is visited as usual

[^1]: Relay scripts only modify the contents of the `<frame>` document they're loaded into, which is reloaded on most actions; in order for injected scripts to persist, they need to exist at the root of the document
[^2]: `<frame>` elements (and `<iframe>`s) do not propegate events upwards, so listeners must be attached to them directly in order to capture things like user input.
[^3]: Browser scripts can interact with mafia via the [Browser JSON API](https://wiki.kolmafia.us/index.php?title=Browser_JSON_API)
[^4]: "Safe visit" criteria is based on [libram `canVisitUrl()` logic](https://github.com/loathers/libram/blob/9e23d8614fafcbf45631dc1634553e12524b3802/src/lib.ts#L936)

## Benchmarks
Informal rough testing on my machine showed that:
- The hook and event listener logic added trivial load times: ~1-2ms
- The API check with mafia added very minor load times: ~10-20ms

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

## Limitations
### Page becomes unavailable while loading
This script can intercept the start of a request to visit a URL, but once the request has been made, the
script cannot prevent the response from being loaded by the browser if it will result in a clash.

For instance: you click on your inventory, and during the time it takes your inventory to load, mafia
enters combat. In this situation, you will load into combat rather than your inventory.

#### Note
When this happens, KOL responds with a 302 status code, with a redirect to the "clash" URL in the
"Location" header property.
- Sometimes this is desired behavior, like aliases (`town.php` => `place.php?whichplace=town`, `island.php` => `bigisland.php`)
- The unwanted behavior would be when `fight.php` or `choice.php` are redirects for...?
  - Anything besides `adventure.php` or `inv_use.php`?
  - How else can combats and inescapable choice adventures be triggered?

### Adventuring and choice adventures
You should **NOT** spend turns or enter choice adventure interactions while using `safe-visit`, as they
will disrupt your active script. `safe-visit` won't stop you from doing so, so it's on you not to.
