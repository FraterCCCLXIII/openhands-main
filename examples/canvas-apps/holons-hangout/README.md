# Holons Hangout

The Hangout / Team Chat experience on Holons (an LMS and social network).

- A Holon is a workspace (icon rail); its feed and courses are channels; members are the team;
  feed posts are threaded messages and comments are replies.
- Orb avatars, markdown messages, composer, welcome page and the "Powered by Kamiji and Kosmos" footer.
- **Connected / Demo** chip: click it to enter a holons-api base URL, email and password.
  The URL and token are kept in this browser's localStorage; without a reachable API the app runs on in-memory sample Holons.

## holons-api endpoints used (checked in `holons-api/config/routes.rb`, controllers and jbuilder views)

`POST /users/tokens/sign_in`, `GET /holons`, `GET /posts`, `POST /posts`, `GET /comments`, `POST /comments`,
`GET /holon_memberships?holon_id=`. The API has no course, module or user endpoints, so live Holons show feed and
team (members appear as "Member #id"); courses and modules exist in Demo mode only. Rails does not filter posts or
comments, so the client filters by holon / post.

Install from Customize, then Apps, using this folder's path. Tests: `npm install && npm test`.
