import { ComposioAdapter } from "@/src/lib/adapters/composio-adapter";
import { HttpAdapter } from "@/src/lib/adapters/http-adapter";
import { McpAdapter } from "@/src/lib/adapters/mcp-adapter";
import { MockAdapter } from "@/src/lib/adapters/mock-adapter";
import { AdapterRegistry } from "@/src/lib/core/adapter-registry";
import type { ContextRepository } from "@/src/lib/core/repository";
import { ContextLayerService } from "@/src/lib/core/service";
import { MemoryRepository } from "@/src/lib/db/memory-repository";
import { PostgresRepository } from "@/src/lib/db/postgres-repository";
import { NotificationPublisher } from "@/src/lib/notifications/publisher";
import { assertContextLayerStorageAvailable, canUseEphemeralContextLayerStorage, hasPersistentContextLayerStorage } from "@/src/lib/persistence";

const globalForContextLayer = globalThis as typeof globalThis & {
  contextLayerRepository?: ContextRepository;
  contextLayerService?: ContextLayerService;
};

export const getContextLayerRepository = () => {
  if (!globalForContextLayer.contextLayerRepository) {
    if (hasPersistentContextLayerStorage()) {
      globalForContextLayer.contextLayerRepository = new PostgresRepository();
    } else if (canUseEphemeralContextLayerStorage()) {
      // MemoryRepository is only used in unit tests (NODE_ENV=test).
      // Production deployments without POSTGRES_URL will throw below.
      globalForContextLayer.contextLayerRepository = new MemoryRepository();
    } else {
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
