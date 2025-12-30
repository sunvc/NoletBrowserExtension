# NoletBrowserExtension

> push to ios device by NoLet App

## Description

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

**Quick Build:**

```bash
./build.sh
```

The final extension packages will be generated at:

- Firefox: `.output/nolet-<Version>-firefox.zip`
- Chrome/Edge: `.output/nolet-<Version>-chrome.zip`

> This project is modified from [ij369/bark-sender](https://github.com/ij369/bark-sender).
