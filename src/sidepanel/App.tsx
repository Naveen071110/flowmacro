import React, { useState, useEffect } from 'react';
import {
  Macro,
  ExecutionStatus,
  ReplayState,
} from '../types/macro';
import { Header } from './components/Header';
import { MacroList } from './components/MacroList';
import { MacroEditor } from './components/MacroEditor';
import { importFromJson } from '../export/json';

export default function App() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<ExecutionStatus>('idle');
  const [replayState, setReplayState] = useState<ReplayState>({
    macroId: null,
    status: 'idle',
    currentStepIndex: 0,
    totalSteps: 0,
    speed: 1,
    logs: [],
  });

  // Load macros and initial state from chrome.storage.local
  useEffect(() => {
    chrome.storage.local.get(
      ['automacro_macros', 'automacro_recording_active', 'automacro_active_recording_id'],
      (res) => {
        if (res.automacro_macros) {
          setMacros(res.automacro_macros);
        }
        if (res.automacro_recording_active) {
          setRecordingStatus('recording');
          if (res.automacro_active_recording_id) {
            setSelectedMacroId(res.automacro_active_recording_id);
          }
        }
      }
    );

    // Fetch initial replay state from background worker
    chrome.runtime.sendMessage({ type: 'GET_REPLAY_STATE' }, (state: ReplayState) => {
      if (state) setReplayState(state);
    });

    // Listen for runtime broadcasts
    const messageListener = (msg: any) => {
      if (msg.type === 'REPLAY_STATE_UPDATE') {
        setReplayState(msg.state);
      } else if (msg.type === 'MACRO_UPDATED') {
        setMacros((prev) =>
          prev.map((m) => (m.macroId === msg.macro.macroId ? msg.macro : m))
        );
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Listen for storage changes
    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.automacro_macros) {
        setMacros(changes.automacro_macros.newValue || []);
      }
      if (changes.automacro_recording_active) {
        setRecordingStatus(changes.automacro_recording_active.newValue ? 'recording' : 'idle');
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  const selectedMacro = macros.find((m) => m.macroId === selectedMacroId);

  // Macro CRUD
  const handleSaveMacro = (updated: Macro) => {
    const next = macros.map((m) => (m.macroId === updated.macroId ? updated : m));
    setMacros(next);
    chrome.storage.local.set({ automacro_macros: next });
  };

  const handleCreateNewMacro = () => {
    const newMacro: Macro = {
      macroId: 'macro_' + Date.now(),
      title: 'New Workflow Macro',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [],
      variables: [],
    };

    const next = [newMacro, ...macros];
    setMacros(next);
    setSelectedMacroId(newMacro.macroId);
    chrome.storage.local.set({ automacro_macros: next });

    // Automatically start recording for newly created macro
    handleStartRecording(newMacro.macroId);
  };

  const handleDeleteMacro = (macroId: string) => {
    const next = macros.filter((m) => m.macroId !== macroId);
    setMacros(next);
    chrome.storage.local.set({ automacro_macros: next });
    if (selectedMacroId === macroId) {
      setSelectedMacroId(null);
    }
  };

  const handleImportJson = (jsonStr: string) => {
    try {
      const imported = importFromJson(jsonStr);
      // Give fresh macroId to avoid collision
      imported.macroId = 'macro_' + Date.now();
      imported.updatedAt = Date.now();
      const next = [imported, ...macros];
      setMacros(next);
      setSelectedMacroId(imported.macroId);
      chrome.storage.local.set({ automacro_macros: next });
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  // Recording Controls
  const handleStartRecording = (macroId: string) => {
    setRecordingStatus('recording');
    chrome.runtime.sendMessage({
      type: 'START_RECORDING',
      macroId,
    });
  };

  const handleStopRecording = () => {
    setRecordingStatus('idle');
    chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
  };

  // Replay Controls
  const handleStartReplay = (
    macro: Macro,
    variables?: Record<string, string>,
    speed?: number,
    batchData?: Array<Record<string, string>>
  ) => {
    chrome.runtime.sendMessage({
      type: 'START_REPLAY',
      macro,
      variables,
      speed,
      batchData,
    });
  };

  const handlePauseReplay = () => {
    chrome.runtime.sendMessage({ type: 'PAUSE_REPLAY' });
  };

  const handleResumeReplay = () => {
    chrome.runtime.sendMessage({ type: 'RESUME_REPLAY' });
  };

  const handleStopReplay = () => {
    chrome.runtime.sendMessage({ type: 'STOP_REPLAY' });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800">
      <Header
        status={
          recordingStatus === 'recording'
            ? 'recording'
            : replayState.status === 'replaying'
            ? 'replaying'
            : 'idle'
        }
        selectedMacroTitle={selectedMacro?.title}
        onBack={selectedMacroId ? () => setSelectedMacroId(null) : undefined}
        onNewMacro={handleCreateNewMacro}
      />

      <main>
        {selectedMacro ? (
          <MacroEditor
            macro={selectedMacro}
            recordingStatus={recordingStatus}
            replayState={replayState}
            onUpdateMacro={handleSaveMacro}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onStartReplay={handleStartReplay}
            onPauseReplay={handlePauseReplay}
            onResumeReplay={handleResumeReplay}
            onStopReplay={handleStopReplay}
          />
        ) : (
          <MacroList
            macros={macros}
            onSelectMacro={(m) => setSelectedMacroId(m.macroId)}
            onDeleteMacro={handleDeleteMacro}
            onQuickReplay={(m) => {
              setSelectedMacroId(m.macroId);
              handleStartReplay(m);
            }}
            onImportJson={handleImportJson}
            onCreateNew={handleCreateNewMacro}
          />
        )}
      </main>
    </div>
  );
}
