# All Hands AI Website

## Blog

### Creating a new blog post

1. Create a new markdown file in [`src/posts/`](./src/posts/) with the following frontmatter at the top of the file:

    ```markdown
    ---
    title: "Title of the blog post"
    excerpt: "Excerpt of the blog post"
    coverImage: "/assets/blog/path/to/cover-image.jpg"
    date: "2024-07-15T12:35:00.000Z"
    authors:
      - name: Author Name
        link: link-to-your-website
        picture: "/assets/blog/path/to/author.jpg"
    ogImage:
      url: "/assets/blog/path/to/cover-image.jpg"
    ---
    ```

2. Once you are done writing the blog post, make sure that the file name starts with the date of the blog post in the format `YYYYMMDD`. For example, `20240715-title-of-blog-post.md`.
3. Import the blog post in [`src/posts/index.ts`](./src/posts/index.ts) to make it available on the website:

    ```ts
    import ANY_NAME_YOU_WANT from './20240715-title-of-blog-post.md?raw'; // Note the `?raw` at the end (see <https://vitejs.dev/guide/assets#importing-asset-as-string>)

    export const RAW_POSTS = [
      // Add more blog posts here
      ANY_NAME_YOU_WANT,
    ];
    ```

4. Confirm that the blog post is displayed correctly on the blog page.

#### How does the app rank blog posts?

The app ranks blog posts based on the date of the blog post. The most recent blog post will be displayed first. The date of the blog post is extracted from the frontmatter of the markdown file.

[`src/routes/blog.tsx`](./src/routes/blog.tsx#L12):

`blogs.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());`

#### How does the app display the blog post assets?

Please note that the path to the assets in the frontmatter should be relative to the `public` directory. Notice that the path to the assets in the frontmatter starts with `/assets/blog/`. This is because the assets are stored in the [`public/assets/blog/`](./public/assets/blog/) directory.
