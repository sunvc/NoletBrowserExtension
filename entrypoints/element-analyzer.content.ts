export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  main() {
    // 获取 i18n
    type I18nMessageKey = Parameters<typeof browser.i18n.getMessage>[0];
    function getMessage(
      key: I18nMessageKey,
      substitutions?: string | string[]
    ): string {
      try {
        const message = browser.i18n.getMessage(key, substitutions);
        if (message) {
          return message;
        }
        // 如果没有找到消息, 返回 key 作 fallback
        console.warn(`未找到i18n消息: ${key}`);
        return key;
      } catch (error) {
        console.error(`获取i18n消息失败: ${key}`, error);
        return key;
      }
    }

    // console.debug('调试用 content script 已加载'); // 开发模式 macOS 的 Chrome 低版本注入不了, 实测 123 版本注入不了, 125版本注入成功

    // 存储右键点击的坐标和元素
    let rightClickX = 0;
    let rightClickY = 0;
    let rightClickElements: HTMLElement[] = [];
    // 是否已经打开
    let isDialogOpen = false;
    // 存储预请求的 favicon URL
    let prefetchedFaviconUrl: string | null = null;

    // 监听右键菜单事件监听器，只记录坐标和元素
    document.addEventListener("contextmenu", function (event) {
      // 记录点击位置的坐标 和 元素
      rightClickX = event.clientX;
      rightClickY = event.clientY;
      rightClickElements = getElementsFromPoint(rightClickX, rightClickY);
      // console.debug('rightClickElements', rightClickX, rightClickY, rightClickElements);
    });

    // 监听来自 background 的消息
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === "show_dialog") {
        try {
          if (isDialogOpen) {
            return Promise.resolve({ success: false, error: "对话框已打开" });
          }
          isDialogOpen = true;
          // 当用户点击右键菜单项时显示对话框
          showSelectionDialog(message.contextInfo);
          return Promise.resolve({ success: true });
        } catch (error: unknown) {
          console.error("显示对话框时出错:", error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return Promise.resolve({ success: false, error: errorMessage });
        }
      }

      // 处理缓存图片的请求
      if (message.action === "cacheImage") {
        console.debug("收到缓存图片请求:", message);
        const { imageUrl, pushID } = message;
        if (imageUrl && pushID) {
          cacheImageToBlobDatabase(imageUrl, pushID)
            .then(() => {
              console.debug("图片缓存请求已发送:", imageUrl);
            })
            .catch((error) => {
              console.error("图片缓存失败:", error);
            });
        } else {
          console.warn("缓存图片请求缺少必要参数:", { imageUrl, pushID });
        }
        return Promise.resolve({ success: true });
      }

      return Promise.resolve({ success: false, error: "Unknown action" });
    });

    // 缓存图片到数据库
    async function cacheImageToBlobDatabase(
      imageUrl: string,
      pushID: string
    ): Promise<void> {
      try {
        console.debug("开始缓存图片:", imageUrl, pushID);

        try {
          // 首先尝试内容脚本获取图片数据
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const blob = await response.blob();
          console.debug("图片数据获取成功，大小:", blob.size, "bytes");

          // 转换为 ArrayBuffer
          const arrayBuffer = await blob.arrayBuffer();

          // 首先尝试使用 Port 传输
          try {
            await sendImageViaPort(imageUrl, arrayBuffer, pushID);
            console.debug("图片缓存保存成功 (Port):", imageUrl);
            return; // 成功后直接返回
          } catch (portError) {
            console.warn("Port 传输失败，尝试 base64 兜底:", portError);

            // 兜底方案：使用 base64
            const base64Data = await blobToBase64(blob);
            await sendImageViaBase64(imageUrl, base64Data, pushID);
            console.debug("图片缓存保存成功 (base64):", imageUrl);
            return; // 成功后直接返回
          }
        } catch (fetchError) {
          console.warn(
            "内容脚本获取图片失败 (可能是跨域)，尝试 background 兜底:",
            fetchError
          );

          // 跨域兜底：让 background 脚本处理
          try {
            const response = await browser.runtime.sendMessage({
              action: "fetchAndCacheImage",
              imageUrl,
              pushID,
            });

            if (response?.success) {
              console.debug("图片缓存保存成功 (background 兜底):", imageUrl);
            } else {
              throw new Error(response?.error || "Background 兜底失败");
            }
          } catch (backgroundError) {
            console.error(
              "Background 兜底方案也失败，放弃缓存:",
              backgroundError
            );
            // 不抛出错误，让流程继续
          }
        }
      } catch (error) {
        console.error("图片缓存过程失败:", error);
        // 不抛出错误，让主流程继续
      }
    }

    // 通过 Port 传输图片数据
    async function sendImageViaPort(
      imageUrl: string,
      arrayBuffer: ArrayBuffer,
      pushID: string
    ): Promise<void> {
      return new Promise((resolve, reject) => {
        const port = browser.runtime.connect({ name: "imageCache" });
        let completed = false;

        // 设置超时
        const timeout = setTimeout(() => {
          if (!completed) {
            completed = true;
            port.disconnect();
            reject(new Error("Port 传输超时"));
          }
        }, 30000); // 30秒超时

        port.onMessage.addListener((response) => {
          if (completed) return;

          if (response.success) {
            completed = true;
            clearTimeout(timeout);
            port.disconnect();
            resolve();
          } else {
            completed = true;
            clearTimeout(timeout);
            port.disconnect();
            reject(new Error(response.error || "Port 传输失败"));
          }
        });

        port.onDisconnect.addListener(() => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            reject(new Error("Port 连接断开"));
          }
        });

        // 发送图片数据
        try {
          port.postMessage({
            action: "saveImageCache",
            imageUrl,
            imageData: arrayBuffer,
            pushID,
          });
        } catch (error) {
          completed = true;
          clearTimeout(timeout);
          port.disconnect();
          reject(error);
        }
      });
    }

    // 通过 base64 传输图片数据（兜底方案）
    async function sendImageViaBase64(
      imageUrl: string,
      base64Data: string,
      pushID: string
    ): Promise<void> {
      const response = await browser.runtime.sendMessage({
        action: "saveImageCacheBase64",
        imageUrl,
        imageData: base64Data,
        pushID,
      });

      if (!response?.success) {
        throw new Error(response?.error || "Base64 传输失败");
      }
    }

    // 将 Blob 转换为 base64
    function blobToBase64(blob: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () =>
          reject(new Error("Failed to convert blob to base64"));
        reader.readAsDataURL(blob);
      });
    }

    // 显示选择内容对话框
    function showSelectionDialog(contextInfo?: any) {
      // 通知 background 预请求当前页面的 favicon
      const currentPageUrl = window.location.href;
      browser.runtime
        .sendMessage({
          action: "prefetchFavicon",
          url: currentPageUrl,
        })
        .then((response) => {
          if (response?.success && response?.faviconUrl) {
            prefetchedFaviconUrl = response.faviconUrl; // background 会返回 favicon 的 URL
            console.debug(
              "Favicon 预加载 by background:",
              prefetchedFaviconUrl
            );
          } else {
            prefetchedFaviconUrl = null;
            console.debug("Favicon 预加载 by background 失败或不可用");
          }
        })
        .catch((error) => {
          console.debug("Favicon 预加载 by background 错误:", error);
          prefetchedFaviconUrl = null;
        });

      const i18n = {
        link: getMessage("link_address"), // 链接
        unknownError: getMessage("error_unknown"), // 未知错误
        parseHtmlError: getMessage("parse_html_error"), // 解析 HTML 时出错
        selectContentToSend: getMessage("select_content_to_send"), // 选择要发送的内容
        close: getMessage("close"), // 关闭
        targetInfo: getMessage("target_info"), // 目标信息
        linkAddress: getMessage("link_address"), // 链接地址
        sendLink: getMessage("send_link"), // 发送链接
        selectedText: getMessage("selected_text"), // 选中文本
        sendSelectedText: getMessage("send_selected_text"), // 发送选中文本
        imageContent: getMessage("image_content"), // 图片内容
        imageLink: getMessage("image_link"), // 图片链接
        sendImageLink: getMessage("send_image_link"), // 发送图片链接
        imageLinkInvalid: getMessage("image_link_invalid"), // 只能发送 http 或 https 协议的图片链接
        altText: getMessage("alt_text"), // 替代文本
        sendAltText: getMessage("send_alt_text"), // 发送替代文本
        image: getMessage("image"), // 图片
        imageSource: getMessage("image_source"), // 图片来源
        reloadPreview: getMessage("reload_preview"), // 重新加载预览
        textContent: getMessage("text_content"), // 文字内容
        tag: getMessage("tag"), // 标签
        backgroundImage: getMessage("background_image"), // 背景图片
        currentElement: getMessage("current_element"), // 当前元素
        parentElement: getMessage("parent_element"), // 父元素
        currentElementText: getMessage("current_element_text"), // 当前元素文本
        noParentElement: getMessage("no_parent_element"), // 无父元素
        sendCurrentElementText: getMessage("send_current_element_text"), // 发送当前元素文本
        parentElementText: getMessage("parent_element_text"), // 父元素文本
        sendParentElementText: getMessage("send_parent_element_text"), // 发送父元素文本
        pageLink: getMessage("page_link"), // 页面链接
        pageTitle: getMessage("page_title"), // 页面标题
        sendPageLink: getMessage("send_page_link"), // 发送页面链接
        text_length_tip: getMessage("text_length_tip"), // 文本长度提示
      };
      try {
        // 发送
        const handleSendContent = async (
          contentType: string,
          content: string,
          title: string
        ) => {
          if (!content.trim()) {
            return;
          }

          const TEXT_CHUNK_SIZE = 1500; // 文本分段大小
          const dialogContainer = getElement(".dialog-container");

          // 检查是否需要分段发送
          if (contentType === "text" && content.length > TEXT_CHUNK_SIZE) {
            // 使用 text-large 类型
            contentType = "text-large";

            // 将文本按照 TEXT_CHUNK_SIZE 分段
            const chunks: string[] = [];
            let start = 0;
            while (start < content.length) {
              // 设置当前段的结束位置（上限）
              let end = Math.min(start + TEXT_CHUNK_SIZE, content.length);

              // 如果没有到达文本末尾，尝试寻找更合适的分割点
              if (end < content.length) {
                let splitPoint = -1;

                const lastNewline = content.lastIndexOf("\n", end);
                const lastSpace = content.lastIndexOf(" ", end);

                if (lastNewline !== -1 && lastNewline > end - 100) {
                  splitPoint = lastNewline;
                }
                if (
                  lastSpace !== -1 &&
                  lastSpace > end - 50 &&
                  (splitPoint === -1 || lastSpace > splitPoint)
                ) {
                  splitPoint = lastSpace;
                }

                if (splitPoint !== -1 && splitPoint > start) {
                  end = splitPoint;
                }
              }

              // 添加当前段
              chunks.push(content.substring(start, end));

              // 更新下一段的起始位置（避免跳过字符）
              start = end;
              if (content[start] === "\n" || content[start] === " ") {
                start++; // 仅在分隔符时才跳过
              }
            }

            // 分段发送
            const totalChunks = chunks.length;
            const delay = (ms: number) =>
              new Promise((resolve) => setTimeout(resolve, ms));

            for (let i = 0; i < chunks.length; i++) {
              if (dialogContainer) {
                dialogContainer.classList.add("fetching");
              }

              try {
                // 如果不是第一段，等待200ms
                if (i > 0) {
                  await delay(200);
                }

                // 设置超时
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error("请求超时")), 10000)
                );

                // 构建发送消息
                const sendMessage: any = {
                  action: "send_content",
                  contentType,
                  content: chunks[i],
                  title: `[${i + 1}/${totalChunks}] Large Content ${
                    i !== chunks.length - 1 ? "🔇" : ""
                  }`,
                  copyContent: chunks[i],
                  isLastChunk: i === chunks.length - 1, // 标记是否为最后一段
                };

                // 如果预请求的 favicon 可用，添加到消息中
                if (prefetchedFaviconUrl) {
                  sendMessage.icon = prefetchedFaviconUrl;
                }

                const response = await Promise.race([
                  browser.runtime.sendMessage(sendMessage),
                  timeoutPromise,
                ]);

                if (dialogContainer) {
                  dialogContainer.classList.remove("fetching");
                }

                // 检查响应是否成功
                if (!(response?.success && response?.data?.code === 200)) {
                  console.error("发送失败:", response);
                  alert(JSON.stringify(response));
                  return;
                }

                // 最后一段发送完成后关闭对话框
                if (i === chunks.length - 1) {
                  closeDialog();
                }
              } catch (error) {
                if (dialogContainer) {
                  dialogContainer.classList.remove("fetching");
                }
                console.error("发送请求出错:", error);
                return;
              }
            }
          } else {
            // 单段发送
            if (dialogContainer) {
              dialogContainer.classList.add("fetching");
            }

            try {
              // 设置超时
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("请求超时")), 10000)
              );

              // 构建发送消息
              const sendMessage: any = {
                action: "send_content",
                contentType,
                content,
                title,
                copyContent: content,
              };

              // 如果预请求的 favicon 可用，添加到消息中
              if (prefetchedFaviconUrl) {
                sendMessage.icon = prefetchedFaviconUrl;
                console.debug("发送消息将包含 Icon:", prefetchedFaviconUrl);
              } else {
                console.debug("发送消息将不包含 Icon");
              }

              const response = await Promise.race([
                browser.runtime.sendMessage(sendMessage),
                timeoutPromise,
              ]);

              if (dialogContainer) {
                dialogContainer.classList.remove("fetching");
              }

              // 检查响应是否成功
              if (response?.success && response?.data?.code === 200) {
                closeDialog();
              } else {
                console.error("发送失败:", response);
                alert(JSON.stringify(response));
              }
            } catch (error) {
              if (dialogContainer) {
                dialogContainer.classList.remove("fetching");
              }
              console.error("发送请求出错:", error);
            }
          }
        };

        // 查找图片元素
        // 1. 从右键点击的元素中查找
        let imgElement = rightClickElements.find(
          (element) => element.tagName.toLowerCase() === "img"
        ) as HTMLImageElement | undefined;

        // 2. 如果没有找到，使用 querySelectorAll 查找坐标下的所有图片
        if (!imgElement) {
          imgElement = findImagesAtPoint(rightClickX, rightClickY)[0];
          // console.debug('imgElement', findImagesAtPoint(rightClickX, rightClickY));
        }

        // 如果没有找到img元素，尝试查找带有背景图片的元素
        let backgroundImageUrl: string | undefined;

        if (!imgElement) {
          // 遍历所有元素，查找带有背景图片的元素
          for (const element of rightClickElements) {
            try {
              // 获取计算样式
              const computedStyle = window.getComputedStyle(element);

              // 先检查 background-image 属性
              let backgroundImage = computedStyle.backgroundImage;

              // 如果 background-image 没有图片，检查 background 属性
              if (!backgroundImage || backgroundImage === "none") {
                backgroundImage = computedStyle.background;
              }

              // 检查是否有背景图片
              if (backgroundImage && backgroundImage !== "none") {
                // 使用正则匹配 url("..."), url('...'), url(...) 格式
                const urlMatch = backgroundImage.match(
                  /url\(['"]?(.*?)['"]?\)/i
                );
                if (urlMatch && urlMatch[1]) {
                  backgroundImageUrl = urlMatch[1];

                  // 处理相对路径
                  if (backgroundImageUrl.startsWith("/")) {
                    // 转换为绝对路径
                    const origin = window.location.origin;
                    backgroundImageUrl = `${origin}${backgroundImageUrl}`;
                  }

                  // console.debug('找到背景图片元素:', {
                  //     tagName: element.tagName,
                  //     className: element.className,
                  //     backgroundImage,
                  //     extractedUrl: backgroundImageUrl
                  // });
                  break;
                }
              }

              // 如果还没找到，检查 style 属性
              if (!backgroundImageUrl) {
                const inlineStyle = element.getAttribute("style");
                if (inlineStyle) {
                  // 查找内联样式中的背景图片
                  const bgImageMatch = inlineStyle.match(
                    /background(-image)?:\s*url\(['"]?(.*?)['"]?\)/i
                  );
                  if (bgImageMatch && bgImageMatch[2]) {
                    backgroundImageUrl = bgImageMatch[2];

                    // 处理相对路径
                    if (backgroundImageUrl.startsWith("/")) {
                      // 转换为绝对路径
                      const origin = window.location.origin;
                      backgroundImageUrl = `${origin}${backgroundImageUrl}`;
                    }

                    // console.debug('从内联样式找到背景图片:', {
                    //     tagName: element.tagName,
                    //     className: element.className,
                    //     style: inlineStyle,
                    //     extractedUrl: backgroundImageUrl
                    // });
                    break;
                  }
                }
              }
            } catch (e) {
              // 忽略单个元素的处理错误，继续检查下一个
              console.warn("处理元素背景图片时出错:", e);
            }
          }
        }

        // 获取点击的元素
        const clickedElement =
          rightClickElements.length > 0 ? rightClickElements[0] : null;

        // 获取页面URL
        const pageUrl = window.location.href;

        // 创建 Shadow DOM 宿主元素
        const shadowHost = document.createElement("div");
        shadowHost.classList.add("nolet-host");

        // 获取应用设置并应用主题
        const applyTheme = async () => {
          try {
            const result = await browser.storage.local.get(
              "nolet_app_settings"
            );
            const settings = result["nolet_app_settings"];
            const themeMode = settings?.themeMode || "system";

            let isDark = false;
            if (themeMode === "system") {
              isDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
              ).matches;
            } else {
              isDark = themeMode === "dark";
            }

            if (isDark) {
              shadowHost.setAttribute("data-theme", "dark");
            } else {
              shadowHost.setAttribute("data-theme", "light");
            }
          } catch (error) {
            console.error("获取主题设置失败:", error);
          }
        };

        applyTheme();

        // 监听系统主题变化
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
          browser.storage.local.get("nolet_app_settings").then((result) => {
            const settings = result["nolet_app_settings"];
            if (!settings?.themeMode || settings.themeMode === "system") {
              if (e.matches) {
                shadowHost.setAttribute("data-theme", "dark");
              } else {
                shadowHost.setAttribute("data-theme", "light");
              }
            }
          });
        };
        mediaQuery.addEventListener("change", handleSystemThemeChange);

        // 监听设置变更 (来自 Popup 的修改)
        const handleStorageChange = (
          changes: { [key: string]: browser.storage.StorageChange },
          areaName: string
        ) => {
          if (areaName === "local" && changes["nolet_app_settings"]) {
            const newSettings = changes["nolet_app_settings"].newValue;
            const themeMode = newSettings?.themeMode || "system";

            let isDark = false;
            if (themeMode === "system") {
              isDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
              ).matches;
            } else {
              isDark = themeMode === "dark";
            }

            if (isDark) {
              shadowHost.setAttribute("data-theme", "dark");
            } else {
              shadowHost.setAttribute("data-theme", "light");
            }
          }
        };
        browser.storage.onChanged.addListener(handleStorageChange);

        // 创建closed模式的 Shadow DOM
        const shadowRoot = shadowHost.attachShadow({ mode: "closed" });

        // 将宿主元素添加到 document.documentElement
        document.documentElement.appendChild(shadowHost);

        // 准备图片选项内容
        let imageContent = "";
        if (imgElement || backgroundImageUrl) {
          const srcset = imgElement?.getAttribute("srcset");
          // console.log('srcset', srcset);

          // 获取最高画质的图片 URL
          let bestQualityUrl: string | undefined;

          if (srcset && srcset.trim()) {
            try {
              // 解析 srcset 为对象数组
              const sources = srcset
                .split(",")
                .filter((item) => item && item.trim()) // 先过滤掉空项
                .map((item) => {
                  const parts = item.trim().split(/\s+/);
                  const url = parts[0] || "";
                  const descriptor = parts[1] || "";

                  let weight = 0;

                  if (descriptor) {
                    if (descriptor.endsWith("w")) {
                      // 宽度描述符，如 "1200w"，权重为 1200
                      const parsedWidth = parseInt(descriptor);
                      weight = isNaN(parsedWidth) ? 0 : parsedWidth;
                    } else if (descriptor.endsWith("x")) {
                      // Retina 屏幕，2x 权重为 2000
                      const parsedDensity = parseFloat(descriptor);
                      weight = isNaN(parsedDensity) ? 0 : parsedDensity * 1000; // 乘以1000使像素密度有较高优先级
                    }
                  }

                  return { url, weight };
                })
                .filter((source) => source.url); // 过滤掉解析后可能出现的空URL

              // 找出权重最大的图片
              if (sources.length > 0) {
                // 如果所有图片都没有权重，直接使用第一个
                const allZeroWeights = sources.every(
                  (source) => source.weight === 0
                );
                if (allZeroWeights) {
                  bestQualityUrl = sources[0].url;
                } else {
                  // 否则找出权重最大的
                  const maxSource = sources.reduce(
                    (a, b) => (b.weight > a.weight ? b : a),
                    sources[0]
                  );
                  bestQualityUrl = maxSource?.url || sources[0]?.url;
                }
              }
            } catch (error) {
              console.warn("解析srcset时出错:", error);
              // 出错时回退到使用第一个 URL
              try {
                const firstUrl = srcset.split(",")[0]?.trim().split(/\s+/)[0];
                if (firstUrl) {
                  bestQualityUrl = firstUrl;
                }
              } catch (e) {}
            }
          }

          const imgSrc = imgElement
            ? bestQualityUrl || imgElement.currentSrc || imgElement.src
            : backgroundImageUrl!;
          const imgAlt = imgElement ? imgElement.alt || "" : "";
          const imgSource = imgElement
            ? `&lt;img&gt; ${i18n.tag || "标签"}`
            : `${i18n.backgroundImage || "背景图片"}`;

          const imgSize =
            imgElement && imgElement.naturalWidth
              ? `${imgElement.naturalWidth} × ${imgElement.naturalHeight}`
              : "";

          imageContent = `
                        <div class="option-container">
                            <div class="section-title">${
                              i18n.imageContent || "图片内容"
                            }</div>
                            <div class="image-content-box">
                                
                                <div class="form-area">
                                    <div class="input-group img-input-container">
                                        <label for="img-src">${
                                          i18n.imageLink || "图片链接"
                                        }:</label>
                                        <textarea id="img-src" class="textarea" spellcheck="false" autocomplete="off">${imgSrc}</textarea>
                                        <button class="btn btn-primary send-img-src">${
                                          i18n.sendImageLink || "发送图片链接"
                                        }</button>
                                        <div class="img-message" style="visibility: hidden; color: #f44336; font-size: 0.75em; margin-top: 0.25em;">${
                                          i18n.imageLinkInvalid ||
                                          "只能发送http或https开头的图片链接"
                                        }</div>
                                    </div>
                                    ${
                                      imgAlt
                                        ? `
                                    <div class="input-group">
                                        <label for="img-alt">${
                                          i18n.altText || "替代文本"
                                        }:</label>
                                        <textarea id="img-alt" class="textarea" spellcheck="false" autocomplete="off">${imgAlt}</textarea>
                                        <button class="btn btn-primary send-img-alt">${
                                          i18n.sendAltText || "发送替代文本"
                                        }</button>
                                    </div>
                                    `
                                        : ""
                                    }
                                </div>
                                <div class="preview-area">
                                    <div class="img-preview">
                                        <div class="thumbnail-container">
                                            <img src="${imgSrc}" alt="${
            imgAlt || i18n.image || "图片"
          }" title="${
            i18n.imageSource || "图片来源"
          }: ${imgSource}" class="thumbnail">
                                            ${
                                              imgSize
                                                ? `<div class="img-size">${imgSize}</div>`
                                                : ""
                                            }
                                        </div>
                                    </div>
                                    <button class="btn btn-secondary reload-preview">${
                                      i18n.reloadPreview || "重新加载预览"
                                    }</button>
                                </div>
                            </div>
                        </div>
                    `;
        }

        // 准备文本选项内容
        let textContent = "";
        if (
          clickedElement &&
          clickedElement.innerText &&
          clickedElement.innerText.trim()
        ) {
          const parentElement = clickedElement.parentElement;
          const parentText = parentElement
            ? parentElement.innerText
            : i18n.noParentElement || "无父元素";

          textContent = `
                        <div class="option-container">
                            <div class="section-title">${
                              i18n.textContent || "文字内容"
                            }</div>
                            <div class="tabs">
                                <div class="tab tab-current active">${
                                  i18n.currentElement || "当前元素"
                                }</div>
                                <div class="tab tab-parent">${
                                  i18n.parentElement || "父元素"
                                }</div>
                            </div>
                            <div class="tab-content">
                                <div class="tab-pane current-content active">
                                    <div class="input-group">
                                        <label for="current-text">${
                                          i18n.currentElementText ||
                                          "当前元素文本"
                                        }:</label>
                                        <textarea id="current-text" class="textarea" spellcheck="false" autocomplete="off">${
                                          clickedElement.innerText
                                        }</textarea>
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <button class="btn btn-primary send-current-text">${
                                          i18n.sendCurrentElementText ||
                                          "发送当前元素文本"
                                        }</button>
                                        <span style="color: var(--text-secondary); font-size: 0.625em;">${
                                          i18n.text_length_tip ||
                                          "文本如果过长，可能会分段发送"
                                        }</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="tab-pane parent-content">
                                    <div class="input-group">
                                        <label for="parent-text">${
                                          i18n.parentElementText || "父元素文本"
                                        }:</label>
                                        <textarea id="parent-text" class="textarea" spellcheck="false" autocomplete="off">${parentText}</textarea>
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <button class="btn btn-primary send-parent-text">${
                                          i18n.sendParentElementText ||
                                          "发送父元素文本"
                                        }</button>
                                        <span style="color: var(--text-secondary); font-size: 0.625em;">${
                                          i18n.text_length_tip ||
                                          "文本如果过长，可能会分段发送"
                                        }</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
        }

        // 准备页面链接选项内容
        const urlContent = `
                    <div class="option-container">
                        <div class="section-title">${
                          i18n.pageLink || "页面链接"
                        }</div>
                        <div class="input-group">
                            <label for="page-title">${
                              i18n.pageTitle || "页面标题"
                            }:</label>
                            <input type="text" id="page-title" class="input" value="${
                              document.title
                            }" spellcheck="false" autocomplete="off">
                        </div>
                        <div class="input-group">
                            <label for="page-url">${
                              i18n.pageLink || "页面链接"
                            }:</label>
                            <textarea id="page-url" class="textarea" spellcheck="false" autocomplete="off">${pageUrl}</textarea>
                            <button class="btn btn-primary send-page-url">${
                              i18n.sendPageLink || "发送页面链接"
                            }</button>
                        </div>
                    </div>
                `;

        // 准备右键菜单上下文信息内容
        let contextContent = "";
        if (contextInfo) {
          // console.debug('contextInfo', contextInfo);
          const hasLinkInfo = contextInfo.linkUrl;
          const hasSelectionText = contextInfo.selectionText;

          if (hasLinkInfo || hasSelectionText) {
            contextContent = `
                            <div class="option-container">
                                <div class="section-title">${
                                  i18n.targetInfo || "目标信息"
                                }</div>
                                ${
                                  hasLinkInfo
                                    ? `
                                <div class="input-group">
                                    <label for="context-link-url">${
                                      i18n.linkAddress || "链接地址"
                                    }:</label>
                                    <textarea id="context-link-url" class="textarea" spellcheck="false" autocomplete="off">${
                                      contextInfo.linkUrl || ""
                                    }</textarea>
                                    ${
                                      contextInfo.linkUrl
                                        ? `<button class="btn btn-primary send-context-link">${
                                            i18n.sendLink || "发送链接"
                                          }</button>`
                                        : ""
                                    }
                                </div>
                                `
                                    : ""
                                }
                                
                                ${
                                  hasSelectionText
                                    ? `
                                <div class="input-group">
                                    <label for="context-selection">${
                                      i18n.selectedText || "选中文本"
                                    }:</label>
                                    <textarea id="context-selection" class="textarea" spellcheck="false" autocomplete="off">${
                                      contextInfo.selectionText || ""
                                    }</textarea>
                                    ${
                                      contextInfo.selectionText
                                        ? `<button class="btn btn-primary send-context-selection">${
                                            i18n.sendSelectedText ||
                                            "发送选中文本"
                                          }</button>`
                                        : ""
                                    }
                                </div>
                                `
                                    : ""
                                }
                            </div>
                        `;
          }
        }

        // 构建完整 HTML  对话框
        const dialogHTML = `
                    <div class="nolet-root">
                        <div class="dialog-container">
                            <div class="dialog">
                                <div class="dialog-title-container">
                                    <h2 class="dialog-title">${i18n.selectContentToSend}</h2>
                                    <button class="close-btn" title="${i18n.close}">
                                        <svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                                    </button>
                                </div>
                                <div class="dialog-body">
                                    ${contextContent}
                                    ${imageContent}
                                    ${textContent}
                                    ${urlContent}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

        const styles = `/* css start */
:host {
    font-size: 14px;
    --primary: #6200ea;
    --primary-hover: #5000c2;
    --primary-active: #3c0091;
    --primary-text: #ffffff;

    --secondary: #64748b;
    --secondary-hover: #475569;
    --secondary-active: #334155;
    --secondary-text: #ffffff;

    --surface: #ffffff;
    --background: #f8fafc;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --border: #e2e8f0;
    --input-bg: #f1f5f9;
    
    --radius-lg: 16px;
    --radius-md: 12px;
    --radius-sm: 8px;

    --option-bg: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,247,250,0.9));
    --option-shadow: 0 2px 8px rgba(0,0,0,0.05);
    --option-shadow-hover: 0 8px 16px rgba(0,0,0,0.1);
}

:host([data-theme="dark"]) {
    --primary: #b388ff;
    --primary-hover: #a06fff;
    --primary-active: #7c52cb;
    --primary-text: rgba(0, 0, 0, 0.87);

    --secondary: #94a3b8;
    --secondary-hover: #cbd5e1;
    --secondary-active: #e2e8f0;
    --secondary-text: #ffffff;

    --surface: #1e1e1e;
    --background: #121212;
    --text-primary: #ffffff;
    --text-secondary: rgba(255, 255, 255, 0.7);
    --border: rgba(255, 255, 255, 0.12);
    --input-bg: rgba(255, 255, 255, 0.08);

    --option-bg: #1e1e1e;
    --option-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    --option-shadow-hover: 0 2px 6px rgba(0, 0, 0, 0.2);
}
  
* {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
}
  
.nolet-root {
    all: initial;
    font-family: inherit;
    font-size: 1em;
    line-height: 1.5;
    color: inherit;
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    contain: layout style;
}
  
.dialog-container {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    opacity: 1;
    transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-container.closing {
    opacity: 0;
}
  
.dialog {
    background-color: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 32em;
    max-height: 85vh;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: dialog-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes dialog-enter {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
  
.dialog-title-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25em 1.5em;
    background-color: var(--surface);
    min-height: 3.5em;
    flex-shrink: 0;
    user-select: none;
    border-bottom: 1px solid var(--border);
}
  
.dialog-body {
    padding: 1.5em;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5em;
    background-color: var(--background);
    max-height: calc(85vh - 4em);
}

.dialog-body::-webkit-scrollbar {
    width: 6px;
}

.dialog-body::-webkit-scrollbar-track {
    background: transparent;
}

.dialog-body::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.dialog-body::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
  
.close-btn {
    position: relative;
    border: none;
    background: transparent;
    font-size: 1em;
    cursor: pointer;
    color: var(--text-secondary);
    width: 2em;
    height: 2em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
    margin-left: 0.5em;
}
.close-btn:hover {
    background-color: var(--input-bg);
    color: var(--text-primary);
}
.close-btn:active {
    background-color: var(--border);
}
  
.close-btn svg {
    width: 1.25em;
    height: 1.25em;
    fill: currentColor;
}
  
.dialog-title {
    font-size: 1.125em;
    font-weight: 600;
    margin: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-primary);
}
  
.options-container {
    display: flex;
    flex-direction: column;
    gap: 1.5em;
}
  
.option-container {
    background: var(--option-bg);
    border-radius: var(--radius-md);
    padding: 1.5em;
    box-shadow: var(--option-shadow);
    border: 1px solid var(--border);
    transition: transform 0.2s, box-shadow 0.2s;
}

.option-container:hover {
    box-shadow: var(--option-shadow-hover);
}
  
.section-title {
    font-weight: 600;
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1em;
    color: var(--text-secondary);
    user-select: none;
}
  
.image-content-box {
    display: flex;
    flex-direction: row;
    gap: 1.5em;
}
  
.preview-area {
    margin-bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5em;
}
  
.img-preview {
    display: flex;
    gap: 1em;
    margin-bottom: 0.5em;
}
  
.thumbnail-container {
    flex-shrink: 0;
    width: 8em;
    height: 8em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    background-color: var(--input-bg);
    border: 1px solid var(--border);
    position: relative;
    overflow: hidden;
}
  
.thumbnail {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.img-size {
    position: absolute;
    bottom: 0.25em;
    right: 0.25em;
    font-size: 0.625em;
    color: white;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 0.15em 0.4em;
    border-radius: 4px;
    user-select: none;
    backdrop-filter: blur(2px);
}
  
.form-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1em;
}

.img-input-container {
    position: relative;
}

.img-message {
    position: absolute;
    bottom: -1.5em;
    width: 100%;
    background-color: transparent;
    color: #ef4444 !important;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    margin-bottom: 0.5em;
}
  
.input-group:last-child {
    margin-bottom: 0;
}
  
label {
    font-weight: 500;
    font-size: 0.875em;
    color: var(--text-primary);
    user-select: none;
}

.input,
.textarea {
    width: 100%;
    padding: 0.625em 0.875em;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    font-size: 0.875em;
    background-color: var(--input-bg);
    color: var(--text-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    transition: all 0.2s;
}

.input:focus,
.textarea:focus {
    outline: none;
    background-color: var(--surface);
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.textarea {
    height: 4.5em;
    resize: vertical;
    line-height: 1.4;
}

#img-src {
    height: 5em;
}
#current-text,
#parent-text {
    height: 8em;
}
#context-selection {
    height: 3.5em;
}
  
.btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 1.25em;
    height: 2.25em;
    min-width: 4em;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.875em;
    font-weight: 500;
    line-height: 1;
    text-align: center;
    overflow: hidden;
    outline: none;
    border: 1px solid transparent;
    user-select: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
  
.btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-hover));
    color: var(--primary-text);
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
}
  
.btn-primary:hover {
    background: linear-gradient(135deg, var(--primary-hover), var(--primary-active));
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3), 0 4px 6px -1px rgba(37, 99, 235, 0.15);
}
  
.btn-primary:active {
    background: linear-gradient(135deg, var(--primary-active), var(--primary-active));
    transform: translateY(0);
    box-shadow: 0 2px 4px -1px rgba(37, 99, 235, 0.2);
}
  
.btn-secondary {
    background-color: transparent;
    color: var(--secondary);
    border-color: var(--border);
}
  
.btn-secondary:hover {
    background-color: var(--input-bg);
    color: var(--text-primary);
    border-color: var(--text-secondary);
}
  
.btn-secondary:active {
    background-color: var(--border);
}
  
.fetching .btn,
.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(100%);
    pointer-events: none;
}
  
.tabs {
    display: flex;
    background-color: var(--input-bg);
    padding: 0.25em;
    border-radius: var(--radius-sm);
    margin-bottom: 1em;
    position: relative;
    border: none;
}

.tabs::after {
    display: none;
}

.tab {
    padding: 0.5em 1em;
    cursor: pointer;
    font-size: 0.875em;
    font-weight: 500;
    color: var(--text-secondary);
    position: relative;
    transition: all 0.2s;
    text-transform: none;
    letter-spacing: normal;
    user-select: none;
    white-space: nowrap;
    flex: 1;
    text-align: center;
    border-radius: calc(var(--radius-sm) - 2px);
    z-index: 1;
}

.tab.active {
    color: var(--primary);
    background-color: var(--surface);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    font-weight: 600;
}

.tab:hover:not(.active) {
    color: var(--text-primary);
}

.tab-content {
    width: 100%;
    padding-top: 0.5em;
}
.tab-pane {
    display: none;
    animation: fade-in 0.2s ease-out;
}
.tab-pane.active {
    display: block;
}

@keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}
/* css end */`;

        // 获取 Shadow DOM 中的元素
        const getElement = (selector: string) =>
          shadowRoot.querySelector(selector);
        const getAllElements = (selector: string) =>
          shadowRoot.querySelectorAll(selector);

        // 关闭对话框
        const closeDialog = () => {
          // console.debug('关闭对话框');
          isDialogOpen = false;
          try {
            // 移除主题监听器
            if (mediaQuery && handleSystemThemeChange) {
              mediaQuery.removeEventListener("change", handleSystemThemeChange);
            }
            if (browser.storage.onChanged && handleStorageChange) {
              browser.storage.onChanged.removeListener(handleStorageChange);
            }

            document.removeEventListener("keydown", handleKeyDown);

            const dialogContainer = getElement(".dialog-container");
            if (dialogContainer) {
              dialogContainer.classList.add("closing");

              setTimeout(() => {
                try {
                  document.documentElement.removeChild(shadowHost);
                } catch (e) {
                  console.error("移除对话框元素时出错:", e);
                }
              }, 312);
            } else {
              document.documentElement.removeChild(shadowHost);
            }
          } catch (e) {
            console.error("关闭对话框时出错:", e);
          } finally {
            document.removeEventListener("keydown", handleKeyDown);
          }
        };

        // 添加 ESC 键关闭对话框功能
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === "Escape") {
            closeDialog();
          }
        };
        document.addEventListener("keydown", handleKeyDown);

        // 创建样式元素
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        shadowRoot.appendChild(styleElement);

        // 创建 DOM 结构
        const createElementFromHTML = (html: string): DocumentFragment => {
          // 使用 DOMParser 解析 HTML 字符串
          const parser = new DOMParser();
          const doc = parser.parseFromString(
            `<template>${html}</template>`,
            "text/html"
          );
          const template = doc.querySelector("template");

          if (!template) {
            throw new Error("Failed to parse HTML");
          }

          return template.content;
        };

        try {
          // 解析 HTML
          // throw new Error('test');
          const dialogFragment = createElementFromHTML(dialogHTML);
          shadowRoot.appendChild(dialogFragment);
        } catch (error) {
          console.error("解析HTML时出错:", error);

          const fallbackDialog = document.createElement("div");
          fallbackDialog.className = "fallback-dialog";

          const fallbackTitle = document.createElement("h3");
          fallbackTitle.textContent = "Nolet";
          fallbackTitle.className = "fallback-title";

          const fallbackMessage = document.createElement("p");
          fallbackMessage.textContent =
            i18n.parseHtmlError || "解析 HTML 时出错";
          fallbackMessage.className = "fallback-message";

          const fallbackButton = document.createElement("button");
          fallbackButton.className = "fallback-close-btn";
          fallbackButton.title = i18n.close || "关闭";
          const fallbackSvg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          );
          fallbackSvg.setAttribute("viewBox", "0 0 24 24");
          const fallbackPath = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          fallbackPath.setAttribute(
            "d",
            "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          );
          fallbackSvg.appendChild(fallbackPath);
          fallbackButton.appendChild(fallbackSvg);
          fallbackButton.onclick = closeDialog;

          const fallbackStyle = document.createElement("style");
          fallbackStyle.textContent = `/* css start */
.fallback-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
}
.fallback-title {
    margin-bottom: 15px;
    font-size: 18px;
    font-weight: 600;
    min-width: 200px;
}
.fallback-message {
    margin-bottom: 15px;
}
.fallback-close-btn {
    margin-top: 15px;
    padding: 1px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d32f2f;
}
.fallback-close-btn svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
}
.fallback-close-btn:hover {
    background-color: rgb(253, 237, 237);
    opacity: 0.8;
}
.fallback-close-btn:active {
    opacity: 0.6;
    transition: opacity 0.2s;
}
/* css end */`;

          fallbackDialog.appendChild(fallbackTitle);
          fallbackDialog.appendChild(fallbackMessage);
          fallbackDialog.appendChild(fallbackButton);

          shadowRoot.appendChild(fallbackStyle);
          shadowRoot.appendChild(fallbackDialog);
        }

        // 点击背景关闭
        const dialogContainer = getElement(".dialog-container");
        if (dialogContainer) {
          dialogContainer.addEventListener("click", (e) => {
            if (e.target === dialogContainer) {
              closeDialog();
            }
          });
        }

        // 关闭按钮事件
        const closeBtn = getElement(".close-btn");
        if (closeBtn) {
          closeBtn.addEventListener("click", closeDialog);
        }

        // 重新加载预览按钮
        const reloadPreviewBtn = getElement(".reload-preview");
        const imgSrcTextarea = getElement(
          "#img-src"
        ) as HTMLTextAreaElement | null;
        const thumbnailImg = getElement(
          ".thumbnail"
        ) as HTMLImageElement | null;
        const sendImgSrcBtn = getElement(
          ".send-img-src"
        ) as HTMLButtonElement | null;
        const imgMessage = getElement(".img-message") as HTMLDivElement | null;

        // 检查图片链接是否有效 以 http | https 开头
        const checkImageUrl = (url: string): boolean => {
          return (
            url.trim().startsWith("http://") ||
            url.trim().startsWith("https://")
          );
        };

        // 重新加载预览按钮事件
        if (reloadPreviewBtn && imgSrcTextarea && thumbnailImg) {
          reloadPreviewBtn.addEventListener("click", () => {
            thumbnailImg.src = imgSrcTextarea.value.trim();
          });
        }

        // 发送图片链接按钮
        const imgAltTextarea = getElement(
          "#img-alt"
        ) as HTMLTextAreaElement | null;

        if (sendImgSrcBtn && imgSrcTextarea) {
          sendImgSrcBtn.addEventListener("click", () => {
            const imageUrl = imgSrcTextarea.value.trim();
            // 处理各种路径情况
            let processedUrl = imageUrl;

            const urlPattern = /^(?:(\/\/)|(\/)|(?:\.\/)|(?:\.\.\/+))(.*)/;
            const match = imageUrl.match(urlPattern);

            if (match) {
              const [, protocolRelative, rootRelative, , ...rest] = match;
              const pathPart = match[3];

              switch (true) {
                // 处理 // 相对路径
                case !!protocolRelative:
                  processedUrl = `${window.location.protocol}${imageUrl}`;
                  break;

                // 处理 / 相对路径
                case !!rootRelative:
                  processedUrl = `${window.location.origin}${imageUrl}`;
                  break;

                // 处理 ./ 当前路径
                case imageUrl.startsWith("./"):
                  const currentPath = window.location.pathname.substring(
                    0,
                    window.location.pathname.lastIndexOf("/") + 1
                  );
                  processedUrl = `${window.location.origin}${currentPath}${pathPart}`;
                  break;

                // 处理 ../ 上级路径
                case imageUrl.startsWith("../"): {
                  const currentPath = window.location.pathname;
                  // 计算需要向上多少层级
                  const upCount = (imageUrl.match(/\.\.\//g) || []).length;
                  // 分割并过滤当前路径
                  const pathSegments = currentPath.split("/").filter(Boolean);
                  // 获取目标路径
                  const targetPath = pathSegments.slice(0, -upCount).join("/");
                  // 获取剩余路径（去掉 '../' 部分）
                  const remainingPath = pathPart.replace(/^(?:\.\.\/)*/, "");

                  processedUrl = `${window.location.origin}/${targetPath}/${remainingPath}`;
                  break;
                }
              }
            }
            // 检查处理后的 URL 是否有效 // 可能存在 blob: 或者 base64 等
            if (checkImageUrl(processedUrl)) {
              // 更新文本框中的 URL 为处理后的 URL
              imgSrcTextarea.value = processedUrl;
              if (imgMessage) {
                imgMessage.style.visibility = "hidden";
              }
              const title =
                imgAltTextarea && imgAltTextarea.value
                  ? imgAltTextarea.value.trim() || i18n.image || "图片"
                  : i18n.image || "图片";
              handleSendContent("image", processedUrl, title);
            } else {
              if (imgMessage) {
                imgMessage.style.visibility = "visible";
              }
              sendImgSrcBtn.disabled = true;
              // 添加一个延时，让用户修改后重新启用按钮
              setTimeout(() => {
                if (sendImgSrcBtn) {
                  sendImgSrcBtn.disabled = false;
                  if (imgMessage) {
                    imgMessage.style.visibility = "hidden";
                  }
                }
              }, 2000);
            }
          });
        }

        // 发送替代文本按钮
        const sendImgAltBtn = getElement(".send-img-alt");

        if (sendImgAltBtn && imgAltTextarea) {
          sendImgAltBtn.addEventListener("click", () => {
            const altText = imgAltTextarea.value.trim();
            handleSendContent("text", altText, "图片替代文本");
          });
        }

        // 发送当前元素文本按钮
        const sendCurrentTextBtn = getElement(".send-current-text");
        const currentTextarea = getElement(
          "#current-text"
        ) as HTMLTextAreaElement | null;

        if (sendCurrentTextBtn && currentTextarea) {
          sendCurrentTextBtn.addEventListener("click", () => {
            const text = currentTextarea.value.trim();
            handleSendContent("text", text, "当前元素文本");
          });
        }

        // 发送父元素文本按钮
        const sendParentTextBtn = getElement(".send-parent-text");
        const parentTextarea = getElement(
          "#parent-text"
        ) as HTMLTextAreaElement | null;

        if (sendParentTextBtn && parentTextarea) {
          sendParentTextBtn.addEventListener("click", () => {
            const text = parentTextarea.value.trim();
            if (text && text !== "无父元素") {
              handleSendContent("text", text, "父元素文本");
            }
          });
        }

        // 发送页面链接按钮
        const sendPageUrlBtn = getElement(".send-page-url");
        const pageTitleInput = getElement(
          "#page-title"
        ) as HTMLInputElement | null;
        const pageUrlTextarea = getElement(
          "#page-url"
        ) as HTMLTextAreaElement | null;

        if (sendPageUrlBtn && pageTitleInput && pageUrlTextarea) {
          sendPageUrlBtn.addEventListener("click", () => {
            const url = pageUrlTextarea.value.trim();
            const title = pageTitleInput.value.trim() || "网页链接";
            handleSendContent("url", url, title);
          });
        }

        // 处理右键菜单上下文信息区域的按钮
        if (contextInfo) {
          // 发送链接按钮
          const sendContextLinkBtn = getElement(".send-context-link");
          const contextLinkUrlTextarea = getElement(
            "#context-link-url"
          ) as HTMLTextAreaElement | null;

          if (sendContextLinkBtn && contextLinkUrlTextarea) {
            sendContextLinkBtn.addEventListener("click", () => {
              const url = contextLinkUrlTextarea.value.trim();
              handleSendContent("url", url, i18n.link || "链接");
            });
          }

          // 发送选中文本按钮
          const sendContextSelectionBtn = getElement(".send-context-selection");
          const contextSelectionTextarea = getElement(
            "#context-selection"
          ) as HTMLTextAreaElement | null;

          if (sendContextSelectionBtn && contextSelectionTextarea) {
            sendContextSelectionBtn.addEventListener("click", () => {
              const text = contextSelectionTextarea.value.trim();
              handleSendContent("text", text, "选中文本");
            });
          }
        }

        // 切换选项卡
        const tabs = getAllElements(".tab");
        const tabsContainer = getElement(".tabs") as HTMLElement | null;

        if (tabsContainer) {
          // 初始化指示器位置
          const activeTab = getElement(".tab.active") as HTMLElement | null;
          if (activeTab) {
            const width = activeTab.offsetWidth;
            const left = activeTab.offsetLeft;
            tabsContainer.style.setProperty("--tab-width", `${width}px`);
            tabsContainer.style.setProperty("--tab-x", `${left}px`);
          }

          tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
              tabs.forEach((t) => t.classList.remove("active"));
              tab.classList.add("active");

              // 更新指示器位置
              const width = (tab as HTMLElement).offsetWidth;
              const left = (tab as HTMLElement).offsetLeft;
              tabsContainer.style.setProperty("--tab-width", `${width}px`);
              tabsContainer.style.setProperty("--tab-x", `${left}px`);

              // 显示对应内容
              const panes = getAllElements(".tab-pane");
              panes.forEach((pane) => pane.classList.remove("active"));

              if (tab.classList.contains("tab-current")) {
                const currentPane = getElement(".current-content");
                if (currentPane) currentPane.classList.add("active");
              } else if (tab.classList.contains("tab-parent")) {
                const parentPane = getElement(".parent-content");
                if (parentPane) parentPane.classList.add("active");
              }
            });
          });
        }
      } catch (error) {
        console.error("显示对话框时出错:", error);
        alert(
          error instanceof Error
            ? error.message
            : i18n.unknownError || "未知错误"
        );
        isDialogOpen = false; // 重置状态
      }
    }

    function findImagesAtPoint(x: number, y: number): HTMLImageElement[] {
      const imagesAtPoint: HTMLImageElement[] = [];

      // 递归查找所有图片，包括 Shadow DOM 内的图片
      function collectAllImages(
        root: Document | ShadowRoot
      ): HTMLImageElement[] {
        const images: HTMLImageElement[] = [];

        // 查找当前层级的所有图片
        const currentImages = root.querySelectorAll("img");
        currentImages.forEach((img) => images.push(img as HTMLImageElement));

        // 递归查找所有 Shadow Host 内的图片
        const allElements = root.querySelectorAll("*");
        allElements.forEach((element) => {
          if (element.shadowRoot) {
            images.push(...collectAllImages(element.shadowRoot));
          }
        });

        return images;
      }

      const allImages = collectAllImages(document);

      allImages.forEach((img) => {
        // 检查每个图片是否在指定坐标点
        const rect = img.getBoundingClientRect(); // 获取图片在页面上的位置和大小
        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          imagesAtPoint.push(img);
        }
      });

      // console.debug('坐标点下的图', x, y, imagesAtPoint);
      return imagesAtPoint;
    }

    // 获取指定坐标下方的所有元素（包括 Shadow DOM 内）
    function getElementsFromPoint(x: number, y: number): HTMLElement[] {
      const result: HTMLElement[] = [];

      function findElementsAtPointRecursive(
        root: Document | ShadowRoot,
        x: number,
        y: number
      ): HTMLElement[] {
        const elements: HTMLElement[] = [];

        // 尝试 elementsFromPoint
        if (root.elementsFromPoint) {
          const foundElements = Array.from(
            root.elementsFromPoint(x, y)
          ) as HTMLElement[];
          elements.push(...foundElements);

          // 对于每个找到的元素，检查是否有 Shadow DOM 并递归查找
          foundElements.forEach((element) => {
            if (element.shadowRoot) {
              const shadowElements = findElementsAtPointRecursive(
                element.shadowRoot,
                x,
                y
              );
              elements.push(...shadowElements);
            }
          });
        } else {
          let element = root.elementFromPoint(x, y) as HTMLElement | null;

          if (element) {
            elements.push(element);

            // 检查该元素是否有 Shadow DOM
            if (element.shadowRoot) {
              const shadowElements = findElementsAtPointRecursive(
                element.shadowRoot,
                x,
                y
              );
              elements.push(...shadowElements);
            }
          }
        }

        return elements;
      }

      // 从 document 开始递归查找
      const foundElements = findElementsAtPointRecursive(document, x, y);
      result.push(...foundElements);

      // 去重
      const uniqueElements = Array.from(new Set(result));

      return uniqueElements;
    }
  },
});
