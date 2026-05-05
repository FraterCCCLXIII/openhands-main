import { HttpAdapter } from "@/src/lib/adapters/http-adapter";
import { McpAdapter } from "@/src/lib/adapters/mcp-adapter";
import { MockAdapter } from "@/src/lib/adapters/mock-adapter";
import { AdapterRegistry } from "@/src/lib/core/adapter-registry";
import type { ContextRepository } from "@/src/lib/core/repository";
import { IntegrationsHubService } from "@/src/lib/core/service";
import { PostgresRepository } from "@/src/lib/db/postgres-repository";
import { NotificationPublisher } from "@/src/lib/notifications/publisher";
import { assertIntegrationsHubStorageAvailable, hasPersistentIntegrationsHubStorage } from "@/src/lib/persistence";

const globalForIntegrationsHub = globalThis as typeof globalThis & {
  integrationsHubRepository?: ContextRepository;
  integrationsHubService?: IntegrationsHubService;
};

export const getIntegrationsHubRepository = () => {
  if (!globalForIntegrationsHub.integrationsHubRepository) {
    if (hasPersistentIntegrationsHubStorage()) {
      globalForIntegrationsHub.integrationsHubRepository = new PostgresRepository();
    } else {
      // No DB configured — hard-fail in production/development.
      // Tests inject a PGlite-backed PostgresRepository via the neon mock
      // and set POSTGRES_URL so this branch is never reached in CI.
      assertIntegrationsHubStorageAvailable();
    }
  }

  return globalForIntegrationsHub.integrationsHubRepository!;
};

export const getIntegrationsHubService = () => {
  if (!globalForIntegrationsHub.integrationsHubService) {
    const repository = getIntegrationsHubRepository();

    const registry = new AdapterRegistry({
      http: new HttpAdapter(),
      mcp: new McpAdapter(),
      mock: new MockAdapter(),
    });

    globalForIntegrationsHub.integrationsHubService = new IntegrationsHubService(
      repository,
      registry,
      new NotificationPublisher(repository),
    );
  }

  return globalForIntegrationsHub.integrationsHubService;
};
