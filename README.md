# All Hands AI Website

## Building and Viewing the Website

```bash
npm install
```

This is a [Vite + React + TS](https://vitejs.dev/) project. To build the project, run

```bash
npm run build
```

To view the project, run

```bash
npm run dev
```

## Blog

### Creating a new blog post

1. Make sure that all images that are going to be referenced in the blog post are stored in the [`public/assets/blog/YYYYMMDD-title-of-blog-post/`](./public/assets/blog/YYYYMMDD-title-of-blog-post/) directory.

2. Create a new markdown file in [`src/posts/`](./src/posts/) with the following frontmatter at the top of the file (you can reference existing posts for the frontmatter):

    ```markdown
    ---
    title: "Title of the blog post"
    excerpt: "Excerpt of the blog post"
    coverImage: "/assets/blog/YYYYMMDD-title-of-blog-post/title-of-blog-post.jpg"
    date: "2024-07-15T12:35:00.000Z"
    authors:
      - name: Author Name
        link: link-to-your-website
        picture: "/assets/blog/members/name-of-author.jpg"
    ogImage:
      url: "/assets/blog/YYYYMMDD-title-of-blog-post/title-of-blog-post.jpg"
    ---
    ```

3. Once you are done writing the blog post, make sure that the file name starts with the date of the blog post in the format `YYYYMMDD`. For example, `20240715-title-of-blog-post.md`.

4. Import the blog post in [`src/posts/index.ts`](./src/posts/index.ts) to make it available on the website:

    ```ts
    import ANY_NAME_YOU_WANT from './20240715-title-of-blog-post.md?raw'; // Note the `?raw` at the end (see <https://vitejs.dev/guide/assets#importing-asset-as-string>)

    export const RAW_POSTS = [
      // Add more blog posts here
      ANY_NAME_YOU_WANT,
    ];
    ```

5. Confirm that the blog post is displayed correctly on the blog page.

6. **Run the link checker**: After creating a new blog post, run the link checker script to ensure all links are working:

    ```bash
    node scripts/check-links.js src/posts/
    ```

    This script will check all links in the blog posts and report any broken links. Fix any broken links before publishing the blog post.

#### How does the app rank blog posts?

The app ranks blog posts based on the date of the blog post. The most recent blog post will be displayed first. The date of the blog post is extracted from the frontmatter of the markdown file.

[`src/routes/blog.tsx`](./src/routes/blog.tsx#L12):

`blogs.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());`

#### How does the app display the blog post assets?

Please note that the path to the assets in the frontmatter should be relative to the `public` directory. Notice that the path to the assets in the frontmatter starts with `/assets/blog/`. This is because the assets are stored in the [`public/assets/blog/`](./public/assets/blog/) directory.
