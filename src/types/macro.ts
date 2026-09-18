export type CommandType =
  | 'open'
  | 'click'
  | 'type'
  | 'select'
  | 'waitFor'
  | 'submit'
  | 'wait';

export type StepStatus = 'pending' | 'executing' | 'passed' | 'failed';

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
}

export interface SeleniumCommand {
  id: string;
  command: CommandType;
  target: string;
  targets?: Array<[string, string]>; // [selector, strategy] e.g. [["button#login", "css:finder"], ["//button", "xpath:position"]]
  value?: string;
  status: StepStatus;
  comment?: string;
  isSensitive?: boolean;
  encryptedSecret?: EncryptedSecret;
  sessionSecret?: string;
  envVarName?: string;
  errorMessage?: string;
  durationMs?: number;
}

export interface TestSuite {
  id: string;
  name: string;
  baseUrl: string;
  commands: SeleniumCommand[];
  createdAt: number;
  updatedAt: number;
  variables?: string[];
}

export type ExecutionStatus =
  | 'idle'
  | 'recording'
  | 'replaying'
  | 'paused'
  | 'completed'
  | 'error';

export interface ExecutionLog {
  timestamp: number;
  stepIndex?: number;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success';
}

export interface ReplaySessionState {
  suiteId: string | null;
  status: ExecutionStatus;
  currentStepIndex: number;
  totalSteps: number;
  speed: number; // 0.5, 1, 2
  error?: string;
  logs: ExecutionLog[];
  targetTabId?: number;
  targetWindowId?: number;
}

// Inter-process Extension Messages
export type ExtensionMessage =
  | { type: 'START_RECORDING'; baseUrl: string; suiteId: string }
  | { type: 'STOP_RECORDING' }
  | { type: 'RECORDED_COMMAND'; command: SeleniumCommand }
  | {
      type: 'START_REPLAY';
      suite: TestSuite;
      speed?: number;
      startFromIndex?: number;
    }
  | { type: 'PAUSE_REPLAY' }
  | { type: 'RESUME_REPLAY' }
  | { type: 'STOP_REPLAY' }
  | { type: 'GET_SESSION_STATE' }
  | { type: 'SESSION_STATE_UPDATE'; state: ReplaySessionState }
  | {
      type: 'EXECUTE_DOM_COMMAND';
      command: SeleniumCommand;
      speed?: number;
      resolvedValue?: string;
      timeoutMs?: number;
    }
  | {
      type: 'COMMAND_EXECUTION_RESULT';
      commandId: string;
      success: boolean;
      error?: string;
      navigated?: boolean;
    };

// ============================================================================
// BACKWARD COMPATIBILITY TYPES (Legacy Sidepanel)
// ============================================================================
export type StepAction = 'click' | 'type' | 'select' | 'submit' | 'wait' | 'open' | 'waitFor';

export interface MacroStep {
  id: string;
  action: StepAction;
  selector: string;
  fallbackSelectors?: string[];
  value?: string;
  waitAfterMs?: number;
  optional?: boolean;
  isSensitive?: boolean;
  encryptedSecret?: EncryptedSecret;
  envVarName?: string;
  description?: string;
}

export interface Macro {
  macroId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  steps: MacroStep[];
  variables?: string[];
  baseUrl?: string;
}

export interface ReplayState {
  macroId: string | null;
  status: ExecutionStatus;
  currentStepIndex: number;
  totalSteps: number;
  speed: number;
  error?: string;
  logs: ExecutionLog[];
  targetTabId?: number;
}
