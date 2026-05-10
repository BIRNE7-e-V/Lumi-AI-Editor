import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { LegalLinks } from '@components/layout/legal-links';
import { getModelPricing } from '@state/lumi-editor/providers';

const USAGE_BY_MODEL_KEY = 'ai_usage_by_model';
const USAGE_LAST_KEY = 'ai_usage_last';

type UsageTotals = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
};
type UsageByModel = Record<string, UsageTotals>;
type UsageLast = {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

function calcTotalCost(byModel: UsageByModel): string {
  let total = 0;
  for (const [modelId, m] of Object.entries(byModel)) {
    const { priceInput, priceOutput } = getModelPricing(modelId);
    total += (m.prompt_tokens * priceInput + m.completion_tokens * priceOutput) / 1_000_000;
  }
  if (total === 0) return '$0.00';
  if (total < 0.0001) return '< $0.0001';
  return `$${total.toFixed(4)}`;
}

function sumTotalTokens(byModel: UsageByModel): number {
  return Object.values(byModel).reduce((acc, m) => acc + m.total_tokens, 0);
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}mil`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function UsageStats() {
  const [byModel, setByModel] = useState<UsageByModel>(() => readJson(USAGE_BY_MODEL_KEY, {}));
  const [last, setLast] = useState<UsageLast | null>(() =>
    readJson<UsageLast | null>(USAGE_LAST_KEY, null)
  );

  useEffect(() => {
    const handler = () => {
      setByModel(readJson(USAGE_BY_MODEL_KEY, {}));
      setLast(readJson<UsageLast | null>(USAGE_LAST_KEY, null));
    };
    window.addEventListener('ai-usage-updated', handler);
    return () => window.removeEventListener('ai-usage-updated', handler);
  }, []);

  const totalTokens = sumTotalTokens(byModel);
  if (totalTokens === 0) return null;

  const costTooltip = Object.entries(byModel)
    .map(([id, m]) => {
      const { label, priceInput, priceOutput } = getModelPricing(id);
      const cost = (m.prompt_tokens * priceInput + m.completion_tokens * priceOutput) / 1_000_000;
      return `${label}: $${cost.toFixed(4)}`;
    })
    .join(' | ');

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/50 font-mono">
      <span title="Kumulierte Tokens">
        <span className="text-base-content/30">Gesamt </span>
        {fmt(totalTokens)} tokens
      </span>
      {last ? (
        <span title={`Letzter Request: ${last.model}`}>
          <span className="text-base-content/30">Letzter Request </span>
          {fmt(last.total_tokens)} tok
        </span>
      ) : null}
      <span title={costTooltip || 'Kosten nach Modell'}>
        <span className="text-base-content/30">Kosten </span>
        {calcTotalCost(byModel)}
      </span>
    </div>
  );
}

export function AppFooter({
  compact = false,
  innerClassName,
}: {
  compact?: boolean;
  innerClassName?: string;
}) {
  return (
    <footer
      className={twMerge(
        'shrink-0 border-t border-base-300 bg-base-100/90 backdrop-blur',
        compact ? 'px-3 py-2 sm:px-4 sm:py-2' : 'px-4 py-3 sm:px-6'
      )}
    >
      <div className={twMerge('flex items-center justify-between gap-4 w-full', innerClassName)}>
        <UsageStats />
        <LegalLinks />
      </div>
    </footer>
  );
}
