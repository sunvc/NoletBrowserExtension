import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { AppContextType, AppContextState, AppSettings, EncryptionConfig } from '../types';
import { detectPlatform, isAppleDevice, getShortcutKeys } from '../utils/platform';
import { getAppSettings, updateAppSetting as updateAppSettingUtil, saveAppSettings } from '../utils/settings';
import { cleanupFaviconBlobs } from '../utils/favicon-manager';

// 创建Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider组件属性接口
interface AppProviderProps {
    children: React.ReactNode;
}

// App Context Provider组件
export function AppProvider({ children }: AppProviderProps) {
    const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // 清理 blob URLs
    const cleanupBlobs = useCallback(() => {
        cleanupFaviconBlobs();
    }, []);

    // 加载应用设置
    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const settings = await getAppSettings();
            setAppSettings(settings);
        } catch (error) {
            console.error('加载应用设置失败:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 更新单个设置项
    const updateAppSetting = useCallback(async <K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ): Promise<void> => {
        try {
            await updateAppSettingUtil(key, value);
            setAppSettings(prev => prev ? { ...prev, [key]: value } : null);
        } catch (error) {
            console.error('更新设置失败:', error);
            throw error;
        }
    }, []);

    // 切换加密开关
    const toggleEncryption = useCallback(async (): Promise<void> => {
        if (!appSettings) return;

        try {
            const newEnabled = !appSettings.enableEncryption;
            await updateAppSetting('enableEncryption', newEnabled);
        } catch (error) {
            console.error('切换加密设置失败:', error);
            throw error;
        }
    }, [appSettings, updateAppSetting]);

    // 更新加密配置
    const updateEncryptionConfig = useCallback(async (config: EncryptionConfig): Promise<void> => {
        try {
            await updateAppSetting('encryptionConfig', config);
        } catch (error) {
            console.error('更新加密配置失败:', error);
            throw error;
        }
    }, [updateAppSetting]);

    // 重新加载设置
    const reloadSettings = useCallback(async (): Promise<void> => {
        await loadSettings();
    }, [loadSettings]);

    // 初始化加载设置
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // 计算应用状态
    const appState: AppContextState = useMemo(() => {
        const platform = detectPlatform();
        const isApple = isAppleDevice(platform);
        const shortcutKeys = getShortcutKeys(platform);

        return {
            platform,
            isAppleDevice: isApple,
            shortcutKeys,
            appSettings,
            loading
        };
    }, [appSettings, loading]);

    // 计算是否显示加密切换按钮
    const shouldShowEncryptionToggle = useMemo(() => {
        return !!(appSettings?.encryptionConfig?.key && appSettings.encryptionConfig.key.trim() !== '');
    }, [appSettings?.encryptionConfig?.key]);

    const contextValue: AppContextType = useMemo(() => ({
        ...appState,
        toggleEncryption,
        updateEncryptionConfig,
        updateAppSetting,
        reloadSettings,
        shouldShowEncryptionToggle,
        cleanupBlobs
    }), [
        appState,
        toggleEncryption,
        updateEncryptionConfig,
        updateAppSetting,
        reloadSettings,
        shouldShowEncryptionToggle,
        cleanupBlobs
    ]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

// 自定义Hook用于使用App Context
export function useAppContext(): AppContextType {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error('useAppContext必须在AppProvider内部使用');
    }

    return context;
} 