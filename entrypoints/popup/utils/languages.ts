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

    // 如果不是中文，直接返回英文
    if (!browserLang.startsWith('zh')) {
        return 'en';
    }

    // 检查是否是支持的中文变体
    if (isSupportedLanguage(browserLang)) {
        return browserLang;
    }

    // 回落到简中
    return 'zh-CN';
} 