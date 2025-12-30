import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    LinearProgress,
    Stack,
    Paper,
    CircularProgress,
    TextField
} from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { useTranslation } from 'react-i18next';
import { Device, PushResponse } from '../types';
import { readClipboard } from '../utils/clipboard';
import { useAppContext } from '../contexts/AppContext';
import { sendPush } from '../../shared/push-service';
import { DEFAULT_ADVANCED_PARAMS } from '../utils/settings';
import gsap from 'gsap';

interface SpeedModeProps {
    defaultDevice: Device | null;
    onExitSpeedMode: () => void;
}

const PROGRESS_INTERVAL = 50; // 更新间隔

export default function SpeedMode({ defaultDevice, onExitSpeedMode }: SpeedModeProps) {
    const { t } = useTranslation();
    const { appSettings } = useAppContext();

    const [clipboardContent, setClipboardContent] = useState('');
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<PushResponse | null>(null);
    const [cancelled, setCancelled] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [clipboardLoading, setClipboardLoading] = useState(false);

    const cancelButtonRef = useRef<HTMLButtonElement>(null); // 用于自动聚焦到取消
    const speedModeRef = useRef<HTMLDivElement>(null);

    // 检查自定义参数差异，只返回与默认配置不同的参数
    const getCustomParametersDifference = useCallback((settings: any): Record<string, any> => {
        const customParams: Record<string, any> = {};

        if (!settings.enableAdvancedParams) {
            return customParams;
        }

        try {
            const userParams = settings.advancedParamsJson ?
                JSON.parse(settings.advancedParamsJson) : {};

            Object.keys(DEFAULT_ADVANCED_PARAMS).forEach(key => {
                const defaultValue = DEFAULT_ADVANCED_PARAMS[key as keyof typeof DEFAULT_ADVANCED_PARAMS];
                const userValue = userParams[key];

                if (userValue !== undefined && userValue !== defaultValue && userValue !== '') {
                    customParams[key] = userValue;
                }
            });
            return customParams;
        } catch (error) {
            console.error('解析自定义参数失败:', error);
            return customParams;
        }
    }, []);

    // 过滤与解析内容冲突的自定义参数
    const filterConflictingParams = useCallback((
        customParams: Record<string, any>,
        parsedContent: {
            title?: string;
            url?: string;
            copyContent?: string;
            autoCopy?: string;
            level?: string;
            contentType?: string;
        }
    ): Record<string, any> => {
        const filtered = { ...customParams };

        const conflictRules = [
            { condition: () => !!parsedContent.title, removeKeys: ['title'] },
            { condition: () => !!parsedContent.url, removeKeys: ['url'] },
            { condition: () => !!parsedContent.copyContent, removeKeys: ['copy'] },
            { condition: () => !!parsedContent.autoCopy, removeKeys: ['autoCopy'] },
            { condition: () => !!parsedContent.level, removeKeys: ['level'] },
            { condition: () => parsedContent.contentType === 'image', removeKeys: ['image'] }
        ];

        conflictRules.forEach(rule => {
            if (rule.condition()) {
                rule.removeKeys.forEach(key => delete filtered[key]);
            }
        });

        return filtered;
    }, []);

    useEffect(() => { // 读取剪贴板内容
        let isMounted = true;

        const fetchClipboard = async () => {
            try {
                setLoading(true);
                const content = await readClipboard();
                if (isMounted) {
                    setClipboardContent(content);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : t('push.errors.clipboard_failed'));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchClipboard();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSend = useCallback(async () => {
        if (!defaultDevice || !clipboardContent || sending) return;

        try {
            setSending(true);

            // 获取自定义参数差异，并过滤掉与解析内容冲突的参数
            const customParams = getCustomParametersDifference(appSettings);
            // console.debug('自定义参数差异:', customParams);
            const filteredCustomParams = filterConflictingParams(customParams, {});

            // 确定最终使用的图标
            let finalIcon: string | undefined;
            if (appSettings?.enableCustomAvatar && appSettings.noletAvatarUrl) {
                finalIcon = appSettings.noletAvatarUrl;
            }

            const response = await sendPush(
                {
                    apiURL: defaultDevice.apiURL,
                    message: clipboardContent,
                    authorization: defaultDevice.authorization,
                    devices: [defaultDevice],
                    sound: appSettings?.sound,
                    ...(finalIcon && { icon: finalIcon }),
                    ...filteredCustomParams // 过滤后的自定义参数差异
                },
                appSettings?.enableEncryption ? appSettings.encryptionConfig : undefined,
            );

            setSendResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('common.error_network'));
        } finally {
            setSending(false);
            // 延迟关闭窗口
            setTimeout(() => window.close(), 1000);
        }
    }, [defaultDevice, clipboardContent, sending, appSettings, getCustomParametersDifference, filterConflictingParams]);

    // 进度条倒计时
    useEffect(() => {
        if (loading || error || !defaultDevice || cancelled || isEditing || sending) return;

        const countdownTime = appSettings?.speedModeCountdown || 3000;
        let elapsed = 0;
        const timer = setInterval(() => {
            elapsed += PROGRESS_INTERVAL;
            const newProgress = (elapsed / countdownTime) * 100;

            if (newProgress >= 100) {
                clearInterval(timer);
                handleSend();
            } else {
                setProgress(newProgress);
            }
        }, PROGRESS_INTERVAL);

        return () => clearInterval(timer);
    }, [loading, error, defaultDevice, cancelled, isEditing, sending, handleSend, appSettings?.speedModeCountdown]);

    // 取消发送
    const handleCancel = useCallback(() => {
        setCancelled(true);
        setProgress(0);
    }, []);

    // 手动发送
    const handleManualSend = useCallback(() => {
        handleSend();
    }, [handleSend]);

    // 输入框点击时取消发送
    const handleInputInteraction = useCallback(() => {
        if (!cancelled && !isEditing) {
            setCancelled(true);
            setProgress(0);
            setIsEditing(true);
        }
    }, [cancelled, isEditing]);

    // 内容发生变化
    const handleContentChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setClipboardContent(event.target.value);
    }, []);

    // 退出极速模式
    const handleExitSpeedMode = useCallback(async () => {
        await onExitSpeedMode();
    }, [onExitSpeedMode]);

    // 重新读取剪贴板
    const handleRetryClipboard = useCallback(async () => {
        setClipboardLoading(true);
        try {
            const content = await readClipboard();
            setClipboardContent(content);
            setError(null);
            setIsEditing(true); // 设置为编辑状态，避免自动发送
            setCancelled(true); // 取消自动发送
        } catch (err) {
            // 如果再次失败，保持当前状态，让用户手动输入
            console.debug('重新读取剪贴板失败:', err);
        } finally {
            setClipboardLoading(false);
        }
    }, []);

    // 计算显示的倒计时时间
    const remainingTime = useMemo(() => {
        const countdownTime = appSettings?.speedModeCountdown || 3000;
        return Math.round((countdownTime - (progress * countdownTime / 100)) / 1000);
    }, [progress, appSettings?.speedModeCountdown]);

    // 自动聚焦到取消按钮
    useEffect(() => {
        if (!loading && !error && !sending && !cancelled && cancelButtonRef.current) {
            // 使用 setTimeout 确保按钮已经渲染
            const timer = setTimeout(() => {
                cancelButtonRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading, error, sending, cancelled]);

    useEffect(() => {
        if (speedModeRef.current) {
            gsap.set(speedModeRef.current, { minHeight: "600px" });

            requestAnimationFrame(() => {
                gsap.to(speedModeRef.current, {
                    minHeight: "370px",
                    duration: 0.6,
                    ease: "power4.inOut",
                    overwrite: "auto",
                });
            });
        }
    }, []);

    return (
        <Box
            ref={speedModeRef}
            sx={{
                height: '100%',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
                p: 2,
            }}
        >
            <Paper
                elevation={2}
                sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    flex: 1,
                    boxShadow: 'none',
                    border: 'none'
                }}
            >
                <Typography variant="h6" align="center">
                    {t('speed_mode_page.title')}
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Stack spacing={3} sx={{ flex: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={clipboardLoading ? <CircularProgress size={20} /> : <ContentPasteIcon />}
                            onClick={handleRetryClipboard}
                            disabled={clipboardLoading}
                            sx={{
                                py: 1.5,
                                borderStyle: 'dashed',
                                color: 'text.secondary',
                                borderColor: 'grey.300',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    color: 'primary.main'
                                }
                            }}
                        >
                            {clipboardLoading ? t('speed_mode_page.clipboard_reading') : t('speed_mode_page.clipboard_failed')}
                        </Button>

                        <TextField
                            multiline
                            rows={4}
                            fullWidth
                            variant="outlined"
                            value={clipboardContent}
                            onChange={handleContentChange}
                            onFocus={handleInputInteraction}
                            placeholder={t('speed_mode_page.manual_input_placeholder')}
                            autoFocus
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    fontSize: '0.875rem',
                                    '& fieldset': {
                                        borderColor: isEditing ? 'primary.main' : 'grey.300',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'primary.main',
                                    },
                                },
                            }}
                        />

                        <Stack direction="row" spacing={2} sx={{ mt: 'auto' }}>
                            <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                onClick={handleManualSend}
                                disabled={sending || !clipboardContent.trim()}
                            >
                                {t('speed_mode_page.send')}
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={handleExitSpeedMode}
                            >
                                {t('speed_mode_page.exit_speed_mode')}
                            </Button>
                        </Stack>
                    </Stack>
                ) : sendResult ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                        <Typography color={sendResult.code === 200 ? 'success.main' : 'error'} align="center">
                            {sendResult.code === 200 ? t('speed_mode_page.send_success') : t('speed_mode_page.send_failed', { message: sendResult.message })}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleExitSpeedMode}
                            sx={{ mt: 'auto' }}
                        >
                            {t('speed_mode_page.exit_speed_mode')}
                        </Button>
                    </Box>
                ) : (
                    <Stack spacing={3} sx={{ flex: 1 }}>
                        <Typography align="center">
                            {t('speed_mode_page.sending_to_device', { device: defaultDevice?.alias || t('speed_mode_page.device_not_set') })}
                        </Typography>

                        <TextField
                            multiline
                            rows={4}
                            fullWidth
                            variant="outlined"
                            value={clipboardContent}
                            onChange={handleContentChange}
                            // onMouseEnter={handleInputInteraction}
                            onFocus={handleInputInteraction}
                            placeholder={t('speed_mode_page.clipboard_empty_placeholder')}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    fontSize: '0.875rem',
                                    '& fieldset': {
                                        borderColor: isEditing ? 'primary.main' : 'grey.300',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'primary.main',
                                    },
                                },
                            }}
                        />

                        <Box sx={{ width: '100%', mt: 2 }}>
                            <LinearProgress variant="determinate" value={progress} />
                            <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
                                {cancelled ? (isEditing ? t('speed_mode_page.can_edit_and_send') : t('speed_mode_page.cancelled')) : sending ? t('speed_mode_page.sending') : t('speed_mode_page.auto_send_countdown', { seconds: remainingTime })}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={2} sx={{ mt: 'auto' }}>
                            {!cancelled ? (
                                <Button
                                    ref={cancelButtonRef}
                                    variant="contained"
                                    color="error"
                                    fullWidth
                                    onClick={handleCancel}
                                    disabled={sending}
                                >
                                    {t('speed_mode_page.cancel')}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="success"
                                    fullWidth
                                    onClick={handleManualSend}
                                    disabled={sending}
                                >
                                    {t('speed_mode_page.send')}
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={handleExitSpeedMode}
                            >
                                {t('speed_mode_page.exit_speed_mode')}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Paper>
        </Box>
    );
}
