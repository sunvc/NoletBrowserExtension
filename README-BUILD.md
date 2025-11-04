# Nolet - 编译说明

## 🌐 语言导航 [中文](#中文版本) [English](#english-version) [한국어](#한국어korean-버전) [日本語](#日本語japanese-バージョン)

---

## 中文版本

### 编译要求

本项目使用 **WXT**（Web Extension Toolkit）构建适用于 **Firefox**、**Chrome** 和 **Edge** 的浏览器扩展。编译所需程序及版本如下：

#### 操作系统要求
- **macOS**: 12.7+（Monterey 及以上）
- **Linux**: Ubuntu 18.04+ 或等效发行版

#### 必要程序及版本

1. **Node.js**: 版本 20.0.0 及以上
   - 下载地址：https://nodejs.org/
   - 验证安装：`node --version`

2. **pnpm**: 版本 9.0.0 及以上（包管理器）
   - 通过 npm 安装：`npm install -g pnpm`
   - 或独立安装：https://pnpm.io/installation
   - 验证安装：`pnpm --version`

3. **TypeScript**: 版本 5.8.3（已包含在 devDependencies）
   - 通过 pnpm 自动安装

4. **WXT**: 版本 0.20.6（Web Extension Toolkit）
   - 通过 pnpm 自动安装
   - 扩展的主要构建工具

#### 编译环境配置

1. **克隆/解压源码**
2. **进入项目目录**
3. **赋予构建脚本执行权限**：
   ```bash
   chmod +x build.sh
   ```
4. **安装依赖**：`pnpm install`
5. **运行构建脚本**：执行提供的 `build.sh` 脚本

#### 构建流程

构建流程包括以下步骤：

1. **依赖安装**：通过 pnpm 安装所有必要包
2. **TypeScript 编译**：编译 TypeScript 源文件
3. **WXT 构建**：为 Firefox 和 Chrome/Edge 目标构建扩展
4. **打包**：为所有浏览器生成可分发 ZIP 文件

#### 执行构建脚本

**首先赋予脚本可执行权限：**
```bash
chmod +x build.sh
```

**然后运行构建脚本：**
```bash
./build.sh
```

该脚本将：
- 自动设置所需执行权限
- 安装所有依赖
- 为 Firefox 和 Chrome/Edge 构建扩展
- 为所有浏览器创建 ZIP 包
- 在 `.output` 文件夹输出：
  - `nolet-<版本>-firefox.zip`（Firefox）
  - `nolet-<版本>-chrome.zip`（Chrome/Edge）

#### 最终输出

成功构建后，可在以下位置找到扩展包：
- **Firefox**：`.output/nolet-<版本>-firefox.zip`
- **Chrome/Edge**：`.output/nolet-<版本>-chrome.zip`
- **位置**：项目根目录 `.output` 文件夹

✅ 系统兼容性：已在 macOS 12.7.6 通过测试

### 源码仓库

👉 https://github.com/sunvc/nolet

该仓库包含重现扩展包所需的全部源码、构建脚本及依赖声明。


---

## English Version

### Build Requirements

This project uses **WXT** (Web Extension Toolkit) to build browser extensions for **Firefox**, **Chrome**, and **Edge**. The following programs and versions are required for building:

#### Operating System Requirements
- **macOS**: 12.7+ (Monterey or later)
- **Linux**: Ubuntu 18.04+ or equivalent distributions

#### Required Programs and Versions

1. **Node.js**: Version 20.0.0 or higher
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **pnpm**: Version 9.0.0 or higher (Package Manager)
   - Install via npm: `npm install -g pnpm`
   - Or install via standalone: https://pnpm.io/installation
   - Verify installation: `pnpm --version`

3. **TypeScript**: Version 5.8.3 (included in devDependencies)
   - Automatically installed via pnpm

4. **WXT**: Version 0.20.6 (Web Extension Toolkit)
   - Automatically installed via pnpm
   - Main build tool for the extension

#### Build Environment Setup

1. **Clone/Extract the source code**
2. **Navigate to project directory**
3. **Set execute permissions for build script**:
   ```bash
   chmod +x build.sh
   ```
4. **Install dependencies**: `pnpm install`
5. **Run build script**: Execute the provided `build.sh` script

