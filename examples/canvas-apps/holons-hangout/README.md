# Holons Hangout

The Hangout / Team Chat experience on Holons (an LMS and social network).

- A Holon is a workspace (icon rail); its feed and courses are channels; members are the team;
  feed posts are threaded messages and comments are replies.
- Orb avatars, markdown messages, composer, welcome page and the "Powered by Kamiji and Kosmos" footer.
- **Connected / Demo** chip (or Sign in / Sign up in the header) opens the account dialog. The base URL, token, email and
  user id are kept in this browser's localStorage; the password is sent once and never stored. Without a reachable API the
  app runs on in-memory sample Holons.

## What you can create

| Flow | Demo | Connected |
|---|---|---|
| Sign in, sign out, current user shown | simulated user "You" | yes |
| Sign up (email, password, optional name and nickname) | n/a | yes, route UNVERIFIED |
| Create, edit, delete a Holon (creator only) | in memory | yes |
| Join / leave a Holon, membership badge and team list | in memory | yes |
| New post (title + markdown), edit, delete | in memory | yes, optimistic with rollback |
| Reply, edit, delete a reply | in memory | yes, optimistic with rollback |
| Course, module, reorder, mark complete | in memory | **Local only, not saved to the server** (this browser) |
| Invite a member by email or handle | not available | not available |

All forms are keyboard accessible dialogs (Escape closes, Tab stays inside) with validation, a busy state, and inline
success or error text.

## holons-api endpoints

VERIFIED against `holons-api` (`config/routes.rb`, controllers' `permit` lists, Pundit policies, jbuilder views, `test/test_helper.rb`):

- `POST /users/tokens/sign_in` `{email, password}` (the route name `sign_in_user_tokens_url` is used by the repo's tests)
- `GET /up`
- `GET /holons[?scope=created|joined]`, `POST /holons {holon:{name,description}}`, `PATCH|DELETE /holons/:id` (creator or admin)
- `GET /posts`, `POST /posts {post:{holon_id,title,content}}`, `PATCH|DELETE /posts/:id` (author, holon creator or admin)
- `GET /comments`, `POST /comments {comment:{post_id,content}}`, `PATCH|DELETE /comments/:id` (author or admin)
- `GET /holon_memberships?holon_id=`, `POST /holon_memberships {holon_membership:{holon_id,member_id}}`, `DELETE /holon_memberships/:id` (member, holon creator or admin)

UNVERIFIED (the `devise-api` gem source is not installed on this machine; `config/initializers/devise.rb` does set
`sign_up.enabled = true` with `extra_fields = [:name, :nickname]` and `User` includes `:api`, `:registerable`):

- `POST /users/tokens/sign_up` with top-level `{email, password, name?, nickname?}` (from the gem's documented convention)
- `POST /users/tokens/revoke` with the bearer token (sign out; the token is cleared locally even if this fails)
- `GET /users/tokens/info` and a `resource_owner.id` in the token answer, used to learn your user id. Joining needs that id
  (`member_id`); without it Join is disabled with an explanation.

Not in the API: courses, modules, users, invitations (memberships take a numeric `member_id`, there is no user lookup),
and the jbuilder views omit post `title` and every `author_id`. So the app remembers titles it wrote, treats a Holon as
yours when `?scope=created` lists it, treats a post or reply as yours when this browser created it, and relies on the
server's 403 as the final word. Rails does not filter posts or comments, so the client filters by holon / post.

Install from Customize, then Apps, using this folder's path. Tests: `npm install && npm test`.
