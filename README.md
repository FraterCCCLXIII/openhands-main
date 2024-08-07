# All Hands

## Notes

- ~~I need the Quincy CF and Poppins fonts.~~
- ~~Mainpage: Figma has the `h1` have a height of `188px`. I have left the container to hug for now since I am not sure if it is a mistake or not.~~
- ~~I need to organize assets and move them to the `public` folder.~~
- I should outsource the colors used into a theme.
- I need the original PNGs, SVGs, and any other assets used in the design.
  - `white-wave.png` of the footer is not cutoff at the right position for a seamless repeat.

## Questions

- Is it going to require internationalization?
- How will the blog be managed?
- How will the auth be managed?
- Which links in the header / footer navigate to which pages?

## Todo

- Add meta tags.
- Fix fetched contributors data
  - Should display the correct order
  - Should display the correct count
- Add a `404` page.
- Create an "empty image" template (like the one in the blog designs)
- Add client-side form validation for auth routes
- Responseive *mobile* designs for rest of screens, and tablet designs for all screens
- Defer fetching of contributors data (improve performance)
- Component refactoring/grouping
- Animations (`framer-motion` or `react-spring`?)
- Auth
  - Add cookie handling
    - Privacy policy
- ShareDevin?
- Confirm site is accessible
- Confirm site works without JavaScript enabled
- Run through Lighthouse
- e2e testing
- Add a `robots.txt` file.
