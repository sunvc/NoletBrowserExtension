import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { detectBrowserLanguage, isSupportedLanguage } from './utils/languages';

import translationEN from './locales/en/translation.json';
import translationZH from './locales/zh-CN/translation.json';
import translationJA from './locales/ja/translation.json';
import translationKO from './locales/ko/translation.json';



const resources = {
    en: {
        translation: translationEN
    },
    'zh-CN': {
        translation: translationZH
    },
    ja: {
        translation: translationJA
    },
    ko: {
        translation: translationKO
    }
};

const initializeLanguage = async (): Promise<string> => {
    try {
        const result = await browser.storage.local.get('language');

        if (result.language && isSupportedLanguage(result.language)) {
            // 如果已有存储的语言设置且在支持范围内，使用存储的语言
            return result.language;
        } else {
            // 没有存储语言或存储的语言不支持，检测浏览器语言
            const detectedLang = detectBrowserLanguage();

            // 存储检测到的语言
            await browser.storage.local.set({ language: detectedLang });

            return detectedLang;
        }
    } catch (error) {
        console.error('初始化语言设置失败:', error);
        // 出错时检测浏览器语言，如果不支持则回落到英文
        const detectedLang = detectBrowserLanguage();
        try {
            await browser.storage.local.set({ language: detectedLang });
        } catch (storageError) {
            console.error('存储默认语言失败:', storageError);
        }
        return detectedLang;
    }
};

// 同步初始化 i18n，避免异步导致的渲染问题
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // 临时默认语言，会被异步更新
        fallbackLng: {
            'zh-CN': ['en'],
            ja: ['en'],
            ko: ['en'],
            default: ['en']
        },
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['navigator'],
            caches: []
        }
    });

// 异步加载保存的语言设置
const loadStoredLanguage = async () => {
    const selectedLanguage = await initializeLanguage(); // 初始化语言设置

    if (selectedLanguage !== i18n.language) {
        try {
            await i18n.changeLanguage(selectedLanguage);
        } catch (error) {
            console.error('切换语言失败:', error);
        }
    }
};

// 在i18n初始化完成后加载保存的语言设置
loadStoredLanguage();

export default i18n; 