#### Build Process

The build process consists of the following steps:

1. **Dependency Installation**: Install all required packages via pnpm
2. **TypeScript Compilation**: Compile TypeScript source files
3. **WXT Build**: Build extensions for both Firefox and Chrome/Edge targets
4. **Packaging**: Create distributable ZIP files for all browsers

#### Build Script Execution

**First, make the script executable:**
```bash
chmod +x build.sh
```

**Then run the build script:**
```bash
./build.sh
```

This script will:
- Automatically set execute permissions if needed
- Install all dependencies
- Build extensions for Firefox and Chrome/Edge
- Create ZIP packages for all browsers
- Output the following files in the `.output` folder:
  - `nolet-<Version>-firefox.zip` (Firefox)
  - `nolet-<Version>-chrome.zip` (Chrome/ Edge)

#### Final Output

After successful build, you will find the extension packages at:
- **Firefox**: `.output/nolet-<Version>-firefox.zip`
- **Chrome/Edge**: `.output/nolet-<Version>-chrome.zip`
- **Location**: Project root `.output` directory

✅ System Compatibility: Passed testing on macOS 12.7.6

### Source Code Repository

👉 https://github.com/sunvc/nolet

This repository contains all source files, build scripts, and dependency declarations required to reproduce the extension package.


---

## 한국어(Korean) 버전

### 빌드 요구사항

이 프로젝트는 **WXT**(Web Extension Toolkit)를 사용하여 **Firefox**, **Chrome**, **Edge**용 브라우저 확장 프로그램을 빌드합니다. 빌드에 필요한 프로그램과 버전은 다음과 같습니다.

#### 운영체제 요구사항
- **macOS**: 12.7+ (Monterey 이상)
- **Linux**: Ubuntu 18.04+ 또는 이에 상응하는 배포판

#### 필요한 프로그램 및 버전

1. **Node.js**: 버전 20.0.0 이상
   - 다운로드: https://nodejs.org/
   - 설치 확인: `node --version`

2. **pnpm**: 버전 9.0.0 이상 (패키지 관리자)
   - npm으로 설치: `npm install -g pnpm`
   - 또는 독립 설치: https://pnpm.io/installation
   - 설치 확인: `pnpm --version`

3. **TypeScript**: 버전 5.8.3 (devDependencies에 포함)
   - pnpm으로 자동 설치

4. **WXT**: 버전 0.20.6 (Web Extension Toolkit)
   - pnpm으로 자동 설치
   - 확장 프로그램 빌드의 주요 도구

#### 빌드 환경 설정

1. **소스 코드 복제/압축 해제**
2. **프로젝트 디렉토리로 이동**
3. **빌드 스크립트 실행 권한 설정**:
   ```bash
   chmod +x build.sh
   ```
4. **의존성 설치**: `pnpm install`
5. **빌드 스크립트 실행**: 제공된 `build.sh` 스크립트 실행

#### 빌드 과정

빌드 과정은 다음 단계로 구성됩니다:

1. **의존성 설치**: pnpm을 통해 모든 필요한 패키지 설치
2. **TypeScript 컴파일**: TypeScript 소스 파일 컴파일
3. **WXT 빌드**: Firefox 및 Chrome/Edge 대상으로 확장 프로그램 빌드
4. **패키징**: 모든 브라우저용 배포 가능한 ZIP 파일 생성

#### 빌드 스크립트 실행

**먼저 스크립트에 실행 권한 부여:**
```bash
chmod +x build.sh
```

**그런 다음 빌드 스크립트 실행:**
```bash
./build.sh
```

이 스크립트는:
- 필요한 경우 자동으로 실행 권한 설정
- 모든 의존성 설치
- Firefox 및 Chrome/Edge용 확장 프로그램 빌드
- 모든 브라우저용 ZIP 패키지 생성
- `.output` 폴더에 다음 파일 출력:
  - `nolet-<Version>-firefox.zip` (Firefox)
  - `nolet-<Version>-chrome.zip` (Chrome/Edge)

#### 최종 출력

성공적인 빌드 후, 확장 프로그램 패키지를 다음 위치에서 찾을 수 있습니다:
- **Firefox**: `.output/nolet-<Version>-firefox.zip`
- **Chrome/Edge**: `.output/nolet-<Version>-chrome.zip`
- **위치**: 프로젝트 루트 `.output` 디렉토리

