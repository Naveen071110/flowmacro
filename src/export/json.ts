import { TestSuite, Macro } from '../types/macro';

function normalizeToTestSuite(input: TestSuite | Macro): TestSuite {
  if ('commands' in input) {
    return input;
  }
  return {
    id: input.macroId,
    name: input.title,
    baseUrl: input.baseUrl || 'https://example.com',
    commands: input.steps.map((s) => ({
      id: s.id,
      command: s.action as any,
      target: s.selector,
      value: s.value,
      status: 'pending',
      isSensitive: s.isSensitive,
      encryptedSecret: s.encryptedSecret,
      envVarName: s.envVarName,
    })),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    variables: input.variables,
  };
}

export function exportToJson(input: TestSuite | Macro): string {
  const suite = normalizeToTestSuite(input);
  const sanitized: TestSuite = {
    ...suite,
    commands: suite.commands.map((cmd) => {
      if (cmd.isSensitive) {
        const { sessionSecret, ...rest } = cmd;
        return {
          ...rest,
          value: '{{SECRET_PASSWORD}}',
          encryptedSecret: { ciphertext: '[ENCRYPTED_SECRET]', iv: '[REDACTED]' },
        };
      }
      return cmd;
    }),
  };
  return JSON.stringify(sanitized, null, 2);
}

export function importFromJson(jsonString: string): any {
  const parsed = JSON.parse(jsonString);
  if (!parsed.id && !parsed.macroId) {
    throw new Error('Invalid AutoMacro format: Missing identifier.');
  }
  return parsed;
}
