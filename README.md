# Nolet

### Quick Install | 快速上手
Just click the badge/ link below to install it from your browser's extension store!
 
点击下方 对应浏览器的 徽标/ 链接 即可跳转至的扩展商店进行安装！

<table>
  <tr>
    <td align="left">
      <a href="https://addons.mozilla.org/firefox/addon/nolet/">
        <img src="./docs/assets/badge-fx.png" alt="Firefox" height="66">
      </a><br>
      <a href="https://addons.mozilla.org/firefox/addon/nolet/">For Mozilla Firefox</a>
    </td>
    <td align="left">
      <a href="https://chromewebstore.google.com/detail/bbhjjpgkahbphfmllckjjpkgpcaghgjk">
        <img src="./docs/assets/badge-cr.png" alt="Chrome" height="66">
      </a><br>
      <a href="https://chromewebstore.google.com/detail/bbhjjpgkahbphfmllckjjpkgpcaghgjk">For Google Chrome</a>
    </td>
    <td align="left">
          <a href="https://microsoftedge.microsoft.com/addons/detail/cpeddmngdbglghhmfomfpeckcllgpcii">
        <img src="./docs/assets/badge-eg.png" alt="Edge" height="66">
      </a><br>
      <a href="https://microsoftedge.microsoft.com/addons/detail/cpeddmngdbglghhmfomfpeckcllgpcii">For Microsoft Edge</a>
    </td>
  </tr>
</table>

---

[🇺🇸 English](#english-description) | [🇨🇳 中文说明](#中文说明)

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

🧩  本扩展实现以下功能：
1. 选中网页上的任意文字，右键进行发送；
2. 在任意页面右键发送当前页面的网址；
3. 拷贝的任何一段信息，通过快捷键来发送剪切板的内容；
4. 支持添加多个装有 NoLet App 的 iOS 设备。

📌  前提要求：
需要在 iOS 设备上安装 [ NoLet App ](https://apps.apple.com/app/id6615073345) 并开启消息推送权限。

📱  如何添加 iOS 设备：
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