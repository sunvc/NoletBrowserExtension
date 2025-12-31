import { useState, useEffect } from 'react';
import { ThemeMode, ThemeColor } from '../types';
import { getAppSettings, updateAppSetting } from '../utils/settings';

declare const browser: any;
declare const chrome: any;

export function useTheme() {
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');
    const [themeColor, setThemeColor] = useState<ThemeColor>('green');
    const [systemIsDark, setSystemIsDark] = useState(false);
    const [loading, setLoading] = useState(true);

    // 监听 storage 变化
    useEffect(() => {
        const handleStorageChange = (changes: { [key: string]: any }, areaName: string) => {
            if (areaName === 'local' && changes['nolet_app_settings']) {
                const newValue = changes['nolet_app_settings'].newValue;
                if (newValue) {
                    if (newValue.themeMode) {
                        setThemeMode(newValue.themeMode);
                    }
                    if (newValue.themeColor) {
                        setThemeColor(newValue.themeColor);
                    }
                }
            }
        };

        try {
            if (typeof browser !== 'undefined' && browser.storage) {
                browser.storage.onChanged.addListener(handleStorageChange);
            } else if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.onChanged.addListener(handleStorageChange);
            }
        } catch (e) {
            console.warn('监听 storage 变化失败:', e);
        }

        return () => {
            try {
                if (typeof browser !== 'undefined' && browser.storage) {
                    browser.storage.onChanged.removeListener(handleStorageChange);
                } else if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.onChanged.removeListener(handleStorageChange);
                }
            } catch (e) {
                // 忽略移除监听器时的错误
            }
        };
    }, []);

    // 检测系统主题
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setSystemIsDark(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setSystemIsDark(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // 加载保存的主题设置
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const settings = await getAppSettings();
                setThemeMode(settings.themeMode || 'system');
                setThemeColor(settings.themeColor || 'green');
            } catch (error) {
                console.error('加载主题设置失败:', error);
                setThemeMode('system');
                setThemeColor('green');
            } finally {
                setLoading(false);
            }
        };
        loadTheme();
    }, []);

    // 更新主题模式
    const updateThemeMode = async (newMode: ThemeMode) => {
        try {
            await updateAppSetting('themeMode', newMode);
            setThemeMode(newMode);
        } catch (error) {
            console.error('更新主题设置失败:', error);
        }
    };

    // 更新主题颜色
    const updateThemeColor = async (newColor: ThemeColor) => {
        try {
            await updateAppSetting('themeColor', newColor);
            setThemeColor(newColor);
        } catch (error) {
            console.error('更新主题颜色失败:', error);
        }
    };

    // 计算最终的主题模式
    const effectiveTheme = themeMode === 'system'
        ? (systemIsDark ? 'dark' : 'light')
        : themeMode;

    return {
        themeMode,
        themeColor,
        effectiveTheme,
        systemIsDark,
        loading,
        updateThemeMode,
        updateThemeColor
    };
}
