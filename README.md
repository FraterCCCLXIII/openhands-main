# All Hands

## Notes

- I need the original PNGs, SVGs, and any other assets used in the design.
  - `white-wave.png` of the footer is not cutoff at the right position for a seamless repeat.

## Questions

- Is it going to require internationalization?

## Todo

- Fix fetched contributors data
  - Should display the correct order
  - Should display the correct count
- Add a `404` page.
- Responseive *mobile* designs for rest of screens, and tablet designs for all screens
- ShareDevin?
- Confirm site is accessible
- Confirm site works without JavaScript enabled
- e2e testing
- A `robots.txt` file?

## Feedback

- [x] Add OpenDevin screenshot from repo to frontpage product section
- [ ] Reduce size of contributor grid items
- [ ] More padding under the "choose your egine" section
- [x] Navbar should be sticky
- [x] Remove section animation of the sections except for the product section
- [x] Update engine section items
- [ ] Update favicon
- [ ] Navbar should only animate 🙌 when scrolling down, and include "all hands" when at the top
- [ ] Start with default 🙌 then transition to a random color after ~30 seconds
- [x] Sidebar should close when clicking outside of it
- [x] Remove alternate navbar style (only keep sidebar)

## Notes for the designer

The new brand logos under "Choose your engine" section have the following dimensions:

- Mistral Logo: 105 x 48
- Hugging Face Logo: 189 x 48
- Anthropic Logo: 149 x 48
- OpenAI Logo: 149 x 48

## Creating a new blog post

1. Create a new branch from `main` (e.g., `git checkout -b blog/new-post`).
2. Create a new markdown (`.md`) file in the [`posts`](./app/posts/) directory.
3. Upload the necessary assets to the [`assets`](./public/assets/blog/) directory if they don't already exist.
4. Add the following frontmatter to the top of the file:

```markdown
---
title: "Title of the blog post"
excerpt: "A short description of the blog post"
coverImage: "/assets/blog/path/to/cover-image.png" # Optional
date: "2024-08-01T08:00:00.000Z" # ISO 8601 format
author:
  name: "Author's name"
  picture: "/assets/blog/path/to/author-image.png" # Required
ogImage:
  url: "/assets/blog/path/to/og-image.png"
---
```

**Note that the paths to your assets always start with `/assets/blog/`**

5. The file name should be the date of the post followed by the slug (e.g., `20240801-title-of-the-blog-post.md` for posts made on Aug 1, 2024).
6. Commit changes and push/create a PR to preview the blog post on Vercel.
7. Once the PR is merged, the blog post will be live on the website.

### How the blog posts are ordered

The blog posts are ordered by the date in the file name. The latest post will be displayed first. You can get an idea of how they are ordered by observing the file structure in the [`posts`](./app/posts/) directory.

```bash
.
├── 20240801-title-of-the-blog-post.md # Oldest/last post
├── 20240802-title-of-the-next-blog-post.md # Second post
└── 20240803-title-of-the-latest-blog-post.md # Latest post
```
