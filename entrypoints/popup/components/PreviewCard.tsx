import React, { useState, useEffect } from 'react';
import {
    Box,
    Stack,
    Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getFaviconUrl } from '../utils/favicon-manager';
import { useAppContext } from '../contexts/AppContext';

// 注册插件
dayjs.extend(utc);
dayjs.extend(timezone);

interface PreviewCardProps {
    parameters: any;
}

export default function PreviewCard({ parameters, }: PreviewCardProps) {
    const { t } = useTranslation();
    const { cleanupBlobs } = useAppContext();
    const [faviconUrl, setFaviconUrl] = useState<string>(parameters.icon || '');

    // 加载 favicon
    useEffect(() => {
        let isMounted = true;

        const loadFavicon = async () => {
            if (!parameters.icon) {
                setFaviconUrl('');
                return;
            }

            try {
                // 清理之前的 blob URLs
                cleanupBlobs();

                // 获取缓存的 favicon URL
                const cachedUrl = await getFaviconUrl(parameters.icon, parameters.sendTimestamp);

                if (isMounted) {
                    setFaviconUrl(cachedUrl);
                }
            } catch (error) {
                console.error('加载 favicon 失败:', error);
                if (isMounted) {
                    setFaviconUrl(parameters.icon || '');
                }
            }
        };

        loadFavicon();

        return () => {
            isMounted = false;
        };
    }, [parameters.icon, parameters.sendTimestamp, cleanupBlobs]);

    return (
        <Box sx={{
            overflow: 'hidden',
            position: 'relative'
        }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                sx={{
                    flex: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 0 6px 0 rgba(0, 0, 0, 0.01)',
                    borderRadius: '1.25rem',
                    py: 1,
                    px: 0.5,
                    userSelect: 'none',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                        boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.05)',
                    }
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="flex-start">
                    <Stack sx={{ position: 'relative', pointerEvents: 'none' }}>
                        <Stack sx={{ p: 1, display: faviconUrl !== '' ? 'inherit' : 'none' }}>
                            <img
                                // favicon 地址
                                src={faviconUrl === '' ? 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' : faviconUrl}
                                alt={t('settings.avatar.preview')}
                                style={{
                                    width: '2.625rem',
                                    height: '2.625rem',
                                    objectFit: 'contain',
                                    borderRadius: '50%',
                                }}
                            />
                        </Stack>
                        {!faviconUrl ? (
                            <Stack sx={{ p: 1 }}>
                                <Box
                                    sx={{
                                        width: '2.625rem',
                                        height: '2.625rem',
                                        objectFit: 'contain',
                                        borderRadius: '20%',
                                        backgroundColor: 'var(--u-icon-bg-color)',
                                    }}
                                >
                                    <Box sx={{
                                        width: '2.625rem',
                                        height: '2.625rem',
                                        background: 'var(--u-icon)',
                                    }}>

                                    </Box>
                                </Box>
                            </Stack>
                        ) :
                            (
                                <Box
                                    sx={{
                                        width: '1.25rem',
                                        height: '1.25rem',
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        right: '0.125rem',
                                        bottom: '0.125rem',
                                        borderRadius: '20%',
                                        backgroundColor: 'var(--u-icon-bg-color)',
                                    }}
                                >
                                    <Box sx={{
                                        width: '1.25rem',
                                        height: '1.25rem',
                                        background: 'var(--u-icon)',
                                    }}>

                                    </Box>
                                </Box>

                            )
                        }
                    </Stack>
                    <Stack direction="column" alignItems="flex-start" justifyContent="center" sx={{ p: 1 }} >
                        <Typography variant="subtitle2" fontWeight={600}>
                            {parameters.title || 'NoLet'}
                        </Typography>
                        <Typography variant="body2" fontWeight={400} sx={{
                            wordBreak: "break-word",
                            display: "-webkit-box",
                            overflow: "hidden",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2, // 限制最多2行
                        }}>
                            {parameters.body}
                        </Typography>
                    </Stack>
                </Stack>
                <Stack sx={{ p: 1, pt: 0.5 }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                        {dayjs.tz(parameters.sendTimestamp * 1000, "YYYY-MM-DD HH:mm:ss", parameters.timezone).format('HH:mm')}
                    </Typography>
                </Stack>
            </Stack>
        </Box >
    );
}
