# About this implementation

> Authored for this app, from reading `extension.js` and `README.md` in the `holons-hangout` folder. Not imported from another repository.

## What it is

Holons is a Canvas app: one browser-only JavaScript file (`extension.js`, no dependencies) that shows a Holons community as a team chat. It is a client for a server called `holons-api`. It is not a server and stores no community data of its own.

How Holons are shown as chat:

| In Holons | In this app |
|---|---|
| A Holon (community) | A workspace: one round button in the left icon rail |
| Its feed | The channel named `feed` |
| Its courses and their modules | Channels listed under "Courses" in the second column |
| Its members | The team panel on the right |
| A post (title and Markdown text) | A message |
| A comment on a post | A reply under that message |

## Two modes

| | Demo | Connected |
|---|---|---|
| Data | Sample Holons built in memory when the app opens | Whatever your `holons-api` server returns |
| Who you are | A made-up user called "You" | The account you signed in with |
| Saved after reload | No | Yes, on the server (courses excepted, see below) |
| Header chip | "Demo" | "Connected" |

Demo has three sample Holons (Open Source Academy, Garden Circle, Night Owls Chess), sample people, posts, replies, and a course with modules. All of that is invented sample data. Everything you do in Demo works the same way as when connected, but disappears when you reload.

## What works

- Browse Holons, the feed, courses, modules and team members.
- Create, edit and delete a Holon (only its creator, or an admin, can on the server).
- Join and leave a Holon.
- Write, edit and delete posts, and reply, edit and delete replies. Messages are shown as Markdown.
- Create courses and modules, reorder modules and mark them complete.
- Sign in, sign up and sign out against a server.
- Read these docs, and drag the column edges to resize the Holons list and the team panel.

## What is real and what is not

- **Courses and modules are never saved on the server.** `holons-api` has no course or module routes. When connected, the app keeps them in this browser only and labels them "Local only, not saved to the server". Nobody else sees them.
- **Inviting people is not available.** The server has no invite route, and a membership needs a numeric user id with no way to look a person up. The team panel says so.
- **Post titles and author ids are missing from the server's answers.** The app remembers the titles it wrote in this session, treats a Holon as yours when the server lists it under your created Holons, and treats a post or reply as yours when this browser created it. The server's refusal (HTTP 403) is always the final word.
- **Sign up, sign out and learning your own user id use routes that were not verified.** See the README of this app.

## What is stored in your browser

| Key (localStorage) | Contents |
|---|---|
| `holons-hangout:v1` | Server address, sign-in token, email, your user id (when known), and the ids of posts and replies this browser created |
| `holons-hangout:local-courses:v1` | Courses and modules you made while connected, per server address |
| `grip:holons-hangout` | The widths you dragged the Holons list and team panel to |

The password is sent once to the server and never stored.

## Security notes

- Text is put on the page as text. Markdown from posts and from these docs is built as page elements, never as HTML, so a post cannot inject script. Links in posts may be `http`, `https` or `mailto`; links in these docs may only be `http` or `https`. Links open in a new tab with `noopener noreferrer`.
- The sign-in token is kept in `localStorage`, which any script on the same page origin can read. Use a server you trust.
- The app talks to whatever address you type. The `holons-api` clone this was written against allows requests from any origin (CORS `*`, marked FIXME in its source), which is what lets a browser page call it; that is a server setting, not something this app controls.
- Connecting over plain `http://` sends your password and token unencrypted. Use `https://` anywhere beyond your own machine.

## Limits

- Everything is fetched in full: the app asks for all posts and all comments and filters them by Holon in the browser, because the server has no filter. Large communities will be slow.
- There is no live update. You see new content after an action or a reload.
- Not run against a real server by the author of these pages; see the README's list of verified and unverified routes.
