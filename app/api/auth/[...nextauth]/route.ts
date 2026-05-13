/**
 * NextAuth.js route handler.
 *
 * This route handles authentication in SSR mode (standard Next.js deployment).
 *
 * In SPA mode (output: "export"), this entire directory is temporarily
 * excluded during build - see scripts/build-spa.sh. In K8s deployments,
 * all /api/auth/* requests are handled by the FastAPI backend instead.
 */
import { handlers } from "@/src/lib/auth";

export const { GET, POST } = handlers;
