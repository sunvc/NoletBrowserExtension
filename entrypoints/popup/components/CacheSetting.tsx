import React, { useState } from 'react';
import {
    Stack,
    FormControlLabel,
    Switch,
    Snackbar,
    CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import { fileCacheManager } from '../utils/database';

export default function CacheSetting() {
    const { t } = useTranslation();
    const { appSettings, updateAppSetting } = useAppContext();
    const [toast, setToast] = useState<{ open: boolean, message: string }>({ open: false, message: '' });
    const [isToggling, setIsToggling] = useState(false);

    // 处理文件缓存开关切换
    const handleFileCacheToggle = async (enabled: boolean) => {
        if (isToggling) return; // 防止重复操作

        setIsToggling(true);
        try {
            if (enabled) {
                // 开启缓存：先创建数据库和表结构
                console.debug('正在创建文件缓存数据库...');
                await fileCacheManager.init(); // 这会自动创建数据库和表
                console.debug('文件缓存数据库创建成功');

                await updateAppSetting('enableFileCache', true);
                setToast({
                    open: true,
                    message: t('settings.cache.cache_enabled')
                });
            } else {
                // 关闭缓存：直接销毁整个 NoLetSenderFileDB 数据库
                await fileCacheManager.destroy();

                await updateAppSetting('enableFileCache', false);
                setToast({
                    open: true,
                    message: t('settings.cache.cache_disabled')
                });
            }
        } catch (error) {
            console.error('更新文件缓存设置失败:', error);
            setToast({
                open: true,
                message: t('common.error_update', { message: error instanceof Error ? error.message : '未知错误' })
            });
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <>
            <Stack direction="row" alignItems="center">
                <FormControlLabel
                    control={
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Switch
                                checked={appSettings?.enableFileCache || false}
                                onChange={(e) => handleFileCacheToggle(e.target.checked)}
                                disabled={isToggling}
                                color='warning'
                            />

                        </Stack>
                    }
                    label={t('settings.cache.enable')}
                    sx={{ userSelect: 'none' }}
                />
                {isToggling && <CircularProgress size={16} />}
            </Stack>

            {/* Toast提示 */}
            <Snackbar
                open={toast.open}
                autoHideDuration={3000}
                onClose={() => setToast({ ...toast, open: false })}
                message={toast.message}
            />
        </>
    );
}
