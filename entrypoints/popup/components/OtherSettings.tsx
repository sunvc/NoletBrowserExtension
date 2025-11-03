import React, { useState } from 'react';
import {
    Box,
    Typography,
    Stack,
    Paper,
    FormControlLabel,
    Switch,
    Alert,
    IconButton,
    Popover
} from '@mui/material';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import WysiwygIcon from '@mui/icons-material/Wysiwyg';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import InfoIcon from '@mui/icons-material/Info';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import { detectBrowser } from '../utils/platform';
import ThemeSelector from './ThemeSelector';
import LanguageSelector from './LanguageSelector';
import CacheSetting from './CacheSetting';
import DnsQueryCard from './DnsQueryCard';
import { ThemeMode } from '../types';

interface OtherSettingsProps {
    themeMode: ThemeMode;
    onThemeChange: (mode: ThemeMode) => void;
    onError: (error: string) => void;
    onToast: (message: string) => void;
}

export default function OtherSettings({ themeMode, onThemeChange, onError, onToast }: OtherSettingsProps) {
    const { t } = useTranslation();
    const { shortcutKeys, appSettings, updateAppSetting } = useAppContext();
    const [shortcutGuideAnchor, setShortcutGuideAnchor] = useState<HTMLElement | null>(null);

    // 检测浏览器类型
    const browserType = detectBrowser();

    // 复制快捷键设置地址
    const handleCopyShortcutUrl = async () => {
        const url = browserType === 'firefox' ? 'about:addons' : `${browserType === 'chrome' ? 'chrome' : 'edge'}://extensions/shortcuts`;
        try {
            await navigator.clipboard.writeText(url);
        } catch (error) {
            console.error('复制失败:', error);
        }
    };

    // 系统通知开关切换
    const handleSystemNotificationsToggle = async (enabled: boolean) => {
        try {
            await updateAppSetting('enableSystemNotifications', enabled);
            if (!enabled) {
                handleKeepEssentialNotificationsToggle(false);
            }
        } catch (error) {
            onError(t('common.error_update', { message: error instanceof Error ? error.message : '未知错误' }));
        }
    };

    // 保留必要通知开关切换
    const handleKeepEssentialNotificationsToggle = async (enabled: boolean) => {
        try {
            await updateAppSetting('keepEssentialNotifications', enabled);
            if (enabled) {
                onToast(t('settings.system_notifications.enable_success'));
            }
        } catch (error) {
            onError(t('common.error_update', { message: error instanceof Error ? error.message : '未知错误' }));
        }
    };

    return (
        <>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WysiwygIcon />
                        {/* 界面相关 */}
                        {t('settings.other.interface')}
                    </Typography>

                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            {/* 主题设置 */}
                            {t('settings.theme.title')}
                        </Typography>
                        <ThemeSelector themeMode={themeMode} onThemeChange={onThemeChange} />
                    </Box>

                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            {/* 语言设置 */}
                            {t('settings.language.title')}
                        </Typography>
                        <LanguageSelector />
                    </Box>
                </Stack>
            </Paper>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsNoneIcon />
                        {/* 杂项设置 */}
                        {t('settings.system_notifications.title')}
                    </Typography>

                    <Box>
                        <Stack gap={1}>
                            {/* 系统通知开关 */}
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={appSettings?.enableSystemNotifications ?? false}
                                        onChange={(e) => handleSystemNotificationsToggle(e.target.checked)}
                                    />
                                }
                                label={t('settings.system_notifications.enable')}
                                sx={{ userSelect: 'none' }}
                            />
                            {/* 保留必要通知开关 */}
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={appSettings?.keepEssentialNotifications ?? false}
                                        onChange={(e) => handleKeepEssentialNotificationsToggle(e.target.checked)}
                                    />
                                }
                                label={t('settings.system_notifications.keep_essential')}
                                sx={{
                                    userSelect: 'none',
                                    pointerEvents: (appSettings?.enableSystemNotifications ?? false) ? 'auto' : 'none',
                                    opacity: (appSettings?.enableSystemNotifications ?? false) ? 1 : 0.5
                                }}
                            />
                        </Stack>
                    </Box>
                </Stack>
            </Paper>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReadMoreIcon />
                        {/* 杂项设置 */}
                        {t('settings.other.misc')}
                    </Typography>

                    {/* 启用文件缓存 */}
                    {appSettings?.enableInspectSend &&
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                {/* 文件缓存设置 */}
                                {t('settings.cache.title')}
                            </Typography>
                            <CacheSetting />
                        </Box>
                    }
                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle1" gutterBottom>
                                {/* 快捷键 */}
                                {t('settings.shortcuts.title')}
                            </Typography>
                            <IconButton
                                onClick={(event) => setShortcutGuideAnchor(event.currentTarget)}
                                size="small"
                                sx={{
                                    mb: 1
                                }}
                                color='inherit'
                            >
                                <KeyboardIcon />
                            </IconButton>
                        </Stack>
                        <Popover
                            open={Boolean(shortcutGuideAnchor)}
                            anchorEl={shortcutGuideAnchor}
                            onClose={() => setShortcutGuideAnchor(null)}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                        >
                            <Box sx={{ p: 2, maxWidth: 320 }}>
                                <Typography variant="body2" gutterBottom>
                                    {t('settings.shortcuts.guide')}
                                </Typography>

                                {browserType === 'firefox' && (
                                    <Typography variant="body2" gutterBottom>
                                        {t('settings.shortcuts.guide_firefox')}
                                    </Typography>
                                )}

                                <Box sx={{
                                    mt: 2,
                                    p: 1,
                                    backgroundColor: 'text.secondary',
                                    color: 'background.paper',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1
                                }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            wordBreak: 'break-all'
                                        }}
                                    >
                                        {browserType === 'firefox' ? 'about:addons' : `${browserType === 'chrome' ? 'chrome' : 'edge'}://extensions/shortcuts`}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={handleCopyShortcutUrl}
                                        sx={{ flexShrink: 0 }}
                                        color='inherit'
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Popover>
                        <Alert
                            icon={<InfoIcon />}
                            severity="info"
                            sx={{
                                '& .MuiAlert-message': {
                                    width: '100%'
                                }
                            }}
                        >
                            <Typography variant="body2" component="div" gutterBottom>
                                {/* 打开推送窗口: {{key}} */}
                                {t('settings.shortcuts.open_window', { key: shortcutKeys.openExtension })}
                            </Typography>
                        </Alert>
                    </Box>
                </Stack>
            </Paper>

            {/* DNS查询 */}
            <DnsQueryCard onToast={onToast} onError={onError} />
        </>
    );
}
