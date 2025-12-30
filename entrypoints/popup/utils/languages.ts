// 语言配置
export interface LanguageOption {
    code: string;
    label: string;
}

// 支持的语言列表
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
];

// 获取支持的语言列表
export function getSupportedLanguages(): LanguageOption[] {
    return SUPPORTED_LANGUAGES;
}

// 根据语言代码获取语言信息
export function getLanguageByCode(code: string): LanguageOption | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

// 检查是否是支持的语言
export function isSupportedLanguage(code: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

// 获取语言代码列表
export function getSupportedLanguageCodes(): string[] {
    return SUPPORTED_LANGUAGES.map(lang => lang.code);
}

// 检测浏览器语言并返回支持的语言代码
export function detectBrowserLanguage(): string {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';

    // 检查是否完全匹配支持的语言代码
    if (isSupportedLanguage(browserLang)) {
        return browserLang;
    }

    // 检查语言代码前缀（例如 ja-JP -> ja, ko-KR -> ko）
    const langPrefix = browserLang.split('-')[0];
    if (isSupportedLanguage(langPrefix)) {
        return langPrefix;
    }

    // 中文特殊处理 (zh, zh-CN, zh-SG, zh-Hans -> zh-CN)
    if (browserLang.startsWith('zh')) {
        return 'zh-CN';
    }

    // 默认回落到英文
    return 'en';
} 