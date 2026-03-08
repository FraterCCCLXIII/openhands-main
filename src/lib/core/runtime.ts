import { ComposioAdapter } from "@/src/lib/adapters/composio-adapter";
import { McpAdapter } from "@/src/lib/adapters/mcp-adapter";
import { MockAdapter } from "@/src/lib/adapters/mock-adapter";
import { AdapterRegistry } from "@/src/lib/core/adapter-registry";
import { ContextLayerService } from "@/src/lib/core/service";
import { MemoryRepository } from "@/src/lib/db/memory-repository";
import { PostgresRepository } from "@/src/lib/db/postgres-repository";
import { NotificationPublisher } from "@/src/lib/notifications/publisher";

const globalForContextLayer = globalThis as typeof globalThis & {
  contextLayerService?: ContextLayerService;
};

export const getContextLayerService = () => {
  if (!globalForContextLayer.contextLayerService) {
    const repository = process.env.POSTGRES_URL || process.env.DATABASE_URL
      ? new PostgresRepository()
      : new MemoryRepository();

    const registry = new AdapterRegistry({
      composio: new ComposioAdapter(),
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
