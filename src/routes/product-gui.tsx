import { redirect } from 'react-router';

export const loader = () => redirect('/product/agent-canvas', 301);

export default function ProductGuiRedirect() {
  return null;
}
