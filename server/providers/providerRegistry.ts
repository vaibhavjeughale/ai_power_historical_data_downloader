import { MarketDataProvider } from './types';
import { YahooFinanceProvider } from './yahooFinanceProvider';
import { MockSandboxProvider } from './mockSandboxProvider';
import { DataProviderInfo } from '../../src/types/market';

class ProviderRegistry {
  private providers: Map<string, MarketDataProvider> = new Map();
  private defaultProviderId: string = 'yahoo';

  constructor() {
    this.register(new YahooFinanceProvider());
    this.register(new MockSandboxProvider());
  }

  register(provider: MarketDataProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId?: string): MarketDataProvider {
    const id = providerId || this.defaultProviderId;
    const provider = this.providers.get(id);
    if (!provider) {
      // Fallback to default
      const defaultProvider = this.providers.get(this.defaultProviderId);
      if (!defaultProvider) {
        throw new Error(`Data provider '${id}' is not registered.`);
      }
      return defaultProvider;
    }
    return provider;
  }

  getAllProviders(): DataProviderInfo[] {
    return Array.from(this.providers.values()).map(p => p.getInfo());
  }

  setDefaultProvider(id: string): void {
    if (this.providers.has(id)) {
      this.defaultProviderId = id;
    }
  }

  getDefaultProviderId(): string {
    return this.defaultProviderId;
  }
}

export const providerRegistry = new ProviderRegistry();
