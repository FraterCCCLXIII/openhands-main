import { redirect } from 'react-router';
import type { Route } from './+types/product-gui';

export const loader = () => redirect('/product/canvas', 301);

export default function ProductGuiRedirect() {
  return null;
}
