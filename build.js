import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Load all targets from a single file
const targets = JSON.parse(readFileSync('ffmpeg-targets.json', 'utf-8'));

const outputDir = 'ffmpeg-binaries';

if (!existsSync(outputDir)) {
  mkdirSync(outputDir);
}

for (const target of targets) {
  const { platform, arch, version, url, filename, type, distro } = target;

  // Create a directory structure that includes distro info if present
  const dirName = distro ? `${platform}-${arch}-${version}-${distro}` : `${platform}-${arch}-${version}`;

  const targetDir = join(outputDir, dirName);
  const outputOption = `--output ${targetDir}`;

  // Build the command with all relevant options
  let command = `node ./dist/cli.js --platform ${platform} --arch ${arch} --version ${version} --url ${url} --filename ${filename}`;

  // Add type if specified
  if (type) {
    command += ` --type ${type}`;
  }

  // Add distro if specified
  if (distro) {
    command += ` --distro ${distro}`;
  }

  // Add output directory
  command += ` ${outputOption}`;

  console.log(`Executing: ${command}`);

  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`FFmpeg for ${dirName} downloaded to ${targetDir}\n`);
  } catch (error) {
    console.error(`Failed to download FFmpeg for ${dirName}: ${error.message}\n`);
  }
}
