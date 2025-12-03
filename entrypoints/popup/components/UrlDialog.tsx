import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    LinearProgress,
} from '@mui/material';
import { SlideUpTransition } from './DialogTransitions';
import LinkIcon from '@mui/icons-material/Link';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { useTranslation } from 'react-i18next';
import { Device } from '../types';
import { sendPushMessage } from '../utils/api';
import { generateID } from '../../shared/push-service';


interface UrlDialogProps {
    open: boolean;
    onClose: () => void;
    urlParams: {
        url?: string;
        title?: string;
        selectionText?: string;
        linkUrl?: string;
        linkText?: string;
    };
    selectedDevice: Device | null;
    devices: Device[];
    onDeviceChange: (device: Device | null) => void;
    onDeviceAdd: () => void;
    onSuccess: (message: string, uuid: string) => void;
    onError: (error: string) => void;
}

interface SendOptionProps {
    icon: React.ReactNode;
    primary: string;
    secondary: string;
    onClick: () => void;
    disabled: boolean;
    multiline?: boolean;
}

const SendOption = React.forwardRef<HTMLButtonElement, SendOptionProps>((props, ref) => (
    <Button
        ref={ref}
        onClick={props.onClick}
        disabled={props.disabled}
        variant="outlined"
        fullWidth
        sx={{
            p: 2,
            display: 'flex',
            alignItems: 'flex-start',
            textAlign: 'left',
            gap: 1.5,
            '&:hover': {
                borderColor: 'primary.main'
            }
        }}
    >
        <Box
            sx={{
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                minWidth: 24
            }}
        >
            {props.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
                variant="body1"
                sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
            >
                {props.primary}
            </Typography>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    ...(props.multiline ? {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        height: '40px',
                        lineHeight: '20px',
                    } : {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }),
                    wordBreak: 'break-all'
                }}
            >
                {props.secondary}
            </Typography>
        </Box>
    </Button>
));

