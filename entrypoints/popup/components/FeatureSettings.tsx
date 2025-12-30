import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Paper,
    FormControlLabel,
    Switch,
    Divider,
    Chip
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import AvatarSetting from './AvatarSetting';
import FaviconSetting from './FaviconSetting';
import SpeedModeSetting from './SpeedModeSetting';
import { DEFAULT_ADVANCED_PARAMS } from '../utils/settings';

interface FeatureSettingsProps {
    devices: any[];
    onError: (error: string) => void;
    onToast: (message: string) => void;
}

export default function FeatureSettings({ devices, onError, onToast }: FeatureSettingsProps) {
    const { t } = useTranslation();
    const { appSettings, updateAppSetting } = useAppContext();

    const handleContextMenuToggle = async (enabled: boolean) => {
        try {
            await updateAppSetting('enableContextMenu', enabled);
        } catch (error) {
            onError(t('common.error_update', { message: error instanceof Error ? error.message : '未知错误' }));
        }
    };

    // 处理右键解析网页内容开关切换
    const handleInspectSendToggle = async (enabled: boolean) => {
        try {
            await updateAppSetting('enableInspectSend', enabled);
        } catch (error) {
            onError(t('common.error_update', { message: error instanceof Error ? error.message : '未知错误' }));
        }
    };

    // 处理完整参数配置开关切换
    const handleAdvancedParamsToggle = async (enabled: boolean) => {
        try {
            await updateAppSetting('enableAdvancedParams', enabled);

            if (enabled) {
                onToast(t('settings.advanced_params.success_message'));
            } else {
                // 关闭时，重置参数配置为默认值
                const defaultParamsJson = JSON.stringify(DEFAULT_ADVANCED_PARAMS, null, 2);
                await updateAppSetting('advancedParamsJson', defaultParamsJson);
                onToast(t('settings.advanced_params.reset_message'));
            }
        } catch (error) {
            onError(t('common.error_update', { message: error instanceof Error ? error.message : '未知错误' }));
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Stack spacing={3}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TuneIcon fontSize="small" />
                    {/* 功能设置 */}
                    {t('settings.features.title')}
                </Typography>
                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        {/* 右键菜单 */}
                        {t('settings.context_menu.title')}
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                disabled={devices.length === 0}
                                checked={appSettings?.enableContextMenu || false}
                                onChange={(e) => handleContextMenuToggle(e.target.checked)}
                                color='primary'
                            />
                        }
                        label={t('settings.context_menu.enable')}
                        sx={{ userSelect: 'none' }}
                    />
                    {appSettings?.enableContextMenu && (
                        <FormControlLabel
                            control={
                                <Switch
                                    disabled={devices.length === 0}
                                    checked={appSettings?.enableInspectSend || false}
                                    onChange={(e) => handleInspectSendToggle(e.target.checked)}
                                    color='warning'
                                />
                            }
                            label={t('settings.context_menu.enable_inspect_send')}
                            sx={{ userSelect: 'none' }}
                        />
                    )}
                </Box>
                <Divider />
                <Box>
                    <Stack direction="row" flexWrap="wrap" gap={1}>

                        {/* 自定义头像 */}
                        <AvatarSetting simpleLabel={t('settings.avatar.simple_title')} />

                        {/* 网站图标设置 */}
                        {appSettings?.enableInspectSend &&
                            <FaviconSetting simpleLabel={t('settings.favicon.simple_title')} />}

                        {/* 启用极速模式 */}
                        <SpeedModeSetting disabled={devices.length === 0} simpleLabel={t('settings.speed_mode.simple_title')} />

                        {/* 启用完整的参数配置 */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={appSettings?.enableAdvancedParams || false}
                                    onChange={(e) => handleAdvancedParamsToggle(e.target.checked)}
                                />
                            }
                            // label="启用完整的参数配置"
                            label={t('settings.advanced_params.simple_title')}
                            sx={{ userSelect: 'none' }}
                        />

                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
}
