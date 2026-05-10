import type { ProviderType, ProviderConfig, ModelConfig } from '@state/lumi-editor/types';

// ----------------------------------------------------------------------

export const OPENAI_MODELS: ModelConfig[] = [
  {
    id: 'gpt-5.5',
    label: 'GPT-5.5',
    priceInput: 5.0,
    priceCached: 0.5,
    priceOutput: 30.0,
  },
  {
    id: 'gpt-5.4',
    label: 'GPT-5.4',
    priceInput: 2.5,
    priceCached: 0.25,
    priceOutput: 15.0,
  },
  {
    id: 'gpt-5.4-mini',
    label: 'GPT-5.4 mini',
    priceInput: 0.75,
    priceCached: 0.075,
    priceOutput: 4.5,
  },
];

export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    requiresModel: true,
    defaultModel: 'gpt-5.4',
    availableModels: OPENAI_MODELS,
  },
};

export const DEFAULT_PROVIDER: ProviderType = 'openai';

/** Returns pricing for the given model ID, falling back to GPT-5.4 pricing. */
export function getModelPricing(modelId: string): ModelConfig {
  for (const provider of Object.values(PROVIDERS)) {
    const found = provider.availableModels.find((m) => m.id === modelId);
    if (found) return found;
  }
  // Fallback: GPT-5.4 pricing
  return OPENAI_MODELS[1];
}
