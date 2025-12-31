declare const browser: any;
declare const defineContentScript: any;

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    // 确保只在顶层窗口运行，避免在 iframe 中重复创建
    if (window.self !== window.top) {
      return;
    }

    // 监听来自 background 的消息
    browser.runtime.onMessage.addListener((message: any) => {
      if (message.action === "toggle_overlay") {
        toggleOverlay();
      } else if (message.action === "close_overlay") {
        removeOverlay();
      }
    });
  },
});

const OVERLAY_IFRAME_ID = "nolet-overlay-iframe";
const OVERLAY_CONTAINER_ID = "nolet-overlay-container";
const OVERLAY_BACKDROP_ID = "nolet-overlay-backdrop";

function toggleOverlay() {
  const existingContainer = document.getElementById(OVERLAY_CONTAINER_ID);
  if (existingContainer) {
    removeOverlay();
    return;
  }

  createOverlay();
}

function createOverlay() {
  // 再次检查防止竞态条件
  if (document.getElementById(OVERLAY_CONTAINER_ID)) {
    return;
  }

  // 创建背景遮罩 (可选，点击关闭)
  const overlayBackdrop = document.createElement("div");
  overlayBackdrop.id = OVERLAY_BACKDROP_ID;
  Object.assign(overlayBackdrop.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "2147483646", // 比 container 低一层
    backgroundColor: "transparent", // 透明，只用于捕获点击
  });
  overlayBackdrop.addEventListener("click", removeOverlay);
  document.body.appendChild(overlayBackdrop);

  // 创建容器 div (用于控制圆角和阴影)
  const container = document.createElement("div");
  container.id = OVERLAY_CONTAINER_ID;
  Object.assign(container.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "380px",
    height: "600px",
    borderRadius: "24px", // 圆角设置在容器上
    overflow: "hidden", // 强制裁剪内部 iframe
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)", // 阴影设置在容器上
    zIndex: "2147483647", // 最高层级
    backgroundColor: "transparent",
  });

  // 创建 iframe
  const iframe = document.createElement("iframe");
  iframe.id = OVERLAY_IFRAME_ID;
  // 添加 mode=overlay 参数以便 Layout.tsx 识别并设置透明背景
  iframe.src = browser.runtime.getURL("/popup.html?mode=overlay");

  // 设置 iframe 样式 (充满容器)
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "none",
    backgroundColor: "transparent", // 确保 iframe 本身背景透明
    colorScheme: "auto",
  });

  iframe.setAttribute("allowtransparency", "true");

  // 组装
  container.appendChild(iframe);
  document.body.appendChild(container);
}

function removeOverlay() {
  const container = document.getElementById(OVERLAY_CONTAINER_ID);
  if (container) {
    container.remove();
  }
  const overlayBackdrop = document.getElementById(OVERLAY_BACKDROP_ID);
  if (overlayBackdrop) {
    overlayBackdrop.remove();
  }
}
