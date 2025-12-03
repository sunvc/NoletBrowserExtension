# Nolet

---

### Quick Install | 快速上手

Just click the badge/ link below to install it from your browser's extension store!

点击下方 对应浏览器的 徽标/ 链接 即可跳转至的扩展商店进行安装！

<table>
	<tr>
		<td align="center">
			<a href="https://chromewebstore.google.com/detail/bbhjjpgkahbphfmllckjjpkgpcaghgjk">
				<img src="./docs/assets/badge-cr.png" alt="Chrome" height="66">
			</a><br>
			<a href="https://chromewebstore.google.com/detail/bbhjjpgkahbphfmllckjjpkgpcaghgjk">For Google Chrome</a>
		</td>
		<td align="center">
			<a href="https://addons.mozilla.org/firefox/addon/nolet/">
				<img src="./docs/assets/badge-fx.png" alt="Firefox" height="66">
			</a><br>
			<a href="https://addons.mozilla.org/firefox/addon/nolet/">For Mozilla Firefox</a>
		</td>
		<td align="center">
			<a href="https://microsoftedge.microsoft.com/addons/detail/cpeddmngdbglghhmfomfpeckcllgpcii">
				<img src="./docs/assets/badge-eg.png" alt="Edge" height="66">
			</a><br>
			<a href="https://microsoftedge.microsoft.com/addons/detail/cpeddmngdbglghhmfomfpeckcllgpcii">For Microsoft Edge</a>
		</td>
	</tr>
	<tr>
		<td align="center">
			<a href="https://apps.apple.com/app/id6740040672">
				<img src="./docs/assets/badge-sf.png" alt="Safari" height="66">
			</a><br>
			<a href="https://apps.apple.com/app/id6740040672">For Apple Safari</a>
		</td>
	</tr>
</table>

---

