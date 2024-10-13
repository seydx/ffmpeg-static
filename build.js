import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const targets = JSON.parse(readFileSync('ffmpeg-targets.json', 'utf-8'));

const outputDir = 'ffmpeg-binaries';

if (!existsSync(outputDir)) {
  mkdirSync(outputDir);
}

for (const target of targets) {
  const { platform, arch, version, url, filename } = target;
  const targetDir = join(outputDir, `${platform}-${arch}-${version}`);
  const outputOption = `--output ${targetDir}`;

  const command = `node ./dist/cli.js --platform ${platform} --arch ${arch} --version ${version} --url ${url} --filename ${filename} ${outputOption}`;
  console.log(`Executing: ${command}`);

  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`FFmpeg for ${platform}-${arch}-${version} downloaded to ${targetDir}\n`);
  } catch (error) {
    console.error(`Failed to download FFmpeg for ${platform}-${arch}-${version}\n`);
  }
}
