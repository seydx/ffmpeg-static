import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import targets from './ffmpeg-targets.js';

const outputDir = 'ffmpeg-binaries';

if (!existsSync(outputDir)) {
  mkdirSync(outputDir);
}

console.log(`📦 Building ${targets.length} FFmpeg targets...\n`);

let successCount = 0;
let failureCount = 0;

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

  console.log(`🔄 Building: ${dirName}`);
  console.log(`   Command: ${command}`);

  try {
    execSync(command, { stdio: 'inherit' });

    // Check the result
    let expectedFileName;
    if (type === 'deb') {
      expectedFileName = 'ffmpeg.deb';
    } else {
      expectedFileName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    }

    const binaryPath = join(targetDir, expectedFileName);

    if (existsSync(binaryPath)) {
      const stats = statSync(binaryPath);
      const sizeMB = Math.round((stats.size / 1024 / 1024) * 100) / 100;
      const typeLabel = type === 'deb' ? '📦 DEB' : '🔧 BIN';
      console.log(`✅ ${typeLabel} ${dirName}: ${sizeMB}MB`);
      successCount++;
    } else {
      console.error(`❌ FFmpeg file not found for ${dirName} (expected: ${expectedFileName})`);
      failureCount++;
      process.exit(1);
    }

    console.log(`   ➡️  Saved to: ${targetDir}\n`);
  } catch (error) {
    console.error(`❌ Failed to build ${dirName}: ${error.message}\n`);
    failureCount++;
    process.exit(1);
  }
}

console.log('\n🎉 Build Summary:');
console.log('================');
console.log(`✅ Successful builds: ${successCount}`);
console.log(`❌ Failed builds: ${failureCount}`);
console.log(`📊 Total: ${successCount + failureCount}`);

if (failureCount === 0) {
  console.log('\n🚀 All builds completed successfully!');
} else {
  console.log('\n⚠️  Some builds failed. Check the logs above.');
  process.exit(1);
}
