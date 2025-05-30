# @seydx/ffmpeg-static

A comprehensive FFmpeg static binary downloader and manager for multiple platforms and architectures. Designed for the camera.ui ecosystem but can be used standalone.

[![npm version](https://img.shields.io/npm/v/@seydx/ffmpeg-static.svg)](https://www.npmjs.com/package/@seydx/ffmpeg-static)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.17.0+-green.svg)](https://nodejs.org/)

## 🚀 Features

- **Multi-Platform Support**: Windows, macOS, Linux, FreeBSD
- **Multiple Architectures**: x64, ARM64, ARM32, IA32
- **Various Sources**: Official FFmpeg builds, Jellyfin builds, specialized builds
- **Format Support**: ZIP, TAR (gz/xz/bz2), DEB packages, 7z archives, direct binaries
- **Automated Downloads**: Batch download for all supported platforms
- **Smart Extraction**: Automatic detection and extraction of FFmpeg binaries
- **Linux Distribution Support**: Debian, Ubuntu variants (Bookworm, Bullseye, Focal, Jammy, Noble)
- **Specialized Builds**: Jellyfin-optimized, Rockchip hardware acceleration

## 📦 Installation

```bash
npm install @seydx/ffmpeg-static
```

## 🛠️ Usage

### Command Line Interface

#### Download Single Platform

```bash
# Download FFmpeg for current platform
ffmpeg-static --platform linux --arch x64 --version 7.1 \
  --url "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n7.1-latest-linux64-gpl-7.1.tar.xz" \
  --filename "ffmpeg-n7.1-latest-linux64-gpl-7.1.tar.xz"

# Download with specific output directory
ffmpeg-static --platform darwin --arch arm64 --version 7.1.1 \
  --url "https://www.osxexperts.net/ffmpeg711arm.zip" \
  --filename "ffmpeg711arm.zip" \
  --output ./my-ffmpeg-binaries

# Download Debian package for Ubuntu
ffmpeg-static --platform linux --arch x64 --version 7.1.1-jellyfin \
  --url "https://github.com/jellyfin/jellyfin-ffmpeg/releases/download/v7.1.1-4/jellyfin-ffmpeg7_7.1.1-4-jammy_amd64.deb" \
  --filename "jellyfin-ffmpeg7_7.1.1-4-jammy_amd64.deb" \
  --type deb --distro jammy
```

#### Batch Download All Platforms

```bash
# Download FFmpeg binaries for all supported platforms
npm run build:all
```

### Programmatic Usage

```typescript
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Load available targets
const targets = JSON.parse(readFileSync('ffmpeg-targets.json', 'utf-8'));

// Find specific target
const target = targets.find(t => 
  t.platform === 'linux' && 
  t.arch === 'x64' && 
  t.version === '7.1'
);

if (target) {
  const command = `ffmpeg-static --platform ${target.platform} --arch ${target.arch} --version ${target.version} --url ${target.url} --filename ${target.filename} --type ${target.type}`;
  execSync(command);
}
```

## 📋 Supported Platforms

### Windows (win32)
- **x64**: FFmpeg 7.1, 6.1
- **ARM64**: FFmpeg 7.1.1, 7.1, 6.1 
- **IA32**: FFmpeg 7.1
- **Jellyfin Builds**: Optimized portable builds

### macOS (darwin)
- **x64**: FFmpeg 7.1.1, 7.1, 6.1
- **ARM64**: FFmpeg 7.1.1, 7.1, 6.1.2
- **Jellyfin Builds**: Portable builds with hardware acceleration

### Linux
- **x64**: FFmpeg 7.1, 6.1, Jellyfin builds
- **ARM64**: FFmpeg 7.1, 6.1, Jellyfin builds
- **ARM32**: FFmpeg 7.0.2, 6.1.2
- **ARMHF**: Jellyfin builds for various distributions
- **Rockchip**: Specialized builds with hardware acceleration

### FreeBSD
- **x64**: FFmpeg 7.0.2, 6.1.2

## 🗂️ Archive Types

| Type | Description | Platforms |
|------|-------------|-----------|
| `zip` | ZIP archives | Windows, macOS |
| `tar` | TAR archives (gz/xz/bz2) | Linux, macOS, FreeBSD |
| `deb` | Debian packages | Linux (Ubuntu/Debian) |
| `7z` | 7-Zip archives | Windows |
| `binary` | Direct binary files | Linux (specialized) |

## 🎯 Version Matrix

### Standard FFmpeg Builds

| Version | Platforms | Source |
|---------|-----------|---------|
| 7.1.1 | Windows, macOS, Linux | OSX Experts, BtbN |
| 7.1 | All platforms | BtbN, OSX Experts |
| 6.1 | All platforms | BtbN, OSX Experts |

### Jellyfin FFmpeg Builds

| Version | Features | Platforms |
|---------|----------|-----------|
| 7.1.1-jellyfin | Hardware acceleration, optimized codecs | All platforms |
| 7.0.2-jellyfin | Stable release with patches | All platforms |

### Specialized Builds

| Build | Description | Platform |
|-------|-------------|----------|
| Rockchip | Hardware acceleration for RK3588/RK3399 | Linux ARM64 |
| Homebridge | Optimized for IoT devices | Linux ARM32, FreeBSD |

## 🔧 Command Line Options

```bash
ffmpeg-static [options]

Required Options:
  --platform <platform>    Target platform (win32, linux, darwin, freebsd)
  --arch <arch>           Target architecture (x64, arm64, arm, armhf, ia32)
  --version <version>     FFmpeg version
  --url <url>            Download URL of the FFmpeg archive
  --filename <filename>   Name of the archive file

Optional Options:
  --type <type>          Archive type (zip, tar, deb, binary, 7z) [default: zip]
  --distro <distro>      Linux distribution (for deb packages)
  --output <path>        Output directory [default: ffmpeg]
  -h, --help            Display help information
```

## 📁 Project Structure

```
@seydx/ffmpeg-static/
├── src/
│   └── cli.ts              # Main CLI implementation
├── dist/                   # Compiled TypeScript
├── ffmpeg-targets.json     # All available FFmpeg targets
├── build.js               # Batch download script
├── package.json
└── README.md
```

## 🚀 Development

### Prerequisites

- Node.js 20.17.0 or higher
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/seydx/camera.ui.git
cd packages/ffmpeg-static

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

### Adding New Targets

Edit `ffmpeg-targets.json` to add new FFmpeg builds:

```json
{
  "platform": "linux",
  "arch": "x64", 
  "filename": "ffmpeg-custom.tar.gz",
  "url": "https://example.com/ffmpeg-custom.tar.gz",
  "version": "7.2",
  "type": "tar"
}
```

### Building All Targets

```bash
# Download all FFmpeg binaries
node build.js
```

This will create a `ffmpeg-binaries/` directory with subdirectories for each platform/architecture combination.

### Binary Detection

Automatically finds FFmpeg binaries in complex directory structures:

- Scans all subdirectories recursively
- Handles different naming conventions
- Sets proper executable permissions

## 📊 Download Sources

| Source | Description | Platforms |
|--------|-------------|-----------|
| [BtbN FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds) | Official static builds | Windows, Linux |
| [OSX Experts](https://www.osxexperts.net/) | macOS optimized builds | macOS |
| [Jellyfin FFmpeg](https://github.com/jellyfin/jellyfin-ffmpeg) | Media server optimized | All platforms |
| [Homebridge FFmpeg](https://github.com/homebridge/ffmpeg-for-homebridge) | IoT optimized builds | Linux, FreeBSD |
| [Rockchip Builds](https://github.com/MarcA711/Rockchip-FFmpeg-Builds) | Hardware acceleration | Linux ARM64 |

### Adding New Platforms

To add support for a new platform:

1. Add entries to `ffmpeg-targets.json`
2. Update platform detection in `cli.ts` if needed
3. Test extraction and binary detection
4. Update documentation

## 🔗 Related Projects

- [camera.ui](https://github.com/seydx/camera.ui) - Main camera surveillance system

## ⚠️ Considerations

### Legal

- All FFmpeg binaries are subject to their respective licenses (GPL, LGPL)
- Ensure compliance with licensing when distributing
- Some builds may include patented codecs

### Performance

- Hardware-accelerated builds (Jellyfin, Rockchip) recommended for production
- Choose appropriate version based on codec requirements
- Consider platform-specific optimizations

### Security

- Binaries are downloaded from trusted sources
- Verify checksums when available
- Use HTTPS URLs only

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT

---

*Part of the camera.ui ecosystem - A comprehensive camera management solution.*