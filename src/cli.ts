#!/usr/bin/env node

import axios from 'axios';
import { exec } from 'child_process';
import { Command } from 'commander';
import decompress from 'decompress';
import decompressTar from 'decompress-tar';
import decompressTarbz2 from 'decompress-tarbz2';
import decompressTargz from 'decompress-targz';
import decompressTarxz from 'decompress-tarxz';
import decompressUnzip from 'decompress-unzip';
import fs from 'fs-extra';
import { join, resolve } from 'path';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';

const execAsync = promisify(exec);

const program = new Command();

program
  .requiredOption('--platform <platform>', 'Target platform (e.g., win32, linux, darwin)')
  .requiredOption('--arch <arch>', 'Target architecture (e.g., x64, arm64, armhf)')
  .requiredOption('--version <version>', 'FFmpeg version')
  .requiredOption('--url <url>', 'Download URL of the FFmpeg archive')
  .requiredOption('--filename <filename>', 'Name of the archive file')
  .option('--type <type>', 'Archive type (zip, tar, deb, binary)', 'zip')
  .option('--distro <distro>', 'Linux distribution (for deb packages)')
  .option('--output <path>', 'Output directory', 'ffmpeg')
  .parse(process.argv);

interface Options {
  platform: string;
  arch: string;
  version: string;
  url: string;
  filename: string;
  type: string;
  distro?: string;
  output: string;
}

const options = program.opts<Options>();

async function downloadAndExtract() {
  const outputDir = resolve(process.cwd(), options.output);
  await fs.ensureDir(outputDir);

  const archiveName = options.filename;
  const archivePath = resolve(outputDir, archiveName);

  console.log(`Downloading FFmpeg from ${options.url}...`);

  const response = await axios.get(options.url, { responseType: 'stream' });

  await pipeline(response.data, fs.createWriteStream(archivePath));

  console.log(`Downloaded ${archivePath}`);

  // Handle different package types
  if (options.type === 'deb') {
    await handleDebPackage(archivePath, outputDir);
  } else if (options.type === 'binary') {
    await handleBinaryFile(archivePath, outputDir);
  } else {
    await extractArchive(archivePath, outputDir);
  }

  // Clean up
  if (options.type !== 'binary') {
    await fs.remove(archivePath);
    console.log('Cleaned up temporary files');
  }
}

async function handleDebPackage(debPath: string, outputDir: string) {
  console.log(`Processing Debian package: ${debPath}`);

  // Create temp directory for extraction
  const tempDir = resolve(outputDir, 'temp');
  await fs.ensureDir(tempDir);

  try {
    // Check if dpkg command is available
    await execAsync('dpkg --version');

    // Extract .deb package using dpkg
    await execAsync(`dpkg-deb -x "${debPath}" "${tempDir}"`);

    console.log(`Extracted Debian package to ${tempDir}`);

    // FFmpeg in Jellyfin .deb packages is typically in /usr/lib/jellyfin-ffmpeg
    const ffmpegBinaryName = 'ffmpeg';
    const ffmpegPath = await findFile(tempDir, ffmpegBinaryName);

    if (!ffmpegPath) {
      throw new Error('FFmpeg binary not found in extracted files.');
    }

    const destPath = resolve(outputDir, ffmpegBinaryName);
    await fs.copy(ffmpegPath, destPath);

    if (options.platform !== 'win32') {
      await fs.chmod(destPath, 0o755);
    }

    console.log(`FFmpeg binary is ready at ${destPath}`);
  } catch (error) {
    console.error(`Error with dpkg extraction: ${error}`);
    console.log('Falling back to manual ar extraction method...');

    // If dpkg is not available, try using ar and tar manually
    try {
      // Extract the data.tar.* from the .deb package
      await execAsync(`ar x "${debPath}" data.tar.* --output="${tempDir}"`);

      // Find which data.tar.* file was extracted
      const files = await fs.readdir(tempDir);
      const dataTarFile = files.find((file) => file.startsWith('data.tar.'));

      if (!dataTarFile) {
        throw new Error('No data.tar.* file found in the .deb package');
      }

      const dataTarPath = resolve(tempDir, dataTarFile);

      // Extract the data.tar.* file
      await execAsync(`tar -xf "${dataTarPath}" -C "${tempDir}"`);

      // FFmpeg in Jellyfin .deb packages is typically in /usr/lib/jellyfin-ffmpeg
      const ffmpegBinaryName = 'ffmpeg';
      const ffmpegPath = await findFile(tempDir, ffmpegBinaryName);

      if (!ffmpegPath) {
        throw new Error('FFmpeg binary not found in extracted files.');
      }

      const destPath = resolve(outputDir, ffmpegBinaryName);
      await fs.copy(ffmpegPath, destPath);

      if (options.platform !== 'win32') {
        await fs.chmod(destPath, 0o755);
      }

      console.log(`FFmpeg binary is ready at ${destPath}`);
    } catch (fallbackError) {
      console.error(`Failed to extract .deb file: ${fallbackError}`);
      throw new Error('Failed to extract .deb package with both dpkg and ar methods');
    }
  } finally {
    // Clean up temp directory
    await fs.remove(tempDir);
  }
}

async function handleBinaryFile(binaryPath: string, outputDir: string) {
  console.log(`Processing binary file: ${binaryPath}`);

  // For binary files, we just need to ensure proper permissions
  const ffmpegBinaryName = options.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

  // Check if the file was already downloaded with the right name
  if (binaryPath.endsWith(ffmpegBinaryName)) {
    // Just set executable permissions if needed
    if (options.platform !== 'win32') {
      await fs.chmod(binaryPath, 0o755);
    }
    console.log(`FFmpeg binary is ready at ${binaryPath}`);
  } else {
    // In case the downloaded file has a different name
    const destPath = resolve(outputDir, ffmpegBinaryName);
    await fs.move(binaryPath, destPath, { overwrite: true });

    // Make it executable if not on Windows
    if (options.platform !== 'win32') {
      await fs.chmod(destPath, 0o755);
    }
    console.log(`FFmpeg binary is ready at ${destPath}`);
  }
}

async function extractArchive(archivePath: string, outputDir: string) {
  console.log(`Extracting ${archivePath}...`);

  const tempExtractPath = resolve(outputDir, 'temp');
  await fs.ensureDir(tempExtractPath);

  await decompress(archivePath, tempExtractPath, { plugins: [decompressUnzip(), decompressTar(), decompressTargz(), decompressTarxz(), decompressTarbz2()] });

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

  console.log(`FFmpeg binary is ready at ${destPath}`);

  // Clean up temp directory
  await fs.remove(tempExtractPath);
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