export default function UrlDialog({
    open,
    onClose,
    urlParams,
    selectedDevice,
    devices,
    onDeviceChange,
    onDeviceAdd,
    onSuccess,
    onError
}: UrlDialogProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = React.useState(false);
    const [faviconUrl, setFaviconUrl] = React.useState<string | null>(null);
    const firstOptionRef = React.useRef<HTMLButtonElement>(null);

    // 当对话框打开时，聚焦到第一个可用的选项
    React.useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                if (firstOptionRef.current) {
                    firstOptionRef.current.focus();
                }
            }, 450); // 等待 Slide 动画完成
            return () => clearTimeout(timer);
        }
    }, [open]);

    // 预加载favicon
    React.useEffect(() => {
        if (open && urlParams.url) {
            const runtime = (window as any).chrome?.runtime || (window as any).browser?.runtime;
            if (runtime) {
                runtime.sendMessage({
                    action: 'prefetchFavicon',
                    url: urlParams.url
                }).then((response: any) => {
                    if (response?.success && response?.faviconUrl) {
                        setFaviconUrl(response.faviconUrl);
                    }
                }).catch((error: any) => {
                    console.debug('预加载favicon失败:', error);
                });
            }
        } else if (!open) {
            // 重置favicon状态
            setFaviconUrl(null);
        }
    }, [open, urlParams.url]);

    // 获取第一个可用选项的 ref
    const getFirstOptionRef = (index: number) => {
        if (index === 0) {
            return firstOptionRef;
        }
        return undefined;
    };

    // 发送页面 URL
    const handleSendPageUrl = async () => {
        if (!selectedDevice || !urlParams.url) return;

        setLoading(true);
        try {
            const pushUuid = generateID();
            const response = await sendPushMessage(
                selectedDevice,
                urlParams.url,
                false,
                undefined,
                pushUuid,
                urlParams.title || 'Web',
                undefined,
                undefined,
                undefined,
                faviconUrl || undefined
            );

            if (response.code === 200) {
                onClose();
                onSuccess(urlParams.url, pushUuid);
            } else {
                onError(t('push.errors.send_failed', { message: response.message }));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('common.error_unknown');
            const finalMessage = errorMessage.startsWith('utils.api.') ? t(errorMessage) : errorMessage;
            onError(t('push.errors.send_failed', { message: finalMessage }));
        } finally {
            setLoading(false);
        }
    };

    // 发送选中文本
    const handleSendSelectedText = async () => {
        if (!selectedDevice || !urlParams.selectionText) return;

        setLoading(true);
        try {
            const pushUuid = generateID();
            const response = await sendPushMessage(
                selectedDevice,
                urlParams.selectionText || urlParams.title || 'Text',
                false,
                undefined,
                pushUuid,
                urlParams.title || 'Text',
                undefined,
                undefined,
                undefined,
                faviconUrl || undefined
            );

            if (response.code === 200) {
                onClose();
                onSuccess(urlParams.selectionText, pushUuid);
            } else {
                onError(t('push.errors.send_failed', { message: response.message }));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('common.error_unknown');
            const finalMessage = errorMessage.startsWith('utils.api.') ? t(errorMessage) : errorMessage;
            onError(t('push.errors.send_failed', { message: finalMessage }));
        } finally {
            setLoading(false);
        }
    };

    // 发送链接
    const handleSendLink = async () => {
        if (!selectedDevice || !urlParams.linkUrl) return;

        setLoading(true);
        try {
            const pushUuid = generateID();
            const response = await sendPushMessage(
                selectedDevice,
                urlParams.linkUrl,
                false,
                undefined,
                pushUuid,
                urlParams.title || 'Link',
                undefined,
                undefined,
                undefined,
                faviconUrl || undefined
            );

            if (response.code === 200) {
                onClose();
                onSuccess(urlParams.linkUrl, pushUuid);
            } else {
                onError(t('push.errors.send_failed', { message: response.message }));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('common.error_unknown');
            const finalMessage = errorMessage.startsWith('utils.api.') ? t(errorMessage) : errorMessage;
            onError(t('push.errors.send_failed', { message: finalMessage }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            slots={{
                transition: SlideUpTransition,
            }}
            keepMounted
        >
            <DialogTitle>
                {t('push.url_dialog.title')} {/* 选择要发送的内容 */}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>

                    <Stack
                        spacing={1}
                        sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            p: 0
                        }}
                    >
                        {[
                            urlParams.linkUrl && {
                                icon: <LinkIcon />,
                                primary: t('push.url_dialog.send_link'),
                                secondary: urlParams.linkText || urlParams.linkUrl,
                                onClick: handleSendLink
                            },
                            urlParams.url && {
                                icon: <LinkIcon />,
                                primary: t('push.url_dialog.send_current_page'),
                                secondary: urlParams.title || urlParams.url,
                                onClick: handleSendPageUrl
                            },
                            urlParams.selectionText?.trim() && {
                                icon: <TextFieldsIcon />,
                                primary: t('push.url_dialog.send_selected_text'),
                                secondary: urlParams.selectionText,
                                onClick: handleSendSelectedText,
                                multiline: true
                            }
                        ].filter(Boolean).map((option, index) => option && (
                            <SendOption
                                key={option.primary}
                                ref={getFirstOptionRef(index)}
                                icon={option.icon}
                                primary={option.primary}
                                secondary={option.secondary}
                                onClick={option.onClick}
                                disabled={loading || !selectedDevice}
                                multiline={option.multiline}
                            />
                        ))}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ mx: 2 }}>
                        {t('push.url_dialog.info')}
                    </Typography>
                    {loading && (
                        <Box display="flex" justifyContent="center">
                            <LinearProgress sx={{ width: '100%' }} />
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    onClose();
                    window.close();
                }}>
                    {t('common.cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 