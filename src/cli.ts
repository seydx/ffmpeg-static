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
  .option('--type <type>', 'Archive type (zip, tar, deb, binary, 7z)', 'zip')
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

// Files and patterns to ignore
const IGNORE_PATTERNS = [
  // Documentation and web files
  /\.html?$/i,
  /\.css$/i,
  /\.js$/i,
  /\.md$/i,
  /\.txt$/i,
  /\.1$/, // Man pages
  /\.3$/, // Man pages

  // Common documentation files
  /^readme/i,
  /^license/i,
  /^changelog/i,
  /^authors/i,
  /^copying/i,
  /^install/i,
  /^news/i,

  // Web-related files
  /bootstrap/i,
  /\.min\./i,
  /style/i,
  /general/i,
  /community/i,
  /developer/i,
  /platform/i,
  /fate/i,
  /faq/i,
  /git-howto/i,
  /mailing-list/i,
  /nut/i,

  // ffplay/ffprobe
  /ffplay/i,
  /ffprobe/i,
];

function shouldIgnoreFile(fileName: string): boolean {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(fileName));
}

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
  } else if (options.type === '7z') {
    await handle7zArchive(archivePath, outputDir);
  } else {
    await extractArchive(archivePath, outputDir);
  }

  // Clean up original archive (except for .deb packages where we keep them)
  if (options.type !== 'binary' && options.type !== 'deb') {
    await fs.remove(archivePath);
    console.log('Cleaned up temporary files');
  }
}

async function handleDebPackage(debPath: string, outputDir: string) {
  console.log(`Processing Debian package: ${debPath}`);

  // For .deb packages, we'll keep the original .deb file and rename it to ffmpeg.deb
  const debBinaryName = 'ffmpeg.deb';
  const destPath = resolve(outputDir, debBinaryName);

  // Move the .deb file to the standardized name
  await fs.move(debPath, destPath, { overwrite: true });

  // Get file size for logging
  const stats = await fs.stat(destPath);
  const sizeMB = Math.round((stats.size / 1024 / 1024) * 100) / 100;

  console.log(`Debian package is ready at ${destPath} (${sizeMB}MB)`);
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

async function handle7zArchive(archivePath: string, outputDir: string) {
  console.log(`Processing 7z archive: ${archivePath}`);

  const tempExtractPath = resolve(outputDir, 'temp');
  await fs.ensureDir(tempExtractPath);

  try {
    // Check if 7z command is available
    await execAsync('7z --help');

    // Extract the 7z archive
    await execAsync(`7z x "${archivePath}" -o"${tempExtractPath}" -y`);

    console.log(`Extracted 7z archive to ${tempExtractPath}`);

    // Extract relevant files only
    await extractRelevantFiles(tempExtractPath, outputDir);
  } catch (error) {
    console.error(`Error extracting 7z archive: ${error}`);
    throw new Error('Failed to extract 7z archive. Make sure 7z is installed on your system.');
  } finally {
    // Clean up temp directory
    await fs.remove(tempExtractPath);
  }
}

async function extractArchive(archivePath: string, outputDir: string) {
  console.log(`Extracting ${archivePath}...`);

  const tempExtractPath = resolve(outputDir, 'temp');
  await fs.ensureDir(tempExtractPath);

  await decompress(archivePath, tempExtractPath, { plugins: [decompressUnzip(), decompressTar(), decompressTargz(), decompressTarxz(), decompressTarbz2()] });

  await extractRelevantFiles(tempExtractPath, outputDir);

  // Clean up temp directory
  await fs.remove(tempExtractPath);
}

async function extractRelevantFiles(sourceDir: string, outputDir: string) {
  console.log('Extracting relevant files...');

  // Find all files recursively
  const allFiles = await findAllFiles(sourceDir);

  // Filter out ignored files
  const relevantFiles = allFiles.filter((file) => !shouldIgnoreFile(file.name));
  const ignoredCount = allFiles.length - relevantFiles.length;

  console.log(`Found ${allFiles.length} files, keeping ${relevantFiles.length} (ignored ${ignoredCount}):`);

  for (const file of relevantFiles) {
    const fileName = file.name;
    const sourceFile = file.path;
    const destPath = resolve(outputDir, fileName);

    console.log(`  - ${fileName}`);

    // Copy file to output directory
    await fs.copy(sourceFile, destPath);

    // Set executable permissions for binaries on Unix-like systems
    if (options.platform !== 'win32' && (fileName === 'ffmpeg' || fileName === 'ffprobe' || !fileName.includes('.'))) {
      await fs.chmod(destPath, 0o755);
    }
  }

  // Verify that at least ffmpeg was extracted
  const ffmpegName = options.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const ffmpegPath = resolve(outputDir, ffmpegName);

  if (!(await fs.pathExists(ffmpegPath))) {
    throw new Error(`FFmpeg binary not found after extraction: ${ffmpegName}`);
  }

  console.log(`Successfully extracted ${relevantFiles.length} relevant files to ${outputDir}`);
}

async function findAllFiles(dir: string): Promise<{ name: string; path: string }[]> {
  const allFiles: { name: string; path: string }[] = [];

  async function searchDirectory(currentDir: string) {
    try {
      const items = await fs.readdir(currentDir);

      for (const item of items) {
        const itemPath = join(currentDir, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          // Recursively search subdirectories
          await searchDirectory(itemPath);
        } else if (stats.isFile()) {
          // Add all files
          allFiles.push({
            name: item,
            path: itemPath,
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${currentDir}: ${error.message}`);
    }
  }

  await searchDirectory(dir);

  // Sort files so ffmpeg comes first, then ffprobe, then everything else
  allFiles.sort((a, b) => {
    const aIsFFmpeg = /^ffmpeg(\.exe)?$/.test(a.name);
    const bIsFFmpeg = /^ffmpeg(\.exe)?$/.test(b.name);
    const aIsFFprobe = /^ffprobe(\.exe)?$/.test(a.name);
    const bIsFFprobe = /^ffprobe(\.exe)?$/.test(b.name);

    if (aIsFFmpeg && !bIsFFmpeg) return -1;
    if (!aIsFFmpeg && bIsFFmpeg) return 1;
    if (aIsFFprobe && !bIsFFprobe && !bIsFFmpeg) return -1;
    if (!aIsFFprobe && bIsFFprobe && !aIsFFmpeg) return 1;

    return a.name.localeCompare(b.name);
  });

  return allFiles;
}

downloadAndExtract().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
