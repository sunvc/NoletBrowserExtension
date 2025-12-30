import React, { useState, useEffect, useRef } from 'react';
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
    Skeleton,
    useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import gsap from 'gsap';
import { SlideUpTransition } from './DialogTransitions';

export default function AvatarSetting({ simpleLabel }: { simpleLabel?: string }) {
    const { t } = useTranslation();
    const { appSettings, updateAppSetting } = useAppContext();
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [enableCustomAvatar, setEnableCustomAvatar] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [testing, setTesting] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [isUrlValid, setIsUrlValid] = useState<boolean>(false);
    const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
    const avatarRef = useRef<HTMLImageElement>(null);
    const focusTimelineRef = useRef<gsap.core.Timeline | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const theme = useTheme();

    useEffect(() => {
        setAvatarUrl(appSettings?.noletAvatarUrl || 'https://s3.wzs.app/logo.png');
        setEnableCustomAvatar(appSettings?.enableCustomAvatar || false);
    }, [appSettings]);

    // 验证图片URL
    const validateImageUrl = async (url: string): Promise<boolean> => {
        if (!url) return false;

        try {
            setTesting(true);
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    setIsUrlValid(true);
                    resolve(true);
                };
                img.onerror = () => {
                    setIsUrlValid(false);
                    resolve(false);
                };
                img.src = url;
            });
        } catch (error) {
            setIsUrlValid(false);
            return false;
        } finally {
            setTesting(false);
        }
    };

    const handleEnableChange = (enabled: boolean) => {
        setEnableCustomAvatar(enabled);
        if (enabled) {
            setDialogOpen(true);
            validateImageUrl(avatarUrl);
        } else {
            // 关闭自定义头像时，直接保存 - 关闭
            updateAppSetting('enableCustomAvatar', false);
        }
    };

    const handleUrlChange = (url: string) => {
        setAvatarUrl(url);
        setError('');
        setIsImageLoaded(false);
        validateImageUrl(url);
    };

    const handleInputFocus = () => {
        if (avatarRef.current) {
            if (focusTimelineRef.current) {
                focusTimelineRef.current.kill();
            }

            focusTimelineRef.current = gsap.timeline({
                repeat: 0, // 不重复（只执行一次）
                onComplete: () => {
                    // 完成后淡出
                    if (avatarRef.current) {
                        gsap.to(avatarRef.current, {
                            duration: 0.6,
                            boxShadow: "none",
                            ease: "power2.out"
                        });
                    }
                }
            });

            focusTimelineRef.current
                // 扩张（亮起）
                .to(avatarRef.current, {
                    duration: 0.8,
                    boxShadow: `0 0 0 8px ${theme.palette.primary.light}70`,
                    ease: "sine.out"
                })
                // 收缩（变暗）
                .to(avatarRef.current, {
                    duration: 1,
                    boxShadow: `0 0 0 4px ${theme.palette.primary.light}40`,
                    ease: "sine.in"
                });
        }
    };

    const handleInputBlur = () => {
        if (avatarRef.current && focusTimelineRef.current) {
            focusTimelineRef.current.kill();

            gsap.to(avatarRef.current, {
                duration: 0.5,
                boxShadow: "none",
                ease: "power2.out"
            });
        }
    };

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    const handlePreviewClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleSave = async () => {
        if (!avatarUrl) {
            setError(t('settings.avatar.url_empty'));
            return;
        }

        try {
            setSaving(true);
            const isValid = await validateImageUrl(avatarUrl);

            if (!isValid) {
                setError(t('settings.avatar.url_invalid'));
                setSaving(false);
                return;
            }

            // 保存设置
            await updateAppSetting('enableCustomAvatar', true);
            await updateAppSetting('noletAvatarUrl', avatarUrl);

            setSaving(false);
            setDialogOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'settings.avatar.save_failed';
            setError(t(errorMessage));
            setSaving(false);
        }
    };

    const handleCloseDialog = () => {
        if (!appSettings?.enableCustomAvatar) {
            // 如果之前没有启用自定义头像，取消时关闭开关
            setEnableCustomAvatar(false);
        }
        setDialogOpen(false);
    };

    return (
        <>
            <FormControlLabel
                control={
                    <Switch
                        checked={enableCustomAvatar}
                        onChange={(e) => handleEnableChange(e.target.checked)}
                    />
                }
                label={simpleLabel || t('settings.avatar.enable')}
                sx={{ userSelect: 'none' }}
            />

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                slots={{
                    transition: SlideUpTransition,
                }}
                keepMounted
            >
                <DialogTitle>
                    {t('settings.avatar.dialog_title')}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                            {t('settings.avatar.url_help')}
                        </Typography>

                        <TextField
                            label={t('settings.avatar.url')}
                            value={avatarUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            fullWidth
                            size='small'
                            variant="outlined"
                            placeholder="https://s3.wzs.app/logo.png"
                            error={!!error}
                            helperText={error}
                            disabled={testing || saving}
                            inputRef={inputRef}
                        />
                        {/* iOS 推送预览图 */}
                        <><Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
                            {t('settings.avatar.preview')}
                        </Typography>
                            <Stack direction="row" justifyContent="center" sx={{ m: 0, pb: 2 }}>
                                {testing ? (
                                    <Skeleton
                                        variant="circular"
                                        width={80}
                                        height={80}
                                        animation="wave"
                                    />
                                ) : (
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                        onClick={handlePreviewClick}
                                        sx={{
                                            flex: 1, border: '1px solid', borderColor: 'divider',
                                            boxShadow: '0 0 6px 0 rgba(0, 0, 0, 0.01)',
                                            borderRadius: '1.25rem', py: 1, px: 0.5,
                                            userSelect: 'none',
                                            cursor: 'cell',
                                            '&:hover': {
                                                boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.05)',
                                            }
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" justifyContent="flex-start">
                                            <Stack sx={{ position: 'relative', pointerEvents: 'none' }}>
                                                <Stack sx={{ p: 1, display: avatarUrl ? 'block' : 'none' }}>
                                                    {!isImageLoaded ? (
                                                        <Skeleton
                                                            variant="circular"
                                                            width={42}
                                                            height={42}
                                                            animation="wave"
                                                        />
                                                    ) : null}
                                                    <img
                                                        ref={avatarRef}
                                                        src={avatarUrl}
                                                        alt={t('settings.avatar.preview')}
                                                        style={{
                                                            width: '2.625rem',
                                                            height: '2.625rem',
                                                            objectFit: 'contain',
                                                            borderRadius: '50%',
                                                            display: isImageLoaded ? 'block' : 'none',
                                                        }}
                                                        onError={() => {
                                                            setError(t('settings.avatar.url_invalid'));
                                                            setIsUrlValid(false);
                                                            setIsImageLoaded(false);
                                                        }}
                                                        onLoad={handleImageLoad}
                                                    />
                                                </Stack>
                                                {avatarUrl.length === 0 ? (
                                                    <Stack sx={{ p: 1 }}>
                                                        <img src="https://wiki.wzs.app/_media/logo.png" alt="Icon" style={{
                                                            width: '2.625rem',
                                                            height: '2.625rem',
                                                            objectFit: 'contain',
                                                            borderRadius: '0.594rem',
                                                        }} />
                                                    </Stack>
                                                ) :
                                                    (
                                                        <img src="https://wiki.wzs.app/_media/logo.png" alt="Icon" style={{
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                            objectFit: 'contain',
                                                            position: 'absolute',
                                                            right: '0.125rem',
                                                            bottom: '0.125rem',
                                                        }} />)}
                                            </Stack>
                                            <Stack direction="column" alignItems="flex-start" justifyContent="center" sx={{ p: 1 }} >
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {t('settings.avatar.preview')}
                                                </Typography>
                                                <Typography variant="body2" fontWeight={400}>
                                                    {t('push.message')}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                        <Stack sx={{ p: 1, pt: 0.5 }}>
                                            <Typography variant='subtitle2' color='text.secondary'>Now</Typography>
                                        </Stack>
                                    </Stack>
                                )}
                            </Stack>
                        </>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={testing || saving || !isUrlValid || !avatarUrl}
                    >
                        {saving ? <CircularProgress size={24} /> : t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!error}
                autoHideDuration={3000}
                onClose={() => setError('')}
                message={error}
            />
        </>
    );
} 