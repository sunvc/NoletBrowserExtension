import { useState, useEffect } from 'react';
import { ThemeMode } from '../types';
import { getAppSettings, updateAppSetting } from '../utils/settings';

export function useTheme() {
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');
    const [systemIsDark, setSystemIsDark] = useState(false);
    const [loading, setLoading] = useState(true);

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
            } catch (error) {
                console.error('加载主题设置失败:', error);
                setThemeMode('system');
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

    // 计算最终的主题模式
    const effectiveTheme = themeMode === 'system'
        ? (systemIsDark ? 'dark' : 'light')
        : themeMode;

    return {
        themeMode,
        effectiveTheme,
        systemIsDark,
        loading,
        updateThemeMode
    };
} 