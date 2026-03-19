import { ComposioAdapter } from "@/src/lib/adapters/composio-adapter";
import { HttpAdapter } from "@/src/lib/adapters/http-adapter";
import { McpAdapter } from "@/src/lib/adapters/mcp-adapter";
import { MockAdapter } from "@/src/lib/adapters/mock-adapter";
import { AdapterRegistry } from "@/src/lib/core/adapter-registry";
import type { ContextRepository } from "@/src/lib/core/repository";
import { ContextLayerService } from "@/src/lib/core/service";
import { PostgresRepository } from "@/src/lib/db/postgres-repository";
import { NotificationPublisher } from "@/src/lib/notifications/publisher";
import { assertContextLayerStorageAvailable, hasPersistentContextLayerStorage } from "@/src/lib/persistence";

const globalForContextLayer = globalThis as typeof globalThis & {
  contextLayerRepository?: ContextRepository;
  contextLayerService?: ContextLayerService;
};

export const getContextLayerRepository = () => {
  if (!globalForContextLayer.contextLayerRepository) {
    if (hasPersistentContextLayerStorage()) {
      globalForContextLayer.contextLayerRepository = new PostgresRepository();
    } else {
      // No DB configured — hard-fail in production/development.
      // Tests inject a PGlite-backed PostgresRepository via the neon mock
      // and set POSTGRES_URL so this branch is never reached in CI.
      assertContextLayerStorageAvailable();
    }
  }

  return globalForContextLayer.contextLayerRepository!;
};

export const getContextLayerService = () => {
  if (!globalForContextLayer.contextLayerService) {
    const repository = getContextLayerRepository();

    const registry = new AdapterRegistry({
      composio: new ComposioAdapter(),
      http: new HttpAdapter(),
      mcp: new McpAdapter(),
      mock: new MockAdapter(),
    });

    globalForContextLayer.contextLayerService = new ContextLayerService(
      repository,
      registry,
      new NotificationPublisher(repository),
    );
  }

  return globalForContextLayer.contextLayerService;
};