🌐 **English** | [中文](#中文说明) | [한국어](#한국어korean-설명) | [日本語](#日本語japanese-説明)

## English Description

**Click the badges above to install the extension from your preferred store.**

Nolet is a browser extension that allows you to quickly push selected text from a webpage or clipboard content to any iOS device with the [ NoLet App ](https://apps.apple.com/app/id6615073345) installed.

🧩 Features:

- Select any text on a webpage and right-click to send it;
- Right-click on any page to send the current URL;
- Use a keyboard shortcut to send the current clipboard content;
- Supports adding multiple iOS devices with NoLet App installed.

📌 Requirements:
You must install the [ NoLet App ](https://apps.apple.com/app/id6615073345) on your iOS device and enable notification permissions.

📱 How to Add iOS Devices:

- Open the NoLet App on your iOS device, tap the cloud icon in the top-right corner to open the server list;
- Tap any server and choose "Copy URL and Key";
- In the extension settings page, add the device using the format: `https://wzs.app/:key/`;
- Select text and right-click to push it to your default device. If no text is selected, right-click will send the current page URL instead.

---

## Build Instructions

📋 **For Extension Build**

To build this extension from source code, please refer to the detailed build instructions:

**👉 [README-BUILD.md](./README-BUILD.md)**

**Quick Build:**

```bash
./build.sh
```

The final extension packages will be generated at:

- Firefox: `.output/nolet-<Version>-firefox.zip`
- Chrome/Edge: `.output/nolet-<Version>-chrome.zip`

> This project is modified from [ij369/bark-sender](https://github.com/ij369/bark-sender).

---

## 中文说明

**点击上方徽标从对应应用商店安装扩展。**

Nolet 是一个浏览器扩展，允许你将网页中的文字内容或 PC 剪贴板中的文本，快速推送到安装了 [ NoLet App ](https://apps.apple.com/app/id6615073345) 的 iOS 设备上。

🧩 本扩展实现以下功能：

1. 选中网页上的任意文字，右键进行发送；
2. 在任意页面右键发送当前页面的网址；
3. 拷贝的任何一段信息，通过快捷键来发送剪切板的内容；
4. 支持添加多个装有 NoLet App 的 iOS 设备。

📌 前提要求：
需要在 iOS 设备上安装 [ NoLet App ](https://apps.apple.com/app/id6615073345) 并开启消息推送权限。

📱 如何添加 iOS 设备：

1. 打开 iOS 设备上的 NoLet App，点击右上角的云朵图标，打开服务器列表；
2. 点击任意服务器，选择“复制地址和 Key”；
3. 在扩展配置页里添加设备，格式为：`https://wzs.app/:key/`；
4. 选中文字，右键发送文字；未选中文字时，右键将发送当前页面链接。

## 构建说明

📋 **扩展构建**

要从源代码构建此扩展，请参考详细的构建说明文档：

**👉 [README-BUILD.md](./README-BUILD.md)**

**快速构建：**

```bash
./build.sh
```

最终的扩展包将在以下位置生成：

- Firefox: `.output/nolet-<Version>-firefox.zip`
- Chrome/Edge: `.output/nolet-<Version>-chrome.zip`

> 本项目修改自 [ij369/bark-sender](https://github.com/ij369/bark-sender)。

---

## 한국어(Korean) 설명

**위 뱃지를 클릭해 해당 스토어에서 확장 프로그램을 설치하세요.**

Nolet은 웹페이지에서 선택한 텍스트나 PC 클립보드 내용을 [NoLet App](https://apps.apple.com/app/id6615073345)이 설치된 iOS 기기로 빠르게 전송할 수 있는 브라우저 확장 프로그램입니다.

🧩 주요 기능:

- 웹페이지에서 텍스트를 선택한 후 우클릭으로 전송
- 어떤 페이지에서든 우클릭으로 현재 URL 전송
- 키보드 단축키로 클립보드 내용 전송
- NoLet App이 설치된 여러 iOS 기기 추가 지원

📌 필요 조건:
iOS 기기에 [NoLet App](https://apps.apple.com/app/id6615073345)을 설치하고 알림 권한을 활성화해야 합니다.

📱 iOS 기기 추가 방법:

1. iOS 기기에서 NoLet App을 열고, 우측 상단 구름 아이콘을 눌러 서버 목록 열기
2. 아무 서버나 누른 뒤 "URL 및 Key 복사" 선택
3. 확장 프로그램 설정 페이지에서 `https://wzs.app/:key/` 형식으로 기기 추가
4. 텍스트를 선택하고 우클릭하면 기본 기기로 전송됩니다. 텍스트가 선택되지 않은 경우 현재 페이지 링크가 전송됩니다.

## 빌드 설명

📋 **확장 프로그램 빌드**

소스 코드로부터 확장 프로그램을 빌드하려면 다음 상세 빌드 설명을 참조하세요:

**👉 [README-BUILD.md](./README-BUILD.md)**

**빠른 빌드:**

```bash
./build.sh
```

최종 확장 프로그램 패키지는 다음 위치에 생성됩니다:

- Firefox: `.output/nolet-<Version>-firefox.zip`
- Chrome/Edge: `.output/nolet-<Version>-chrome.zip`

---

## 日本語(Japanese) 説明

**上のバッジをクリックして、対応するストアから拡張機能をインストールしてください。**

Nolet は、ウェブページで選択したテキストや PC クリップボードの内容を[NoLet App](https://apps.apple.com/app/id6615073345)がインストールされた iOS デバイスに素早くプッシュできるブラウザ拡張機能です。

🧩 主な機能:

- ウェブページ上の任意のテキストを選択して右クリックで送信
- 任意のページで右クリックして現在の URL を送信
- キーボードショートカットでクリップボードの内容を送信
- NoLet App がインストールされた複数の iOS デバイスを追加可能

📌 必要な条件:
iOS デバイスに[NoLet App](https://apps.apple.com/app/id6615073345)をインストールし、通知権限を有効にする必要があります。

📱 iOS デバイスを追加する方法:

1. iOS デバイスで NoLet App を開き、右上の雲アイコンをタップしてサーバーリストを開く
2. 任意のサーバーをタップし、「URL と Key をコピー」を選択
3. 拡張機能設定ページで`https://wzs.app/:key/`の形式でデバイスを追加
4. テキストを選択して右クリックすると、デフォルトデバイスに送信されます。テキストが選択されていない場合は現在のページリンクが送信されます。

## ビルド説明

📋 **拡張機能ビルド**

ソースコードから拡張機能をビルドするには、詳細なビルド説明を参照してください：

**👉 [README-BUILD.md](./README-BUILD.md)**

**クイックビルド:**

```bash
./build.sh
```

最終的な拡張機能パッケージは以下の場所に生成されます:

- Firefox: `.output/nolet-<Version>-firefox.zip`
- Chrome/Edge: `.output/nolet-<Version>-chrome.zip`
