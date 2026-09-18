import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

async function runBuild() {
  console.log('🚀 Phase 1: Building Selenium IDE Window & Assets (React + Tailwind)...');
  await build({
    plugins: [react()],
    base: '',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          ide: path.resolve('ide.html'),
          sidepanel: path.resolve('sidepanel.html'),
        },
      },
    },
  });

  console.log('⚡ Phase 2: Building Background Service Worker (ES Module)...');
  await build({
    configFile: false,
    publicDir: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/background/service_worker.ts'),
        formats: ['es'],
        fileName: () => 'background.js',
      },
    },
  });

  console.log('🎯 Phase 3: Building Content Scripts (Standalone IIFE)...');
  // 3a: Recorder
  await build({
    configFile: false,
    publicDir: false,
    build: {
      outDir: path.resolve('dist/content_scripts'),
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/content_scripts/recorder.ts'),
        formats: ['iife'],
        name: 'AutoMacroRecorder',
        fileName: () => 'recorder.js',
      },
    },
  });

  // 3b: Replayer
  await build({
    configFile: false,
    publicDir: false,
    build: {
      outDir: path.resolve('dist/content_scripts'),
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/content_scripts/replayer.ts'),
        formats: ['iife'],
        name: 'AutoMacroReplayer',
        fileName: () => 'replayer.js',
      },
    },
  });

  // Cleanup spurious files in dist/content_scripts if generated
  const spuriousManifest = path.resolve('dist/content_scripts/manifest.json');
  if (fs.existsSync(spuriousManifest)) {
    fs.unlinkSync(spuriousManifest);
  }
  const spuriousIcons = path.resolve('dist/content_scripts/icons');
  if (fs.existsSync(spuriousIcons)) {
    fs.rmSync(spuriousIcons, { recursive: true, force: true });
  }

  // Ensure manifest.json copied
  const manifestSrc = path.resolve('public/manifest.json');
  const manifestDest = path.resolve('dist/manifest.json');
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
  }

  // Ensure icons copied
  const iconsSrc = path.resolve('public/icons');
  const iconsDest = path.resolve('dist/icons');
  if (fs.existsSync(iconsSrc)) {
    fs.cpSync(iconsSrc, iconsDest, { recursive: true, force: true });
  }

  // Ensure automacro_ide_symbol.png copied to dist
  const symbolSrc = path.resolve('public/automacro_ide_symbol.png');
  const symbolDest = path.resolve('dist/automacro_ide_symbol.png');
  if (fs.existsSync(symbolSrc)) {
    fs.copyFileSync(symbolSrc, symbolDest);
  }

  console.log('✨ AutoMacro built successfully! Load unpacked from: dist/');
}

runBuild().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
