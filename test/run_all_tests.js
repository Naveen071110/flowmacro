import { runCryptoTests } from './unit/crypto.test.js';
import { runWaterfallSelectorTests } from './unit/waterfall_selectors.test.js';
import { runEventDeduplicationTests } from './unit/event_deduplication.test.js';
import { runReplayerTests } from './unit/replayer_waterfall.test.js';
import { runServiceWorkerTests } from './unit/service_worker_lifecycle.test.js';
import { runExporterEdgeCaseTests } from './unit/exporters_edge_cases.test.js';
import { execSync } from 'child_process';

async function main() {
  console.log('================================================================');
  console.log('🚀 FlowMacro Master Comprehensive Test Suite & Unit Verification');
  console.log('================================================================');

  let totalUnitPassed = 0;

  try {
    totalUnitPassed += await runCryptoTests();
    totalUnitPassed += await runWaterfallSelectorTests();
    totalUnitPassed += await runEventDeduplicationTests();
    totalUnitPassed += await runReplayerTests();
    totalUnitPassed += await runServiceWorkerTests();
    totalUnitPassed += await runExporterEdgeCaseTests();

    console.log('================================================================');
    console.log(`✅ ALL ${totalUnitPassed} COMPONENT UNIT TESTS PASSED SUCCESSFULLY!`);
    console.log('================================================================\n');

    // Also run existing feature integration verification
    console.log('--- Running verify_all_features.js Integration Tests ---');
    execSync('node test/verify_all_features.js', { stdio: 'inherit' });

  } catch (err) {
    console.error('\n❌ Test Suite Encountered an Error:', err);
    process.exit(1);
  }
}

main();
