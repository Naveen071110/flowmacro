import React, { useState } from 'react';
import { Macro } from '../../types/macro';
import { Play, Upload, Table, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface BatchRunnerProps {
  macro: Macro;
  onStartReplay: (variables: Record<string, string>, batchData?: Array<Record<string, string>>) => void;
}

export const BatchRunner: React.FC<BatchRunnerProps> = ({
  macro,
  onStartReplay,
}) => {
  const variables = macro.variables || [];
  const [singleVars, setSingleVars] = useState<Record<string, string>>({});
  const [csvRows, setCsvRows] = useState<Array<Record<string, string>>>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'single' | 'batch'>(
    variables.length > 0 ? 'single' : 'single'
  );

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const parsedRows: Array<Record<string, string>> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, colIdx) => {
          row[header] = values[colIdx] || '';
        });
        parsedRows.push(row);
      }

      setCsvRows(parsedRows);
    };
    reader.readAsText(file);
  };

  const handleRun = () => {
    if (activeMode === 'batch' && csvRows.length > 0) {
      onStartReplay({}, csvRows);
    } else {
      onStartReplay(singleVars);
    }
  };

  if (variables.length === 0) {
    return (
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center text-xs text-zinc-400">
        <p>No variables detected in this macro.</p>
        <p className="mt-1 text-zinc-400">
          Tip: Use <span className="font-mono text-zinc-200">{'{{variable_name}}'}</span> in step values to enable dynamic parameterized replay.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-md border border-zinc-800 text-xs font-mono">
        <button
          onClick={() => setActiveMode('single')}
          className={`flex-1 py-1 rounded transition-colors ${
            activeMode === 'single'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Single Run
        </button>
        <button
          onClick={() => setActiveMode('batch')}
          className={`flex-1 py-1 rounded transition-colors ${
            activeMode === 'batch'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Batch CSV Run
        </button>
      </div>

      {activeMode === 'single' ? (
        <div className="space-y-2.5">
          <div className="text-[11px] font-mono text-zinc-400">
            Provide runtime variable values for this execution:
          </div>

          {variables.map((v) => {
            const isSensitive =
              /password|secret|token|apikey|pin|auth/i.test(v) ||
              macro.steps.some((s) => s.isSensitive && s.value?.includes(`{{${v}}}`));

            return (
              <div key={v}>
                <label className="block text-[11px] font-mono text-zinc-300 mb-1 flex items-center gap-1.5">
                  {isSensitive && <Lock className="w-3 h-3 text-amber-400" />}
                  <span>{`{{${v}}}`}</span>
                  {isSensitive && (
                    <span className="text-[10px] text-amber-400/80 font-sans">(Sensitive)</span>
                  )}
                </label>
                <input
                  type={isSensitive ? 'password' : 'text'}
                  placeholder={isSensitive ? '••••••••' : `Value for ${v}...`}
                  value={singleVars[v] || ''}
                  onChange={(e) =>
                    setSingleVars({ ...singleVars, [v]: e.target.value })
                  }
                  className="w-full h-8 px-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-600"
                />
              </div>
            );
          })}

          <button
            onClick={handleRun}
            className="w-full mt-2 h-8 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Replay with Variables</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-[11px] font-mono text-zinc-400">
            Upload a CSV where columns match your variables ({variables.join(', ')}):
          </div>

          <label className="border border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/40 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
            <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
            <span className="text-xs text-zinc-200 font-medium">
              {csvFileName || 'Choose CSV File'}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {csvRows.length > 0
                ? `${csvRows.length} rows parsed`
                : 'Comma separated values (.csv)'}
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>

          {csvRows.length > 0 && (
            <div className="border border-zinc-800 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
              <table className="w-full text-left border-collapse text-[10px] font-mono">
                <thead className="bg-zinc-900 border-b border-zinc-800 sticky top-0">
                  <tr>
                    <th className="p-1.5 text-zinc-400">#</th>
                    {variables.map((v) => (
                      <th key={v} className="p-1.5 text-zinc-300">
                        {v}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {csvRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/30">
                      <td className="p-1.5 text-zinc-400">{idx + 1}</td>
                      {variables.map((v) => (
                        <td key={v} className="p-1.5 text-zinc-300 truncate max-w-[100px]">
                          {row[v] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvRows.length > 5 && (
                <div className="p-1 text-center text-[10px] text-zinc-400 bg-zinc-900/40 border-t border-zinc-800">
                  + {csvRows.length - 5} more rows
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={csvRows.length === 0}
            className="w-full h-8 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute Batch ({csvRows.length} Runs)</span>
          </button>
        </div>
      )}
    </div>
  );
};
