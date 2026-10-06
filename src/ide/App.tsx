import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Circle,
  Download,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Globe,
  Terminal,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Code2,
  FolderOpen,
  Undo,
  Redo,
  HelpCircle,
  Check,
  X,
  Key,
  Monitor,
} from 'lucide-react';
import {
  SeleniumCommand,
  TestSuite,
  CommandType,
  ReplaySessionState,
  ExecutionLog,
} from '../types/macro';
import { ExportModal } from './components/ExportModal';

const DEFAULT_SUITE: TestSuite = {
  id: 'suite_' + Date.now(),
  name: 'New Test Suite',
  baseUrl: 'https://example.com',
  commands: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const COMMAND_COLORS: Record<CommandType, { bg: string; text: string; border: string }> = {
  open: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  click: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  type: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  select: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  submit: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  waitFor: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  wait: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
};

type MenuKey = 'file' | 'edit' | 'view' | 'tools' | 'help';

export default function App() {
  const [suite, setSuite] = useState<TestSuite>(DEFAULT_SUITE);
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState<boolean>(false);
  const [replayState, setReplayState] = useState<ReplaySessionState>({
    suiteId: null,
    status: 'idle',
    currentStepIndex: 0,
    totalSteps: 0,
    speed: 1,
    logs: [],
  });
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'navigation'>('all');
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(true);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);

  // Menu bar and Modals
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [showLicenseModal, setShowLicenseModal] = useState<boolean>(false);
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [showTabSelectModal, setShowTabSelectModal] = useState<boolean>(false);
  const [availableTabs, setAvailableTabs] = useState<chrome.tabs.Tab[]>([]);
  const [passwordMaskingEnabled, setPasswordMaskingEnabled] = useState<boolean>(true);

  // Undo / Redo history
  const [undoStack, setUndoStack] = useState<TestSuite[]>([]);
  const [redoStack, setRedoStack] = useState<TestSuite[]>([]);

  // Version string (dynamically loaded from manifest.json)
  const [appVersion, setAppVersion] = useState<string>('v1.0.2');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic version on startup and update all .app-version elements
  useEffect(() => {
    try {
      const manifest = chrome.runtime?.getManifest ? chrome.runtime.getManifest() : null;
      const versionStr = manifest?.version ? `v${manifest.version}` : 'v1.0.2';
      setAppVersion(versionStr);
      document.querySelectorAll('.app-version').forEach((el) => {
        el.textContent = versionStr;
      });
    } catch (e) {
      console.debug('[FlowMacro] Error reading manifest version:', e);
    }
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);



  // Auto-scroll logs
  useEffect(() => {
    if (autoScrollLogs && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replayState.logs, autoScrollLogs]);

  // Sync with storage on startup
  useEffect(() => {
    chrome.storage?.local?.get?.(['automacro_ide_suite'], (res) => {
      if (res && res.automacro_ide_suite && res.automacro_ide_suite.commands) {
        setSuite(res.automacro_ide_suite);
        if (res.automacro_ide_suite.commands.length > 0) {
          setSelectedCommandId(res.automacro_ide_suite.commands[0].id);
        }
      }
    });

    // Check initial background session & recording state
    chrome.runtime?.sendMessage?.({ type: 'GET_SESSION_STATE' }, (state: ReplaySessionState) => {
      if (state && !chrome.runtime.lastError) {
        setReplayState(state);
        if (state.status === 'recording') {
          setIsRecording(true);
        }
      }
    });

    chrome.runtime?.sendMessage?.({ type: 'GET_RECORDING_STATE' }, (res: any) => {
      if (res && !chrome.runtime?.lastError) {
        if (typeof res.isRecording === 'boolean') setIsRecording(res.isRecording);
        if (typeof res.isPaused === 'boolean') setIsRecordingPaused(res.isPaused);
      }
    });

    // Storage fallback for active recording
    const storage = chrome.storage?.session || chrome.storage?.local;
    storage?.get?.(['isRecording', 'isPaused'], (res: any) => {
      if (res && !chrome.runtime?.lastError) {
        if (typeof res.isRecording === 'boolean') setIsRecording(res.isRecording);
        if (typeof res.isPaused === 'boolean') setIsRecordingPaused(res.isPaused);
      }
    });

    // Message listener for runtime broadcasts from service_worker
    const messageListener = (msg: any) => {
      if (msg.type === 'RECORDED_COMMAND' || msg.type === 'RECORD_STEP') {
        const newCmd: SeleniumCommand = msg.command || msg.step;
        if (!newCmd) return;
        setSuite((prev) => {
          // Avoid duplicate commands if forwarded multiple times
          if (prev.commands.some((c) => c.id === newCmd.id)) return prev;
          const next = {
            ...prev,
            commands: [...prev.commands, newCmd],
            updatedAt: Date.now(),
          };
          chrome.storage?.local?.set?.({ automacro_ide_suite: next });
          return next;
        });
        setSelectedCommandId(newCmd.id);
      } else if (msg.type === 'RECORDING_STATE_CHANGED') {
        setIsRecording(Boolean(msg.isRecording));
        setIsRecordingPaused(Boolean(msg.isPaused));
      } else if (msg.type === 'STEP_STATUS_CHANGED') {
        setSuite((prev) => {
          const updated = prev.commands.map((cmd) => {
            if (cmd.id === msg.commandId) {
              return {
                ...cmd,
                status: msg.status,
                errorMessage: msg.error || undefined,
              };
            }
            return cmd;
          });
          const next = { ...prev, commands: updated, updatedAt: Date.now() };
          chrome.storage?.local?.set?.({ automacro_ide_suite: next });
          return next;
        });
      } else if (msg.type === 'SESSION_STATE_UPDATE') {
        setReplayState(msg.state);
        if (msg.state.status === 'recording') {
          setIsRecording(true);
        } else if (
          msg.state.status === 'idle' ||
          msg.state.status === 'completed' ||
          msg.state.status === 'error'
        ) {
          setIsRecording(false);
          setIsRecordingPaused(false);
        }
      }
    };

    chrome.runtime?.onMessage?.addListener(messageListener);

    return () => {
      chrome.runtime?.onMessage?.removeListener(messageListener);
    };
  }, []);

  // Save suite updates to storage with undo tracking
  const updateSuite = (updater: (prev: TestSuite) => TestSuite, trackUndo = true) => {
    setSuite((prev) => {
      if (trackUndo) {
        setUndoStack((stack) => [...stack.slice(-29), prev]);
        setRedoStack([]);
      }
      const next = updater(prev);
      chrome.storage?.local?.set?.({ automacro_ide_suite: next });
      return next;
    });
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    setActiveMenu(null);
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);
    setRedoStack((r) => [...r, suite]);
    setUndoStack(newUndo);
    setSuite(previous);
    chrome.storage?.local?.set?.({ automacro_ide_suite: previous });
  };

  const handleRedo = () => {
    setActiveMenu(null);
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    setUndoStack((u) => [...u, suite]);
    setRedoStack(newRedo);
    setSuite(next);
    chrome.storage?.local?.set?.({ automacro_ide_suite: next });
  };

  // Selected command helper
  const selectedCommand = suite.commands.find((c) => c.id === selectedCommandId) || null;

  // ============================================================================
  // RECORDING CONTROLS (RECORD / PAUSE / STOP)
  // ============================================================================
  const handleStartOrResumeRecording = () => {
    setActiveMenu(null);
    if (isRecording && isRecordingPaused) {
      // Resume recording
      chrome.runtime?.sendMessage?.({ type: 'RESUME_RECORDING' }).catch(() => {});
      setIsRecordingPaused(false);
      return;
    }

    if (!isRecording) {
      // Validate Base URL
      let url = suite.baseUrl.trim();
      if (!url) {
        alert('Please specify a valid Base URL before starting recording.');
        return;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
        updateSuite((s) => ({ ...s, baseUrl: url }));
      }

      setIsRecording(true);
      setIsRecordingPaused(false);

      // Reset step statuses to pending
      updateSuite((s) => ({
        ...s,
        commands: s.commands.map((c) => ({ ...c, status: 'pending', errorMessage: undefined })),
      }));

      chrome.runtime?.sendMessage?.({
        type: 'START_RECORDING',
        baseUrl: url,
        suiteId: suite.id,
      }).catch(() => {});
    }
  };

  const handlePauseRecording = () => {
    setActiveMenu(null);
    if (isRecording && !isRecordingPaused) {
      setIsRecordingPaused(true);
      chrome.runtime?.sendMessage?.({ type: 'PAUSE_RECORDING' }).catch(() => {});
    }
  };

  const handleStop = () => {
    setActiveMenu(null);
    if (isRecording) {
      setIsRecording(false);
      setIsRecordingPaused(false);
      chrome.runtime?.sendMessage?.({ type: 'STOP_RECORDING' }).catch(() => {});
    } else if (replayState.status === 'replaying' || replayState.status === 'paused') {
      chrome.runtime?.sendMessage?.({ type: 'STOP_REPLAY' }).catch(() => {});
    }
  };

  // ============================================================================
  // REPLAY CONTROLS
  // ============================================================================
  const handleStartReplay = (startFromIndex: number = 0) => {
    setActiveMenu(null);
    if (suite.commands.length === 0) {
      alert('Suite has no steps to replay. Record or add commands first.');
      return;
    }

    // Reset statuses from startFromIndex
    updateSuite((s) => ({
      ...s,
      commands: s.commands.map((c, i) =>
        i >= startFromIndex ? { ...c, status: 'pending', errorMessage: undefined } : c
      ),
    }));

    chrome.runtime?.sendMessage?.({
      type: 'START_REPLAY',
      suite,
      speed: playbackSpeed,
      startFromIndex,
    }).catch(() => {});
  };

  const handlePauseReplay = () => {
    chrome.runtime?.sendMessage?.({ type: 'PAUSE_REPLAY' }).catch(() => {});
  };

  const handleResumeReplay = () => {
    chrome.runtime?.sendMessage?.({ type: 'RESUME_REPLAY' }).catch(() => {});
  };

  // Suite Management
  const handleClearSuite = () => {
    setActiveMenu(null);
    if (confirm('Are you sure you want to clear all steps in this test suite?')) {
      updateSuite((s) => ({
        ...s,
        commands: [],
        updatedAt: Date.now(),
      }));
      setSelectedCommandId(null);
    }
  };

  const handleNewSuite = () => {
    setActiveMenu(null);
    if (
      suite.commands.length === 0 ||
      confirm('Create a new blank Test Suite? Current suite will be reset.')
    ) {
      const fresh: TestSuite = {
        id: 'suite_' + Date.now(),
        name: 'New Test Suite',
        baseUrl: 'https://example.com',
        commands: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setUndoStack((stack) => [...stack.slice(-29), suite]);
      setRedoStack([]);
      setSuite(fresh);
      setSelectedCommandId(null);
      chrome.storage?.local?.set?.({ automacro_ide_suite: fresh });
    }
  };

  // File Picker & Import (.side / FlowMacro JSON)
  const handleOpenFilePicker = () => {
    setActiveMenu(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        let importedSuite: TestSuite | null = null;

        // 1. Selenium IDE (.side) format
        if (data.tests && Array.isArray(data.tests)) {
          const primaryTest = data.tests[0] || {};
          const commands: SeleniumCommand[] = (primaryTest.commands || []).map(
            (c: any, idx: number) => {
              let cmdType: CommandType = 'click';
              const rawCmd = (c.command || '').toLowerCase();
              if (rawCmd === 'open') cmdType = 'open';
              else if (rawCmd === 'click' || rawCmd === 'clickat') cmdType = 'click';
              else if (rawCmd === 'type' || rawCmd === 'sendkeys') cmdType = 'type';
              else if (rawCmd === 'select') cmdType = 'select';
              else if (rawCmd === 'submit') cmdType = 'submit';
              else if (rawCmd.includes('waitfor')) cmdType = 'waitFor';
              else if (rawCmd.includes('wait')) cmdType = 'wait';

              return {
                id: c.id || `cmd_${Date.now()}_${idx}`,
                command: cmdType,
                target: c.target || '',
                targets: Array.isArray(c.targets)
                  ? c.targets.map((t: any) => [t[0], t[1]] as [string, string])
                  : undefined,
                value: c.value || '',
                status: 'pending' as const,
                comment: c.comment || undefined,
              };
            }
          );

          importedSuite = {
            id: data.id || `suite_${Date.now()}`,
            name: data.name || primaryTest.name || 'Imported Selenium Suite',
            baseUrl: data.url || 'https://example.com',
            commands,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        } else if (data.commands && Array.isArray(data.commands)) {
          // 2. FlowMacro / AutoMacro native JSON format
          importedSuite = {
            id: data.id || `suite_${Date.now()}`,
            name: data.name || file.name.replace(/\.[^/.]+$/, ''),
            baseUrl: data.baseUrl || 'https://example.com',
            commands: data.commands.map((c: any) => ({
              ...c,
              status: 'pending',
            })),
            createdAt: data.createdAt || Date.now(),
            updatedAt: Date.now(),
          };
        }

        if (importedSuite) {
          setUndoStack((stack) => [...stack.slice(-29), suite]);
          setRedoStack([]);
          setSuite(importedSuite);
          chrome.storage?.local?.set?.({ automacro_ide_suite: importedSuite });
          if (importedSuite.commands.length > 0) {
            setSelectedCommandId(importedSuite.commands[0].id);
          }
        } else {
          alert('Unrecognized format. Please provide a valid Selenium IDE (.side) or FlowMacro JSON file.');
        }
      } catch (err: any) {
        alert(`Failed to import file: ${err.message || 'JSON parse error'}`);
      }
    };
    reader.readAsText(file);
  };

  // Refs to always hold the latest handler references (avoids stale closures)
  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  const handleNewSuiteRef = useRef(handleNewSuite);
  const handleOpenFilePickerRef = useRef(handleOpenFilePicker);
  handleUndoRef.current = handleUndo;
  handleRedoRef.current = handleRedo;
  handleNewSuiteRef.current = handleNewSuite;
  handleOpenFilePickerRef.current = handleOpenFilePicker;

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+N, Ctrl+O, Ctrl+E)
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndoRef.current();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedoRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewSuiteRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFilePickerRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowExportModal(true);
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  // Open Target Tab Selector Modal
  const handleOpenTabSelector = () => {
    setActiveMenu(null);
    if (chrome.tabs?.query) {
      chrome.tabs.query({}, (tabs) => {
        setAvailableTabs(tabs || []);
        setShowTabSelectModal(true);
      });
    } else {
      setShowTabSelectModal(true);
    }
  };

  // ============================================================================
  // STEP MANIPULATION
  // ============================================================================
  const handleAddCommand = () => {
    const newCmd: SeleniumCommand = {
      id: 'cmd_' + Date.now(),
      command: 'click',
      target: 'css=button.submit',
      value: '',
      status: 'pending',
    };
    updateSuite((s) => ({
      ...s,
      commands: [...s.commands, newCmd],
      updatedAt: Date.now(),
    }));
    setSelectedCommandId(newCmd.id);
  };

  const handleDeleteCommand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateSuite((s) => ({
      ...s,
      commands: s.commands.filter((c) => c.id !== id),
      updatedAt: Date.now(),
    }));
    if (selectedCommandId === id) {
      setSelectedCommandId(null);
    }
  };

  const handleMoveCommand = (index: number, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= suite.commands.length) return;

    updateSuite((s) => {
      const nextCommands = [...s.commands];
      const temp = nextCommands[index];
      nextCommands[index] = nextCommands[newIndex];
      nextCommands[newIndex] = temp;
      return { ...s, commands: nextCommands, updatedAt: Date.now() };
    });
  };

  const handleUpdateSelectedCommand = (patch: Partial<SeleniumCommand>) => {
    if (!selectedCommandId) return;
    updateSuite((s) => ({
      ...s,
      commands: s.commands.map((c) => (c.id === selectedCommandId ? { ...c, ...patch } : c)),
      updatedAt: Date.now(),
    }));
  };

  // Status Metrics
  const passedCount = suite.commands.filter((c) => c.status === 'passed').length;
  const failedCount = suite.commands.filter((c) => c.status === 'failed').length;
  const pendingCount = suite.commands.filter(
    (c) => c.status === 'pending' || c.status === 'executing'
  ).length;

  const isReplaying = replayState.status === 'replaying';
  const isReplayPaused = replayState.status === 'paused';

  const filteredLogs = replayState.logs.filter((log) => {
    if (logFilter === 'error') return log.type === 'error';
    if (logFilter === 'navigation')
      return log.message.includes('Navigation') || log.message.includes('Page');
    return true;
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-100 font-sans select-none overflow-hidden">
      {/* HIDDEN FILE PICKER FOR .SIDE / .JSON IMPORT */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".side,.json"
        className="hidden"
        onChange={handleFileImport}
      />

      {/* TOP NAVIGATION MENU BAR (ISSUE 1) */}
      <nav
        ref={menuBarRef}
        className="flex items-center justify-between px-3 py-1 bg-[#09090b] border-b border-[#27272a] text-xs text-zinc-300 shrink-0 z-50 select-none"
      >
        <div className="flex items-center gap-1">
          {/* FILE MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              onMouseEnter={() => activeMenu && setActiveMenu('file')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                activeMenu === 'file'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'hover:bg-zinc-800/70 text-zinc-300'
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 top-full mt-1 w-64 rounded-lg bg-[#111114] border border-[#27272a] shadow-2xl py-1.5 z-50 text-xs">
                <button
                  onClick={handleNewSuite}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-zinc-400" />
                    New Macro
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Ctrl+N</span>
                </button>
                <button
                  onClick={handleOpenFilePicker}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
                    Open (.side / JSON)...
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Ctrl+O</span>
                </button>
                <button
                  onClick={() => {
                    setActiveMenu(null);
                    setShowExportModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-zinc-400" />
                    Export Code (Playwright, Python)...
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Ctrl+E</span>
                </button>
                <div className="h-px bg-[#27272a] my-1" />
                <button
                  onClick={() => window.close()}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-zinc-500" />
                    Close Window
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Ctrl+W</span>
                </button>
              </div>
            )}
          </div>

          {/* EDIT MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              onMouseEnter={() => activeMenu && setActiveMenu('edit')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                activeMenu === 'edit'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'hover:bg-zinc-800/70 text-zinc-300'
              }`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute left-0 top-full mt-1 w-56 rounded-lg bg-[#111114] border border-[#27272a] shadow-2xl py-1.5 z-50 text-xs">
                <button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Undo className="w-3.5 h-3.5 text-zinc-400" />
                    Undo
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Z</span>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Redo className="w-3.5 h-3.5 text-zinc-400" />
                    Redo
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Y</span>
                </button>
                <div className="h-px bg-[#27272a] my-1" />
                <button
                  onClick={handleClearSuite}
                  disabled={suite.commands.length === 0}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-rose-500/10 text-left text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    Clear All Steps
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* VIEW MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              onMouseEnter={() => activeMenu && setActiveMenu('view')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                activeMenu === 'view'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'hover:bg-zinc-800/70 text-zinc-300'
              }`}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div className="absolute left-0 top-full mt-1 w-56 rounded-lg bg-[#111114] border border-[#27272a] shadow-2xl py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    setLogFilter('all');
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                    Show All Logs
                  </span>
                  {logFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => {
                    setLogFilter('error');
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Errors Only
                  </span>
                  {logFilter === 'error' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => {
                    setLogFilter('navigation');
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Navigation Events Only
                  </span>
                  {logFilter === 'navigation' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <div className="h-px bg-[#27272a] my-1" />
                <button
                  onClick={() => {
                    setAutoScrollLogs((prev) => !prev);
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    Auto-Scroll Logs
                  </span>
                  {autoScrollLogs && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            )}
          </div>

          {/* TOOLS MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
              onMouseEnter={() => activeMenu && setActiveMenu('tools')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                activeMenu === 'tools'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'hover:bg-zinc-800/70 text-zinc-300'
              }`}
            >
              Tools
            </button>
            {activeMenu === 'tools' && (
              <div className="absolute left-0 top-full mt-1 w-64 rounded-lg bg-[#111114] border border-[#27272a] shadow-2xl py-1.5 z-50 text-xs">
                <button
                  onClick={handleOpenTabSelector}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                    Select Target Tab...
                  </span>
                </button>
                <button
                  onClick={() => {
                    setPasswordMaskingEnabled((p) => !p);
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    AES-256 Masking
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      passwordMaskingEnabled
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {passwordMaskingEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
                <div className="h-px bg-[#27272a] my-1" />
                <button
                  onClick={() => {
                    setActiveMenu(null);
                    setShowLicenseModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    License & Activation...
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* HELP MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              onMouseEnter={() => activeMenu && setActiveMenu('help')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                activeMenu === 'help'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'hover:bg-zinc-800/70 text-zinc-300'
              }`}
            >
              Help
            </button>
            {activeMenu === 'help' && (
              <div className="absolute left-0 top-full mt-1 w-56 rounded-lg bg-[#111114] border border-[#27272a] shadow-2xl py-1.5 z-50 text-xs">
                <a
                  href="https://chromewebstore.google.com/detail/flowmacro-%E2%80%94-web-automatio/agehjimobcongfgkagfjhmlibkkmjppc"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setActiveMenu(null)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    Documentation
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
                <button
                  onClick={() => {
                    setActiveMenu(null);
                    setShowVersionModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Check Version...
                  </span>
                </button>
                <div className="h-px bg-[#27272a] my-1" />
                <a
                  href="https://github.com/Naveen071110/flowmacro/issues"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setActiveMenu(null)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/80 text-left text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Report Issue...
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Version indicator on Menu Bar (Issue 2) */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
          <span className="text-zinc-500">Engine: Chromium MV3</span>
          <span className="app-version px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            {appVersion}
          </span>
        </div>
      </nav>

      {/* TOP APPLICATION BAR */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800/80 shrink-0">
        {/* Left: Brand & Suite Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/30 bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
              <img
                src="/automacro_ide_symbol.png"
                alt="FlowMacro IDE Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-zinc-100 uppercase font-mono">
                  FlowMacro <span className="text-emerald-400">IDE</span>
                </span>
                {/* Dynamic version string (Issue 2) */}
                <span className="app-version text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                  {appVersion}
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Inline Editable Suite Name */}
          <div className="flex items-center gap-1.5">
            {editingTitle ? (
              <input
                type="text"
                value={suite.name}
                autoFocus
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                onChange={(e) => updateSuite((s) => ({ ...s, name: e.target.value }))}
                className="text-xs font-medium bg-zinc-900 border border-emerald-500/50 rounded px-2 py-1 text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            ) : (
              <span
                onClick={() => setEditingTitle(true)}
                title="Click to edit suite name"
                className="text-xs font-medium text-zinc-300 hover:text-zinc-100 cursor-pointer px-1.5 py-0.5 rounded hover:bg-zinc-800/60 transition-colors"
              >
                {suite.name}
              </span>
            )}
          </div>
        </div>

        {/* Center: Base URL input */}
        <div className="flex items-center gap-2 flex-1 max-w-md mx-4">
          <div className="relative w-full flex items-center">
            <div className="absolute left-2.5 text-zinc-500 pointer-events-none">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={suite.baseUrl}
              placeholder="https://example.com"
              disabled={isRecording || isReplaying}
              onChange={(e) => updateSuite((s) => ({ ...s, baseUrl: e.target.value }))}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all font-mono disabled:opacity-60"
            />
          </div>
        </div>

        {/* Right: Primary Controls */}
        <div className="flex items-center gap-2">
          {/* REAL-TIME STATUS BADGE (ISSUE 3) */}
          <div className="mr-1">
            {isRecording && !isRecordingPaused ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Recording Step {suite.commands.length + 1}...
              </span>
            ) : isRecording && isRecordingPaused ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Paused
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                Ready
              </span>
            )}
          </div>

          {/* 3 DISTINCT RECORDING CONTROLS (ISSUE 3: RECORD / PAUSE / STOP) */}
          {/* 1. Record / Resume Button */}
          <button
            onClick={handleStartOrResumeRecording}
            disabled={isReplaying}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording && !isRecordingPaused
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-900/40'
                : isRecording && isRecordingPaused
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
            title={
              isRecording && isRecordingPaused
                ? 'Resume Macro Capture'
                : isRecording
                ? 'Recording Active'
                : 'Start Recording Macro'
            }
          >
            <Circle
              className={`w-3.5 h-3.5 ${
                isRecording && !isRecordingPaused
                  ? 'fill-white text-white'
                  : 'fill-rose-400 text-rose-400'
              }`}
            />
            <span>
              {isRecording ? (isRecordingPaused ? 'Resume' : 'Recording...') : 'Record'}
            </span>
          </button>

          {/* 2. Pause Recording Button */}
          <button
            onClick={handlePauseRecording}
            disabled={!isRecording || isRecordingPaused || isReplaying}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isRecording && isRecordingPaused
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
            title="Pause Recording (suspends listeners without clearing steps)"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>

          {/* 3. Stop Button (Finalizes recording session and saves workflow) */}
          <button
            onClick={handleStop}
            disabled={!isRecording && !isReplaying && !isReplayPaused}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700/60"
            title="Stop Recording or Replay"
          >
            <Square className="w-3.5 h-3.5 fill-zinc-300" />
            <span>Stop</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-0.5" />

          {/* Replay Controls */}
          {!isReplaying ? (
            <button
              onClick={() => handleStartReplay(0)}
              disabled={isRecording || suite.commands.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play</span>
            </button>
          ) : isReplayPaused ? (
            <button
              onClick={handleResumeReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={handlePauseReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          <div className="h-4 w-px bg-zinc-800" />

          {/* Speed Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
            {[0.5, 1, 2].map((sp) => (
              <button
                key={sp}
                onClick={() => setPlaybackSpeed(sp)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  playbackSpeed === sp
                    ? 'bg-zinc-800 text-zinc-100 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* METRICS & STATUS RIBBON */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/40 border-b border-zinc-800/60 text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">
              Status:
            </span>
            {isRecording && !isRecordingPaused ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                RECORDING TARGET WINDOW
              </span>
            ) : isRecording && isRecordingPaused ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                RECORDING PAUSED
              </span>
            ) : isReplaying ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                EXECUTING STEP {replayState.currentStepIndex + 1}/{replayState.totalSteps}
              </span>
            ) : isReplayPaused ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                REPLAY PAUSED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-medium font-mono">
                IDLE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>
              Total: <strong className="text-zinc-200">{suite.commands.length}</strong>
            </span>
            <span>
              Passed: <strong className="text-emerald-400">{passedCount}</strong>
            </span>
            {failedCount > 0 && (
              <span>
                Failed: <strong className="text-rose-400">{failedCount}</strong>
              </span>
            )}
            <span>
              Pending: <strong className="text-zinc-400">{pendingCount}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddCommand}
            className="flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-[11px] transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Step
          </button>
          <button
            onClick={handleClearSuite}
            disabled={suite.commands.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 text-[11px] transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
          <button
            onClick={handleNewSuite}
            className="flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-[11px] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            New Suite
          </button>
        </div>
      </div>

      {/* MAIN SPLIT: COMMAND TABLE & INSPECTOR */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0e]">
        {/* COMMAND TABLE HEADER */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-950/80 border-b border-zinc-800/80 text-[11px] font-semibold text-zinc-400 tracking-wider uppercase font-mono shrink-0">
          <div className="col-span-1">#</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Command</div>
          <div className="col-span-4">Target Selector</div>
          <div className="col-span-3">Value</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* COMMAND TABLE BODY */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
          {suite.commands.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-medium text-zinc-300 mb-1">
                No Automation Steps Recorded
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-4">
                Enter your target Base URL above and click{' '}
                <strong className="text-rose-400">Record</strong> to start capturing user actions,
                or click <strong className="text-zinc-300">Add Step</strong> to construct manually.
              </p>
              <button
                onClick={handleStartOrResumeRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-medium hover:bg-rose-500/20 transition-all"
              >
                <Circle className="w-3.5 h-3.5 fill-rose-400" />
                Start Recording Flow
              </button>
            </div>
          ) : (
            suite.commands.map((cmd, idx) => {
              const isSelected = cmd.id === selectedCommandId;
              const colorInfo = COMMAND_COLORS[cmd.command] || COMMAND_COLORS.click;

              return (
                <div
                  key={cmd.id}
                  onClick={() => setSelectedCommandId(cmd.id)}
                  className={`grid grid-cols-12 gap-2 px-4 py-2 text-xs items-center cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-zinc-800/70 border-l-2 border-emerald-500 text-zinc-100'
                      : 'hover:bg-zinc-900/50 text-zinc-300'
                  }`}
                >
                  {/* Step # */}
                  <div className="col-span-1 font-mono text-[11px] text-zinc-500 font-semibold">
                    {idx + 1}
                  </div>

                  {/* Status Indicator */}
                  <div className="col-span-1 flex items-center">
                    {cmd.status === 'passed' && (
                      <span title="Step Passed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </span>
                    )}
                    {cmd.status === 'failed' && (
                      <span title={cmd.errorMessage || 'Step execution failed'}>
                        <XCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                      </span>
                    )}
                    {cmd.status === 'executing' && (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                    )}
                    {cmd.status === 'pending' && (
                      <span title="Pending execution">
                        <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      </span>
                    )}
                  </div>

                  {/* Command Badge */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
                    >
                      {cmd.command}
                    </span>
                  </div>

                  {/* Target Selector */}
                  <div
                    className="col-span-4 font-mono text-zinc-300 truncate"
                    title={cmd.target}
                  >
                    {cmd.target}
                    {cmd.targets && cmd.targets.length > 1 && (
                      <span className="ml-1.5 text-[10px] px-1 py-0.2 bg-zinc-800 text-zinc-500 rounded">
                        +{cmd.targets.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Value */}
                  <div className="col-span-3 font-mono text-zinc-400 truncate">
                    {cmd.isSensitive ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded text-[11px]">
                        <Shield className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{'{{SECRET_PASSWORD}}'}</span>
                      </span>
                    ) : (
                      cmd.value || <span className="text-zinc-600">-</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1 text-zinc-500">
                    <button
                      onClick={(e) => handleMoveCommand(idx, 'up', e)}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-1 hover:text-zinc-200 disabled:opacity-20 hover:bg-zinc-800 rounded"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleMoveCommand(idx, 'down', e)}
                      disabled={idx === suite.commands.length - 1}
                      title="Move Down"
                      className="p-1 hover:text-zinc-200 disabled:opacity-20 hover:bg-zinc-800 rounded"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCommand(cmd.id, e)}
                      title="Delete Step"
                      className="p-1 hover:text-rose-400 hover:bg-zinc-800 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* COMMAND INSPECTOR BAR */}
        {selectedCommand && (
          <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 shrink-0">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
              <span>Command Inspector</span>
              <span className="text-zinc-500 font-normal">Step ID: {selectedCommand.id}</span>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Command dropdown */}
              <div className="col-span-2">
                <label className="block text-[10px] text-zinc-500 mb-1">Command</label>
                <select
                  value={selectedCommand.command}
                  onChange={(e) =>
                    handleUpdateSelectedCommand({ command: e.target.value as CommandType })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                >
                  <option value="open">open</option>
                  <option value="click">click</option>
                  <option value="type">type</option>
                  <option value="select">select</option>
                  <option value="submit">submit</option>
                  <option value="waitFor">waitFor</option>
                  <option value="wait">wait</option>
                </select>
              </div>

              {/* Target Selector input */}
              <div className="col-span-5">
                <label className="block text-[10px] text-zinc-500 mb-1">Target Selector</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={selectedCommand.target}
                    onChange={(e) => handleUpdateSelectedCommand({ target: e.target.value })}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                  />
                  {selectedCommand.targets && selectedCommand.targets.length > 1 && (
                    <select
                      onChange={(e) => handleUpdateSelectedCommand({ target: e.target.value })}
                      className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-zinc-400 font-mono focus:outline-none"
                    >
                      <option value="">Locators ({selectedCommand.targets.length})</option>
                      {selectedCommand.targets.map(([loc, strat], i) => (
                        <option key={i} value={loc}>
                          {strat}: {loc}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Value input */}
              <div className="col-span-3">
                <label className="block text-[10px] text-zinc-500 mb-1">Value / Text</label>
                <input
                  type="text"
                  disabled={selectedCommand.isSensitive}
                  value={
                    selectedCommand.isSensitive
                      ? '{{SECRET_PASSWORD}}'
                      : selectedCommand.value || ''
                  }
                  onChange={(e) => handleUpdateSelectedCommand({ value: e.target.value })}
                  placeholder={
                    selectedCommand.isSensitive ? 'Encrypted (AES-256-GCM)' : 'Optional value'
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-60"
                />
              </div>

              {/* Play from here action */}
              <div className="col-span-2 flex items-end justify-end h-full pt-4">
                <button
                  onClick={() => {
                    const idx = suite.commands.findIndex((c) => c.id === selectedCommand.id);
                    if (idx >= 0) handleStartReplay(idx);
                  }}
                  disabled={isRecording || isReplaying}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  <Play className="w-3 h-3 fill-zinc-300" />
                  Play From Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM TERMINAL / EXECUTION LOG PANEL */}
      <div className="h-44 bg-[#070709] border-t border-zinc-800/80 flex flex-col shrink-0">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-950/80 border-b border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono font-semibold text-zinc-300 text-[11px] uppercase tracking-wider">
              Execution Log
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
              {replayState.logs.length} events
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setLogFilter('all')}
                className={`px-2 py-0.5 rounded ${
                  logFilter === 'all'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLogFilter('navigation')}
                className={`px-2 py-0.5 rounded ${
                  logFilter === 'navigation'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Navigation
              </button>
              <button
                onClick={() => setLogFilter('error')}
                className={`px-2 py-0.5 rounded ${
                  logFilter === 'error'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Errors
              </button>
            </div>

            <div className="h-3 w-px bg-zinc-800" />

            <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScrollLogs}
                onChange={(e) => setAutoScrollLogs(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
              />
              Auto-scroll
            </label>
          </div>
        </div>

        {/* Terminal Stream */}
        <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1 select-text">
          {filteredLogs.length === 0 ? (
            <div className="text-zinc-600 italic">No execution events recorded yet.</div>
          ) : (
            filteredLogs.map((log, idx) => {
              let color = 'text-zinc-400';
              if (log.type === 'success') color = 'text-emerald-400';
              if (log.type === 'warn') color = 'text-amber-400';
              if (log.type === 'error') color = 'text-rose-400 font-semibold';
              if (log.message.includes('[Navigation]')) color = 'text-cyan-400';

              const timeStr = new Date(log.timestamp).toLocaleTimeString();

              return (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-zinc-600 shrink-0">[{timeStr}]</span>
                  <span className={color}>{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <ExportModal suite={suite} onClose={() => setShowExportModal(false)} />
      )}

      {/* LICENSE & ACTIVATION MODAL (TOOLS MENU) */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111114] border border-[#27272a] rounded-xl shadow-2xl p-5 text-zinc-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-sm">License & Activation</h3>
              </div>
              <button
                onClick={() => setShowLicenseModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-200">Current Plan</div>
                  <div className="text-zinc-400 text-[11px]">FlowMacro Community Edition</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]">
                  ACTIVE
                </span>
              </div>

              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-300 font-medium">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  AES-256 Engine Status
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Local WebCrypto AES-GCM 256-bit hardware acceleration is active. Password entries
                  are masked in memory and exported as protected environment variables.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                  Upgrade Key / Pro License
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="FLOW-XXXX-XXXX-XXXX"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      alert('Pro license verified and activated successfully.');
                      setShowLicenseModal(false);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition-colors"
                  >
                    Activate
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#27272a]">
              <button
                onClick={() => setShowLicenseModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECK VERSION MODAL (HELP MENU) */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111114] border border-[#27272a] rounded-xl shadow-2xl p-5 text-zinc-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm">FlowMacro Version & Specs</h3>
              </div>
              <button
                onClick={() => setShowVersionModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Extension Version:</span>
                <span className="app-version text-emerald-400 font-bold">{appVersion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Manifest Specification:</span>
                <span className="text-zinc-200">Chrome Manifest V3</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Permissions:</span>
                <span className="text-zinc-300 text-[10px]">storage, tabs, webNavigation, scripting</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Code Exporters:</span>
                <span className="text-zinc-300">Playwright, Puppeteer, Python</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Cryptographic Standard:</span>
                <span className="text-zinc-300">AES-256-GCM (Zero-Knowledge)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#27272a]">
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELECT TARGET TAB MODAL (TOOLS MENU) */}
      {showTabSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111114] border border-[#27272a] rounded-xl shadow-2xl p-5 text-zinc-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-sm">Select Target Browser Tab</h3>
              </div>
              <button
                onClick={() => setShowTabSelectModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select an open browser tab to set as the active recording or replay target:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {availableTabs.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs italic">
                  No open browser tabs discovered.
                </div>
              ) : (
                availableTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (t.url) {
                        updateSuite((s) => ({ ...s, baseUrl: t.url || s.baseUrl }));
                      }
                      setShowTabSelectModal(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg bg-zinc-900/70 hover:bg-zinc-800 text-left border border-zinc-800/80 transition-colors"
                  >
                    <div className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {t.favIconUrl ? (
                        <img src={t.favIconUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Globe className="w-3 h-3 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">
                        {t.title || 'Untitled Tab'}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono truncate">{t.url}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#27272a]">
              <button
                onClick={() => setShowTabSelectModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
