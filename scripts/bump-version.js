import fs from 'fs';
import path from 'path';

function bumpVersion() {
  const pkgPath = path.resolve('package.json');
  const manifestPath = path.resolve('manifest.json');
  const publicManifestPath = path.resolve('public/manifest.json');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const currentVersion = pkg.version || '1.0.0';

  const type = process.argv[2] || 'patch'; // 'patch', 'minor', 'major', or explicit version string like '1.0.3'

  let newVersion = '';
  if (/^\d+\.\d+\.\d+$/.test(type)) {
    newVersion = type;
  } else {
    const parts = currentVersion.split('.').map(Number);
    if (type === 'major') {
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
    } else if (type === 'minor') {
      parts[1] += 1;
      parts[2] = 0;
    } else {
      // default: patch
      parts[2] += 1;
    }
    newVersion = parts.join('.');
  }

  // Update package.json
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // Update manifest.json
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    manifest.version = newVersion;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }

  // Update public/manifest.json
  if (fs.existsSync(publicManifestPath)) {
    const publicManifest = JSON.parse(fs.readFileSync(publicManifestPath, 'utf-8'));
    publicManifest.version = newVersion;
    fs.writeFileSync(publicManifestPath, JSON.stringify(publicManifest, null, 2) + '\n');
  }

  console.log(`🚀 Version updated: ${currentVersion} -> ${newVersion}`);
  console.log('✅ Synchronized package.json, manifest.json, and public/manifest.json');
  return newVersion;
}

bumpVersion();
