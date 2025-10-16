import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('/about', 'routes/about.tsx'),
  route('/blog', 'routes/blog.tsx'),
  route('/blog/:slug', 'routes/blog.$slug.tsx'),
  route('/share', 'routes/share.tsx'),
  route('/tos', 'routes/tos.tsx'),
  route('/privacy', 'routes/privacy-policy.tsx'),
  route('/pricing', 'routes/pricing.tsx'),
  route('/features', 'routes/features.tsx'),
  route('/contact', 'routes/contact.tsx'),
  route('/joinslack', 'routes/joinslack.tsx'),
  route('/sdk', 'routes/sdk.tsx'),
  route('/survey', 'routes/survey.tsx'),
  route('/github', 'routes/github.tsx'),
  route('/contactme', 'routes/contactme.tsx'),
] satisfies RouteConfig;
