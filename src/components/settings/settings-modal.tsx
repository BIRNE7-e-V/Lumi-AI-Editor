import { memo, useState } from 'react';

import { useAppActions, useChatState, useEditorState } from '@state';
import { PROVIDERS, getModelPricing } from '@state/lumi-editor/providers';
import { Modal } from '@components/modal';
import { DEFAULT_SYSTEM_PROMPT } from '#/state/chat/prompts';

const USAGE_BY_MODEL_KEY = 'ai_usage_by_model';

type UsageTotals = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
};

type UsageByModel = Record<string, UsageTotals>;

function readUsageByModel(): UsageByModel {
  try {
    const stored = localStorage.getItem(USAGE_BY_MODEL_KEY);
    if (stored) return JSON.parse(stored) as UsageByModel;
  } catch {
    /* ignore */
  }
  return {};
}

function sumTotals(byModel: UsageByModel): UsageTotals {
  const sum = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, request_count: 0 };
  for (const m of Object.values(byModel)) {
    sum.prompt_tokens += m.prompt_tokens;
    sum.completion_tokens += m.completion_tokens;
    sum.total_tokens += m.total_tokens;
    sum.request_count += m.request_count;
  }
  return sum;
}

function calcTotalCost(byModel: UsageByModel): number {
  let total = 0;
  for (const [modelId, m] of Object.entries(byModel)) {
    const { priceInput, priceOutput } = getModelPricing(modelId);
    total += (m.prompt_tokens * priceInput + m.completion_tokens * priceOutput) / 1_000_000;
  }
  return total;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `< $0.01`;
  return `$${usd.toFixed(4)}`;
}

function FieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-control w-full gap-2">
      <div className="space-y-1">
        <span className="label-text text-base-content font-medium">{label}</span>
        {hint && <p className="text-base-content/60 text-xs leading-5">{hint}</p>}
      </div>
      {children}
    </label>
  );
}

export const SettingsModal = memo(function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const editor = useEditorState();
  const chat = useChatState();
  const actions = useAppActions();
  const [systemPromptDraft, setSystemPromptDraft] = useState(
    chat.customSystemPrompt ?? DEFAULT_SYSTEM_PROMPT
  );
  const [usageByModel, setUsageByModel] = useState<UsageByModel>(() => readUsageByModel());

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevCustomPrompt, setPrevCustomPrompt] = useState(chat.customSystemPrompt);
  if (open && (!prevOpen || prevCustomPrompt !== chat.customSystemPrompt)) {
    setPrevOpen(open);
    setPrevCustomPrompt(chat.customSystemPrompt);
    setSystemPromptDraft(chat.customSystemPrompt ?? DEFAULT_SYSTEM_PROMPT);
    setUsageByModel(readUsageByModel());
  }
  if (prevOpen !== open) {
    setPrevOpen(open);
  }

  return (
    <Modal open={open} title="KI-Einstellungen" onClose={onClose}>
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="rounded-box border-base-300 bg-base-200/70 w-full border p-4">
            <div className="flex w-full gap-2">
              <FieldLabel label="Provider">
                <select className="select select-bordered w-full" value={editor.apiConfig.provider}>
                  {Object.entries(PROVIDERS).map(([id, p]) => (
                    <option key={id} value={id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Modell">
                <select
                  className="select select-bordered w-full"
                  value={editor.apiConfig.apiModel}
                  onChange={(event) => actions.apiModelChanged(event.target.value)}
                >
                  {PROVIDERS[editor.apiConfig.provider].availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="API-Token">
                <input
                  className="input input-bordered w-full"
                  placeholder="sk-..."
                  // type="password"
                  value={editor.apiConfig.apiToken}
                  onChange={(event) => actions.apiTokenChanged(event.target.value)}
                />
              </FieldLabel>
            </div>
          </div>
        </div>

        <div className="rounded-box border-base-300 bg-base-200/70 border p-4">
          <FieldLabel
            label={`System Prompt ${systemPromptDraft !== DEFAULT_SYSTEM_PROMPT ? '(benutzerdefiniert)' : ''}`}
            hint="Optional. Überschreibt den automatisch erzeugten Prompt für Lumi."
          >
            <textarea
              className="textarea textarea-bordered min-h-48 w-full"
              placeholder="Optionaler benutzerdefinierter Prompt für Lumi"
              value={systemPromptDraft}
              onChange={(event) => setSystemPromptDraft(event.target.value)}
            />
          </FieldLabel>
        </div>

        <div className="rounded-box border-base-300 bg-base-200/70 border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-text text-base-content font-medium">
              Token-Verbrauch (kumuliert)
            </span>
            <button
              className="btn btn-ghost btn-xs"
              type="button"
              onClick={() => {
                localStorage.removeItem(USAGE_BY_MODEL_KEY);
                setUsageByModel({});
              }}
            >
              Zurücksetzen
            </button>
          </div>
          {Object.keys(usageByModel).length === 0 ? (
            <p className="text-base-content/40 text-xs">Noch keine Anfragen gesendet.</p>
          ) : (
            <>
              {Object.entries(usageByModel).map(([modelId, m]) => {
                const { label, priceInput, priceOutput } = getModelPricing(modelId);
                const cost =
                  (m.prompt_tokens * priceInput + m.completion_tokens * priceOutput) / 1_000_000;
                return (
                  <div key={modelId} className="mb-3 last:mb-0">
                    <p className="text-base-content/70 mb-1 text-xs font-medium">{label}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-base-content/60 text-xs">Anfragen</p>
                        <p className="font-mono font-medium">{formatNumber(m.request_count)}</p>
                      </div>
                      <div>
                        <p className="text-base-content/60 text-xs">Input-Tokens</p>
                        <p className="font-mono font-medium">{formatNumber(m.prompt_tokens)}</p>
                      </div>
                      <div>
                        <p className="text-base-content/60 text-xs">Output-Tokens</p>
                        <p className="font-mono font-medium">{formatNumber(m.completion_tokens)}</p>
                      </div>
                      <div>
                        <p className="text-base-content/60 text-xs">Kosten</p>
                        <p className="font-mono font-medium">{formatCost(cost)}</p>
                        <p className="text-base-content/40 text-xs">
                          ${priceInput}/${priceOutput}/1M
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(usageByModel).length > 1 &&
                (() => {
                  const totals = sumTotals(usageByModel);
                  return (
                    <div className="border-base-300 mt-2 flex items-baseline gap-2 border-t pt-2">
                      <span className="text-base-content/60 text-xs">Gesamt:</span>
                      <span className="font-mono text-sm font-semibold">
                        {formatCost(calcTotalCost(usageByModel))}
                      </span>
                      <span className="text-base-content/40 text-xs">
                        · {formatNumber(totals.total_tokens)} tokens
                      </span>
                    </div>
                  );
                })()}
            </>
          )}
        </div>

        <div className="border-base-300 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setSystemPromptDraft('');
              actions.chatSystemPromptChanged(null);
            }}
          >
            Zurücksetzen
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              Abbrechen
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                actions.chatSystemPromptChanged(
                  systemPromptDraft.trim() ? systemPromptDraft : null
                );
                onClose();
              }}
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
});
