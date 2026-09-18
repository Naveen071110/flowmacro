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

/**
 * Exports a TestSuite into an official Selenium IDE (.side) JSON project file.
 * Compatible with Selenium IDE browser extensions and selenium-side-runner CLI.
 */
export function exportToSeleniumSide(input: TestSuite | Macro): string {
  const suite = normalizeToTestSuite(input);
  const testId = suite.id || 'test_' + Date.now();
  const suiteId = 'suite_' + Date.now();

  const formattedCommands = suite.commands.map((cmd) => {
    let target = cmd.target || '';
    // For 'open', Selenium IDE uses relative path if within baseUrl
    if (cmd.command === 'open' && suite.baseUrl) {
      try {
        const urlObj = new URL(cmd.target);
        const baseObj = new URL(suite.baseUrl);
        if (urlObj.origin === baseObj.origin) {
          target = urlObj.pathname + urlObj.search + urlObj.hash || '/';
        }
      } catch {}
    }

    let value = cmd.value || '';
    if (cmd.isSensitive) {
      value = '{{SECRET_PASSWORD}}';
    }

    return {
      id: cmd.id,
      comment: cmd.comment || '',
      command: cmd.command,
      target,
      targets: cmd.targets && cmd.targets.length > 0 ? cmd.targets : [[target, 'css:finder']],
      value,
    };
  });

  const sideProject = {
    id: 'project_' + Date.now(),
    version: '2.0',
    name: suite.name || 'AutoMacro Project',
    url: suite.baseUrl || 'https://example.com',
    tests: [
      {
        id: testId,
        name: suite.name || 'Test Suite 1',
        commands: formattedCommands,
      },
    ],
    suites: [
      {
        id: suiteId,
        name: 'Default Suite',
        persistSession: false,
        parallel: false,
        timeout: 300,
        tests: [testId],
      },
    ],
    urls: [suite.baseUrl || 'https://example.com'],
    plugins: [],
  };

  return JSON.stringify(sideProject, null, 2);
}
