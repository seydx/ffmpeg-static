#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import fs from 'fs-extra';
import decompress from 'decompress';
import decompressUnzip from 'decompress-unzip';
import decompressTar from 'decompress-tar';
import decompressTargz from 'decompress-targz';
import decompressTarxz from 'decompress-tarxz';
import decompressTarbz2 from 'decompress-tarbz2';
import { pipeline } from 'stream/promises';
import { resolve, join } from 'path';

const program = new Command();

program
  .requiredOption('--platform <platform>', 'Target platform (e.g., win32, linux, darwin)')
  .requiredOption('--arch <arch>', 'Target architecture (e.g., x64, arm64)')
  .requiredOption('--version <version>', 'FFmpeg version')
  .requiredOption('--url <url>', 'Download URL of the FFmpeg archive')
  .requiredOption('--filename <filename>', 'Name of the archive file')
  .option('--output <path>', 'Output directory', 'ffmpeg')
  .parse(process.argv);

interface Options {
  platform: string;
  arch: string;
  version: string;
  url: string;
  filename: string;
  output: string;
}

const options = program.opts<Options>();

async function downloadAndExtract() {
  const outputDir = resolve(process.cwd(), options.output);
  await fs.ensureDir(outputDir);

  const archiveName = options.filename;
  const archivePath = resolve(outputDir, archiveName);

  console.log(`Downloading FFmpeg from ${options.url}...`);

  const response = await axios.get(options.url, {
    responseType: 'stream',
  });

  await pipeline(response.data, fs.createWriteStream(archivePath));

  console.log(`Extracting ${archivePath}...`);

  const tempExtractPath = resolve(outputDir, 'temp');
  await fs.ensureDir(tempExtractPath);

  await decompress(archivePath, tempExtractPath, {
    plugins: [decompressUnzip(), decompressTar(), decompressTargz(), decompressTarxz(), decompressTarbz2()],
  });

  const ffmpegBinaryName = options.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const ffmpegPath = await findFile(tempExtractPath, ffmpegBinaryName);

  if (!ffmpegPath) {
    throw new Error('FFmpeg binary not found in extracted files.');
  }

  const destPath = resolve(outputDir, ffmpegBinaryName);
  await fs.copy(ffmpegPath, destPath);

  if (options.platform !== 'win32') {
    await fs.chmod(destPath, 0o755);
  }

  await fs.remove(archivePath);
  await fs.remove(tempExtractPath);

  console.log(`FFmpeg binary is ready at ${destPath}`);
}

async function findFile(dir: string, filename: string): Promise<string | null> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      const result = await findFile(fullPath, filename);
      if (result) {
        return result;
      }
    } else if (file === filename) {
      return fullPath;
    }
  }
  return null;
}

downloadAndExtract().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
