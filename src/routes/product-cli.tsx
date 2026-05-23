import { createProductFeatureRoute } from '~/components/product-feature-route';

const route = createProductFeatureRoute('cli');

export const meta = route.meta;
export const handle = route.handle;

export default route.Component;
