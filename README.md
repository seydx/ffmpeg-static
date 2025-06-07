# @seydx/ffmpeg-static

FFmpeg static binary collection for multiple platforms and architectures. Get pre-compiled FFmpeg binaries from GitHub releases.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.17.0+-green.svg)](https://nodejs.org/)

## 🚀 Quick Start

**Download pre-built binaries from [GitHub Releases](https://github.com/seydx/camera.ui/releases)**

```bash
# Download and extract FFmpeg for your platform
wget https://github.com/seydx/camera.ui/releases/latest/download/ffmpeg-linux-x64-7.1.zip
unzip ffmpeg-linux-x64-7.1.zip
./ffmpeg -version
```

## 📦 Available Binaries

### Portable Binaries (Extract & Run)
- **Windows**: `ffmpeg.exe` - Ready to use
- **macOS**: `ffmpeg` - Ready to use  
- **Linux**: `ffmpeg` - Ready to use
- **FreeBSD**: `ffmpeg` - Ready to use

### Debian Packages (Install via APT)
- **Ubuntu/Debian**: `ffmpeg.deb` - Install with `sudo apt install ./ffmpeg.deb`

## 🗂️ Supported Platforms

| Platform | Architectures | Versions | Sources |
|----------|---------------|----------|---------|
| **Windows** | x64, ARM64, IA32 | 7.1.1, 7.1, 6.1 | BtbN, Jellyfin |
| **macOS** | x64, ARM64 | 7.1.1, 7.1, 6.1 | OSX Experts, Jellyfin |
| **Linux** | x64, ARM64, ARM32, ARMHF | 7.1, 6.1, Jellyfin, Rockchip | BtbN, Jellyfin, Specialized |
| **FreeBSD** | x64 | 7.0.2, 6.1.2 | Homebridge |

## 📋 Release Naming

```
ffmpeg-{platform}-{arch}-{version}[-{variant}][-{distro}].zip

Examples:
├── ffmpeg-linux-x64-7.1.zip                    # Portable binary
├── ffmpeg-win32-x64-7.1.zip                   # Windows binary
├── ffmpeg-darwin-arm64-7.1.1.zip              # macOS binary
├── ffmpeg-linux-x64-7.1.1-jellyfin-jammy.zip # Debian package
└── ffmpeg-linux-arm64-6.1-rockchip.zip        # Specialized build
```

## 🔧 Development

This repository contains the build tooling to create these releases.

### Prerequisites
- Node.js 20.17.0+
- System packages: `p7zip-full`, `dpkg-dev` (Linux)

### Build All Binaries

```bash
git clone https://github.com/seydx/camera.ui.git
cd packages/ffmpeg-static
npm install
npm run build
node build.js
```

### Add New Targets

Edit `ffmpeg-targets.js`:

```javascript
{
  platform: 'linux',
  arch: 'x64',
  version: '7.2',
  url: 'https://example.com/ffmpeg.tar.gz',
  filename: 'ffmpeg.tar.gz',
  type: 'tar'
}
```

## 📊 Download Sources

| Source | Description |
|--------|-------------|
| [BtbN FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds) | Official static builds |
| [OSX Experts](https://www.osxexperts.net/) | macOS optimized |
| [Jellyfin FFmpeg](https://github.com/jellyfin/jellyfin-ffmpeg) | Media server optimized |
| [Rockchip Builds](https://github.com/MarcA711/Rockchip-FFmpeg-Builds) | ARM SBC acceleration |

## ⚠️ Important Notes

- **Portable binaries**: Statically linked, no dependencies required
- **Debian packages**: Dynamically linked, installs system-wide with dependencies
- **Licensing**: All binaries subject to GPL/LGPL - verify compliance for distribution
- **Hardware acceleration**: Choose Jellyfin/Rockchip builds for optimized performance

## 🔗 Related

- [camera.ui](https://github.com/seydx/camera.ui) - Camera surveillance system
- [FFmpeg](https://ffmpeg.org/) - Official FFmpeg project

## License

MIT

---

*Part of the camera.ui ecosystem - A comprehensive camera management solution.*