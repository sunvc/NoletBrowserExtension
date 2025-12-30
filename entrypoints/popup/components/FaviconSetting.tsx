import React, { useState, useEffect, } from 'react';
import {
    Button,
    Stack,
    TextField,
    Typography,
    Snackbar,
    CircularProgress,
    FormControlLabel,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    IconButton,
    Tooltip,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import { SlideUpTransition } from './DialogTransitions';

export default function FaviconSetting({ simpleLabel }: { simpleLabel?: string }) {
    const { t } = useTranslation();
    const { appSettings, updateAppSetting } = useAppContext();
    const [enableFaviconIcon, setEnableFaviconIcon] = useState<boolean>(false);
    const [faviconApiPrefix, setFaviconApiPrefix] = useState<string>('https://favicon.wzs.app/');
    const [faviconApiSuffix, setFaviconApiSuffix] = useState<string>('');
    const [faviconApiUrl, setFaviconApiUrl] = useState<string>('https://favicon.wzs.app/$domain$');
    const [error, setError] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const theme = useTheme();

    useEffect(() => {
        setEnableFaviconIcon(appSettings?.enableFaviconIcon || false);

        // 解析 favicon API URL
        const apiUrl = appSettings?.faviconApiUrl || 'https://favicon.wzs.app/$domain$';
        setFaviconApiUrl(apiUrl);

        // 分割前缀和后缀
        const domainPlaceholder = '$domain$';
        const placeholderIndex = apiUrl.indexOf(domainPlaceholder);
        if (placeholderIndex !== -1) {
            setFaviconApiPrefix(apiUrl.substring(0, placeholderIndex));
            setFaviconApiSuffix(apiUrl.substring(placeholderIndex + domainPlaceholder.length));
        } else {
            setFaviconApiPrefix(apiUrl);
            setFaviconApiSuffix('');
        }
    }, [appSettings]);

    // 处理 favicon 相关输入
    const handleFaviconApiPrefixChange = (value: string) => {
        setFaviconApiPrefix(value);
        updateFaviconApiUrl(value, faviconApiSuffix);
    };

    const handleFaviconApiSuffixChange = (value: string) => {
        setFaviconApiSuffix(value);
        updateFaviconApiUrl(faviconApiPrefix, value);
    };

    const updateFaviconApiUrl = (prefix: string, suffix: string) => {
        const newUrl = `${prefix}$domain$${suffix}`;
        setFaviconApiUrl(newUrl);
    };

    const handleEnableChange = (enabled: boolean) => {
        setEnableFaviconIcon(enabled);
        if (enabled) {
            setDialogOpen(true);
        } else {
            // 关闭 favicon 功能时，直接保存
            updateAppSetting('enableFaviconIcon', false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // 保存设置
            await updateAppSetting('enableFaviconIcon', true);
            await updateAppSetting('faviconApiUrl', faviconApiUrl);

            setSaving(false);
            setDialogOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'settings.favicon.save_failed';
            setError(t(errorMessage));
            setSaving(false);
        }
    };

    const handleCloseDialog = () => {
        if (!appSettings?.enableFaviconIcon) {
            // 如果之前没有启用 favicon，取消时关闭开关
            setEnableFaviconIcon(false);
        }
        setDialogOpen(false);
    };

    return (
        <>
            <FormControlLabel
                control={
                    <Switch
                        color='warning'
                        checked={enableFaviconIcon}
                        onChange={(e) => handleEnableChange(e.target.checked)}
                    />
                }
                label={simpleLabel || t('settings.favicon.enable')}
                sx={{ userSelect: 'none' }}
            />

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                slots={{
                    transition: SlideUpTransition,
                }}
                keepMounted
            >
                <DialogTitle>
                    {t('settings.favicon.dialog_title')}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack gap={1}>
                        <Typography variant="caption" color="text.secondary">
                            {t('settings.favicon.enable_help')}
                        </Typography>
                        <Stack gap={0.3} direction='column' sx={{ py: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                {t('settings.favicon.custom_api')}
                            </Typography>
                            <Stack alignItems="flex-end" gap={0} direction='row'>
                                <TextField
                                    placeholder={t('settings.favicon.api_url_prefix')}
                                    value={faviconApiPrefix}
                                    onChange={(e) => handleFaviconApiPrefixChange(e.target.value)}
                                    size="small"
                                    variant="standard"
                                    slotProps={{
                                        input: {
                                            sx: {
                                                fontSize: '0.75rem',
                                            },
                                            endAdornment: (
                                                <PublicIcon color="action" sx={{ fontSize: '1rem' }} />
                                            ),
                                        },
                                    }}
                                    style={{ width: '-webkit-fill-available' }}
                                />
                                <TextField
                                    placeholder={t('settings.favicon.api_url_suffix')}
                                    value={faviconApiSuffix}
                                    onChange={(e) => handleFaviconApiSuffixChange(e.target.value)}
                                    size="small"
                                    variant="standard"
                                    sx={{ width: '40%' }}
                                    slotProps={{
                                        input: {
                                            sx: {
                                                fontSize: '0.75rem',
                                            },
                                        },
                                    }}
                                />
                            </Stack>
                            {/* icon 参数预览 */}
                            {faviconApiPrefix && (
                                <Stack sx={{ py: 1.5 }}>
                                    <Typography variant="caption" color="text.secondary">{t('settings.favicon.icon_param')}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{
                                        fontFamily: 'monospace',
                                        backgroundColor: 'action.hover',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 0.5,
                                        fontSize: '0.75rem',
                                        wordBreak: 'break-all'
                                    }}>
                                        {faviconApiUrl.replace('$domain$', `${t('settings.favicon.api_url_domain')}`)}
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>
                    </Stack>

                </DialogContent>
                <DialogActions>
                    <Tooltip title={<Stack gap={.5}>
                        <Typography variant="caption" color="text.secondary" style={{ fontSize: '0.6875rem' }}>
                            {t('settings.favicon.api_url_help')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" style={{ fontSize: '0.6875rem' }}>
                            {t('settings.favicon.api_url_help_2')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" style={{ fontSize: '0.6875rem' }}>
                            {t('settings.favicon.api_url_help_3')}
                        </Typography></Stack>}>
                        <IconButton size="small" sx={{ mr: 'auto', ml: 1 }}>
                            <InfoOutlineIcon />
                        </IconButton>
                    </Tooltip>
                    <Button onClick={handleCloseDialog}>
                        {t('common.close')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || !faviconApiUrl}
                    >
                        {saving ? <CircularProgress size={24} /> : t('settings.favicon.enable_btn')}
                    </Button>
                </DialogActions>
            </Dialog >

            <Snackbar
                open={!!error}
                autoHideDuration={3000}
                onClose={() => setError('')}
                message={error}
            />
        </>
    );
}
