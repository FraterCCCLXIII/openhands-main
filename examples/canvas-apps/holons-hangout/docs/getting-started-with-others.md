# Getting started with others

> Authored for this app, from `README.md` and `extension.js`, and from reading the `holons-api` source on this machine. Steps marked **unverified** were not run by the author.

## What you need

A running `holons-api` server that you and the other people can reach over HTTP(S), an account on it, and a browser. This app is only a client, so "working with others" means everyone signs in to the same server. Without a reachable server the app is a one-person demo.

## 1. Run or find a server

`holons-api` is a separate project (a Ruby on Rails app, `https://github.com/matrix9180/holons-api`). This app does not start it. From its source:

- It listens on port 3000 by default (`PORT` in `config/puma.rb`, `EXPOSE 3000` in its Dockerfile).
- It uses PostgreSQL (`config/database.yml`).
- Its CORS settings allow any origin, which lets this page call it from another address.

How to install, migrate and start it is not documented in that repository (its README is the unedited Rails template), and was not run by the author (**unverified**). If someone else runs a server, ask them for its address and an account.

To let other people in, the server must be reachable from their machines. Prefer an `https://` address; the app sends your password and token to whatever address you give it.

## 2. Connect

1. Open **Holons** from the Canvas navigation. You start in Demo.
2. Press **Sign in** in the header (or the Demo chip).
3. Enter the **holons-api base URL** (for example `http://localhost:3000`), your email and password, and submit.
4. The chip changes to **Connected** and your Holons load. A notice appears instead if the server cannot be reached or rejects the token.

To create an account instead, choose "New here? Sign up". Sign-up and sign-out use routes the README marks **unverified**.

## 3. Check the connection

| Chip | Meaning |
|---|---|
| Connecting... | Waiting for the server |
| Connected | The server answered and accepted your token |
| Demo | Sample data; a notice says why, for example "Showing the demo" |

## 4. Work with others

1. Press **+** in the rail to create a Holon (name and optional description). You become its owner.
2. Other people who have accounts on the same server see it in their rail and press **Join**. Joining needs your user id; if the server did not give it, Join is disabled and says so.
3. Everyone posts in the `feed` channel and replies under posts. You see other people's posts after you open the Holon again or act in it.
4. The team panel lists members by name where known (otherwise "Member #id") and their role.

What you cannot do from here:

- **Invite by email or handle.** The server has no invite route. Memberships are made by each person pressing Join.
- **Share courses.** Courses and modules you create while connected stay in your browser.
- **Moderate beyond what the server allows.** Editing or deleting someone else's post only works if the server says you may (you own the Holon, or you are an admin).

## Troubleshooting

| You see | Likely cause |
|---|---|
| "Could not reach ... Is holons-api running, and does it allow this origin (CORS)?" | Wrong address or port, server not running, or a block from the browser (for example an `https` page calling an `http` server) |
| "Not signed in, or the token expired." | Sign in again |
| "holons-api answered 403" | The server refuses that action for your account |
| Join is disabled | The server did not tell the app your user id (that route is **unverified**) |
| Courses missing for a teammate | Courses are local to each browser by design |

## Your data

Your server address, token and email stay in this browser (see "About this implementation"). Signing out clears the token and the ids of posts this browser created; local courses stay.