✅ 시스템 호환성: macOS 12.7.6에서 테스트 통과

### 소스 코드 저장소

👉 https://github.com/sunvc/nolet

이 저장소에는 확장 프로그램 패키지를 재현하는 데 필요한 모든 소스 파일, 빌드 스크립트 및 의존성 선언이 포함되어 있습니다.


---

## 日本語(Japanese) バージョン

### ビルド要件

このプロジェクトは **WXT**（Web Extension Toolkit）を使用して、**Firefox**、**Chrome**、**Edge** 用のブラウザ拡張機能をビルドします。ビルドに必要なプログラムとバージョンは次のとおりです。

#### オペレーティングシステム要件
- **macOS**: 12.7+ (Monterey 以降)
- **Linux**: Ubuntu 18.04+ または同等のディストリビューション

#### 必要なプログラムおよびバージョン

1. **Node.js**: バージョン 20.0.0 以降
   - ダウンロード: https://nodejs.org/
   - インストール確認: `node --version`

2. **pnpm**: バージョン 9.0.0 以降（パッケージマネージャー）
   - npm でインストール: `npm install -g pnpm`
   - またはスタンドアロンインストール: https://pnpm.io/installation
   - インストール確認: `pnpm --version`

3. **TypeScript**: バージョン 5.8.3（devDependencies に含まれています）
   - pnpm 経由で自動インストール

4. **WXT**: バージョン 0.20.6（Web Extension Toolkit）
   - pnpm 経由で自動インストール
   - 拡張機能ビルドの主要ツール

#### ビルド環境のセットアップ

1. **ソースコードのクローン/抽出**
2. **プロジェクトディレクトリに移動**
3. **ビルドスクリプトの実行権限を設定**:
   ```bash
   chmod +x build.sh
   ```
4. **依存関係のインストール**: `pnpm install`
5. **ビルドスクリプトの実行**: 提供された `build.sh` スクリプトを実行

#### ビルドプロセス

ビルドプロセスは以下のステップで構成されます:

1. **依存関係のインストール**: pnpm を通じてすべての必要なパッケージをインストール
2. **TypeScript コンパイル**: TypeScript ソースファイルをコンパイル
3. **WXT ビルド**: Firefox および Chrome/Edge ターゲット向けに拡張機能をビルド
4. **パッケージング**: すべてのブラウザー用の配布可能な ZIP ファイルを作成

#### ビルドスクリプトの実行

**まず、スクリプトに実行権限を付与:**
```bash
chmod +x build.sh
```

**その後、ビルドスクリプトを実行:**
```bash
./build.sh
```

このスクリプトは:
- 必要に応じて実行権限を自動的に設定
- すべての依存関係をインストール
- Firefox および Chrome/Edge 用の拡張機能をビルド
- すべてのブラウザー用の ZIP パッケージを作成
- `.output` フォルダーに次のファイルを出力:
  - `nolet-<Version>-firefox.zip` (Firefox)
  - `nolet-<Version>-chrome.zip` (Chrome/Edge)

#### 最終的な出力

ビルドが成功すると、拡張機能パッケージは次の場所にあります:
- **Firefox**: `.output/nolet-<Version>-firefox.zip`
- **Chrome/Edge**: `.output/nolet-<Version>-chrome.zip`
- **場所**: プロジェクトルート `.output` ディレクトリ

✅ システム互換性: macOS 12.7.6 でテスト済み

### ソースコードリポジトリ

👉 https://github.com/sunvc/nolet

このリポジトリには、拡張機能パッケージを再現するために必要なすべてのソースファイル、ビルドスクリプト、および依存関係宣言が含まれています。


---

## Dependencies Information

### Main Dependencies
- **React**: 19.1.0 - UI framework
- **Material-UI**: 7.2.0 - UI components
- **TypeScript**: 5.8.3 - Type system
- **WXT**: 0.20.6 - Extension build toolkit
- **i18next**: 25.3.2 - Internationalization

### Development Dependencies
All development dependencies are automatically installed via `pnpm install` and are required for the build process.

For complete dependency list, refer to `package.json` in the project root.