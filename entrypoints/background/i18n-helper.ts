// background 专用 i18n 工具函数
// 与 React i18next 并存，读取相同的语言设置

// 支持的语言代码映射（React i18next -> Chrome i18n）
const LANGUAGE_MAP: Record<string, string> = {
    'zh-CN': 'zh_CN',
    'en': 'en',
    'ja': 'ja',
    'ko': 'ko'
};

// 默认语言（与manifest的default_locale保持一致）
const DEFAULT_LANGUAGE = 'en';

// 缓存当前语言
let currentLanguage: string = DEFAULT_LANGUAGE;

// 初始化语言设置
export async function initBackgroundI18n(): Promise<void> {
    try {
        // 读取用户保存的语言设置（与React i18next使用相同的存储键）
        const result = await browser.storage.local.get('language');

        if (result.language && Object.keys(LANGUAGE_MAP).includes(result.language)) {
            currentLanguage = result.language;
        } else {
            // 如果没有保存的语言设置，检测浏览器语言
            const browserLang = detectBrowserLanguage();
            currentLanguage = browserLang;

            // 保存检测到的语言设置
            await browser.storage.local.set({ language: browserLang });
        }

        console.debug('Background i18n 初始化完成，当前语言:', currentLanguage);
    } catch (error) {
        console.error('初始化 background i18n 失败:', error);
        currentLanguage = DEFAULT_LANGUAGE;
    }
}

// 检测浏览器语言（popup的逻辑）
function detectBrowserLanguage(): string {
    const browserLang = navigator.language || 'en';

    // 如果不是中文，直接返回英文
    if (!browserLang.startsWith('zh')) {
        return 'en';
    }

    // 检查是否是支持的中文变体
    if (Object.keys(LANGUAGE_MAP).includes(browserLang)) {
        return browserLang;
    }

    // 回落到简中
    return 'zh-CN';
}

// 监听语言设置变化
export function watchLanguageChanges(): void {
    browser.storage.onChanged.addListener((changes) => {
        if (changes.language) {
            const newLanguage = changes.language.newValue;
            if (newLanguage && Object.keys(LANGUAGE_MAP).includes(newLanguage)) {
                currentLanguage = newLanguage;
                console.debug('Background i18n 语言已更新:', currentLanguage);
            }
        }
    });
}

// 获取本地化消息
export function getMessage(key: string, substitutions?: string | string[]): string {
    try {
        // 使用Chrome原生i18n API
        const message = (browser.i18n as any).getMessage(key, substitutions);

        if (message) {
            return message;
        }

        // 如果没有找到消息，返回key作为fallback
        console.warn(`未找到i18n消息: ${key}`);
        return key;
    } catch (error) {
        console.error(`获取i18n消息失败: ${key}`, error);
        return key;
    }
}

// 获取当前语言
export function getCurrentLanguage(): string {
    return currentLanguage;
}

// 检查是否为中文语言
export function isChineseLanguage(): boolean {
    return currentLanguage.startsWith('zh');
} 