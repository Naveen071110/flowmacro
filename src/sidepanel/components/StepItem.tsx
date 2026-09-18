import React, { useState } from 'react';
import {
  MacroStep,
  StepAction,
} from '../../types/macro';
import {
  MousePointerClick,
  Type,
  ListFilter,
  Send,
  Clock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings2,
  Check,
  Lock,
} from 'lucide-react';

interface StepItemProps {
  step: MacroStep;
  index: number;
  totalSteps: number;
  isActive?: boolean;
  onUpdate: (updatedStep: MacroStep) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const StepItem: React.FC<StepItemProps> = ({
  step,
  index,
  totalSteps,
  isActive,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActionIcon = (action: StepAction) => {
    switch (action) {
      case 'click':
        return <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />;
      case 'type':
        return <Type className="w-3.5 h-3.5 text-blue-400" />;
      case 'select':
        return <ListFilter className="w-3.5 h-3.5 text-amber-400" />;
      case 'submit':
        return <Send className="w-3.5 h-3.5 text-purple-400" />;
      case 'wait':
        return <Clock className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <MousePointerClick className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const hasVariables = step.value && /\{\{[^{}]+\}\}/.test(step.value);

  return (
    <div
      className={`border rounded-lg transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-950/20 shadow-lg'
          : 'border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700'
      }`}
    >
      {/* Header Summary Row */}
      <div className="p-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-mono text-[10px] text-zinc-500 w-4 text-center">
            {index + 1}
          </span>

          <div className="w-6 h-6 rounded bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center flex-shrink-0">
            {getActionIcon(step.action)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-zinc-200 uppercase font-mono">
                {step.action}
              </span>
              {step.isSensitive ? (
                <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800 text-amber-300">
                  <Lock className="w-2.5 h-2.5" />
                  Secret (AES)
                </span>
              ) : hasVariables ? (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-950/70 border border-blue-800 text-blue-300">
                  variable
                </span>
              ) : null}
            </div>

            <div className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px]" title={step.selector}>
              {step.selector}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded transition-colors ${
              isExpanded ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Edit Step Parameters"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Move Up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onMoveDown}
            disabled={index === totalSteps - 1}
            className="p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Move Down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDelete}
            className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
            title="Delete Step"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Inline Editor */}
      {isExpanded && (
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 space-y-3 text-xs">
          {/* Action Selector */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-400 mb-1">Action Type</label>
            <select
              value={step.action}
              onChange={(e) => onUpdate({ ...step, action: e.target.value as StepAction })}
              className="w-full h-7 px-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-600"
            >
              <option value="click">Click Element</option>
              <option value="type">Type Text (Input)</option>
              <option value="select">Select Option</option>
              <option value="submit">Submit Form</option>
              <option value="wait">Wait Delay</option>
            </select>
          </div>

          {/* Primary Selector */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-400 mb-1">
              DOM Selector (Target)
            </label>
            <input
              type="text"
              value={step.selector}
              onChange={(e) => onUpdate({ ...step, selector: e.target.value })}
              className="w-full h-7 px-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-600"
              placeholder="e.g. button#submit or [data-testid='btn']"
            />
          </div>

          {/* Value input (for type / select) */}
          {(step.action === 'type' || step.action === 'select') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                  {step.isSensitive ? (
                    <>
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-300">Protected Secret Placeholder</span>
                    </>
                  ) : (
                    <span>Value (use {'{{name}}'} for vars)</span>
                  )}
                </label>
              </div>
              <input
                type={step.isSensitive ? "password" : "text"}
                value={step.value || ''}
                onChange={(e) => onUpdate({ ...step, value: e.target.value })}
                className="w-full h-7 px-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-600"
                placeholder={step.isSensitive ? "{{AUTO_MACRO_PASSWORD}}" : "e.g. john@doe.com or {{lead_email}}"}
              />
            </div>
          )}

          {/* Wait delay & Checkboxes */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                Post Delay (ms)
              </label>
              <input
                type="number"
                value={step.waitAfterMs}
                onChange={(e) =>
                  onUpdate({ ...step, waitAfterMs: parseInt(e.target.value) || 0 })
                }
                className="w-full h-7 px-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!step.optional}
                  onChange={(e) => onUpdate({ ...step, optional: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                />
                <span className="text-[11px] text-zinc-400">Optional</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!step.isSensitive}
                  onChange={(e) =>
                    onUpdate({
                      ...step,
                      isSensitive: e.target.checked,
                      value: e.target.checked
                        ? step.value?.startsWith('{{')
                          ? step.value
                          : '{{AUTO_MACRO_PASSWORD}}'
                        : step.value,
                    })
                  }
                  className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0"
                />
                <span className="text-[11px] text-amber-300/90 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Sensitive Vault
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
