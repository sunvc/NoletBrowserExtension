import React, { useState, useEffect, } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Typography,
    Chip,
    Box,
    Collapse,
    Card,
    Divider,
    IconButton,
    Badge,
    Tooltip,
    InputAdornment,
    Snackbar
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Device } from '../types';
import { validateApiURL } from '../utils/api';
import { useAppContext } from '../contexts/AppContext';
import PingButton from "./PingButton";
import GiteIcon from '@mui/icons-material/Gite';
import PhonelinkIcon from '@mui/icons-material/Phonelink';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import { blue } from '@mui/material/colors';
import { useSnackbar, SnackbarKey } from "notistack";
import { Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SlideUpTransition } from './DialogTransitions';

const COMMON_DEVICE_NAMES = ['iphone', 'ipad', 'mac'];

// 截取第 4 个斜杠后的内容 (如果没有协议则截取第 2 个斜杠后的内容)
const truncateAfterFourthSlash = (url: string): string => {
    if (!url) return url;

    // 检查是否包含协议
    const hasProtocol = /^https?:\/\//.test(url);

    if (hasProtocol) {
        const match = url.match(/^(.*?\/.*?\/.*?\/.*?\/)/);
        return match ? match[1] : url;
    } else {
        const match = url.match(/^(.*?\/.*?\/)/);
        return match ? match[1] : url;
    }
};

// 拼接服务器地址和设备 Key，去除前后斜杠并使用/连接
const concatenateServerAndDeviceKey = (server: string, deviceKey: string): string => {
    if (!server || !deviceKey) return '';

    // 去除 server 末尾的斜杠
    const cleanServer = server.replace(/\/+$/, '');
    // 去除 deviceKey 前后的斜杠
    const cleanDeviceKey = deviceKey.replace(/^\/+|\/+$/g, '');

    // 使用单个杠连接
    return `${cleanServer}/${cleanDeviceKey}/`;
};

function isValidDeviceKey(input: string): boolean {
    const shortUuidRegex = /^[A-Za-z0-9]{5,}$/;
    return shortUuidRegex.test(input);
}

interface DeviceDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (alias: string, apiURL: string, authorization?: { type: 'basic'; user: string; pwd: string; value: string }) => Promise<void>;
    editDevice?: Device;
    title?: string;
}

export default function DeviceDialog({
    open,
    onClose,
    onSubmit,
    editDevice,
    title
}: DeviceDialogProps) {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const { t } = useTranslation();
    const [deviceAlias, setDeviceAlias] = useState('');
    const [deviceApiURL, setDeviceApiURL] = useState('');

    // 是否自建服务器
    const [selfHosted, setSelfHosted] = useState(false);

    // 第二种模式 自建服务器 采用 server + deviceKey 作为 API URL
    const [server, setServer] = useState('https://wzs.app'); // 自建服务器地址 (使用 nolet 官方服务器回落)
    const [deviceKey, setDeviceKey] = useState('');              // 设备密钥

    const [basicAuthUsername, setBasicAuthUsername] = useState('');
    const [basicAuthPassword, setBasicAuthPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isBasicAuthCollapsed, setIsBasicAuthCollapsed] = useState(true);
    const { appSettings, updateAppSetting } = useAppContext();

    // 获取 enableBasicAuth 功能开关设置
    const enableBasicAuth = appSettings?.enableBasicAuth || false;

    // 当编辑设备时，填充表单
    useEffect(() => {
        if (editDevice) {
            setDeviceAlias(editDevice.alias);
            setDeviceApiURL(editDevice.apiURL);
            setServer(editDevice.server || 'https://wzs.app');
            setDeviceKey(editDevice.deviceKey || '');
            setBasicAuthUsername(editDevice.authorization?.user || '');
            setBasicAuthPassword(editDevice.authorization?.pwd || '');

            // 如果 server 不等于 nolet 官方服务器地址，则切换到自建模式
            const isCustomServer = editDevice.server && editDevice.server !== 'https://wzs.app';
            setSelfHosted(isCustomServer || false);

            // 如果有认证信息，自动展开基本认证区域
            setIsBasicAuthCollapsed(!editDevice.authorization);
        } else {
            setDeviceAlias('');
            setDeviceApiURL('');
            setBasicAuthUsername('');
            setBasicAuthPassword('');
            setIsBasicAuthCollapsed(true);
            setSelfHosted(false);
            setServer('https://wzs.app');
            setDeviceKey('');
        }
        setError('');
    }, [editDevice, open]);

    const handleSubmit = async () => {
        let finalApiURL = deviceApiURL.trim();

        // 自建服务器模式
        if (selfHosted) {
            // 检查 deviceKey 格式
            if (!isValidDeviceKey(deviceKey.trim())) {
                setError(t('device.device_key_invalid'));
                return;
            }
        } else {
            // 非自建服务器模式
            const shortUuidRegex = /^[A-HJ-NP-Za-km-z2-9]{22}$/; // deviceKey 是标准的 22 位的 shortuuid

            let deviceKey: string | null = null;
            let origin = 'https://wzs.app'; // 默认官方服务器

            switch (finalApiURL.length) {
                case 22: // {22位uuid}
                    if (shortUuidRegex.test(finalApiURL)) {
                        deviceKey = finalApiURL;
                    }
                    break;

                case 24: // /{22位uuid}/
                    if (finalApiURL.startsWith("/") && finalApiURL.endsWith("/")) {
                        const core = finalApiURL.slice(1, -1);
                        if (shortUuidRegex.test(core)) {
                            deviceKey = core;
                        }
                    }
                    break;

                default: // URL 里包含 22 位 uuid
                    const containUuidRegex = /(?:^|\/)([A-HJ-NP-Za-km-z2-9]{22})(?:\/|$)/;
                    const match = finalApiURL.match(containUuidRegex);
                    if (match) {
                        deviceKey = match[1];

                        // 提取用户输入的网址里的 origin 部分
                        try {
                            const url = new URL(finalApiURL.startsWith('http') ? finalApiURL : `https://${finalApiURL}`);
                            origin = url.origin;
                        } catch {
                            // 如果无法解析为URL，尝试提取域名部分
                            const domainMatch = finalApiURL.match(/^(?:https?:\/\/)?([^\/]+)/);
                            if (domainMatch) {
                                const domain = domainMatch[1];
                                origin = finalApiURL.startsWith('https://') ? `https://${domain}` :
                                    finalApiURL.startsWith('http://') ? `http://${domain}` :
                                        `https://${domain}`;
                            }
                        }
                    }
            }

            if (!deviceKey) {
                setError(t('device.device_key_invalid'));
                return;
            }
            finalApiURL = `${origin}/${deviceKey}/`;
        }

        // 判断是否关闭地址处理, 如果是自建服务器, 则不要截取
        const truncatedURL = selfHosted ? finalApiURL : truncateAfterFourthSlash(finalApiURL);

        if (!validateApiURL(truncatedURL)) {
            setError(t('device.api_url_invalid'));
            return;
        }

        setLoading(true);
        setError('');

        try {

            let authorization;
            if (basicAuthUsername.trim() && basicAuthPassword.trim()) {
                const credentials = btoa(`${basicAuthUsername.trim()}:${basicAuthPassword.trim()}`);
                authorization = {
                    type: 'basic' as const,
                    user: basicAuthUsername.trim(),
                    pwd: basicAuthPassword.trim(),
                    value: `Basic ${credentials}`
                };
            }
            // truncatedURL 是截取后的URL, 格式为 `https://wzs.app/<device_key>/`
            await onSubmit(deviceAlias.trim(), truncatedURL, authorization);
           
            onClose();
        } catch (error) {
            // setError(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
            setError(t('common.operation_failed', { message: error instanceof Error ? error.message : t('common.error_unknown') }));
        } finally {
            setLoading(false);
        }
    };

    // 当 server 或 deviceKey 变化时，更新 deviceApiURL
    useEffect(() => {
        setDeviceApiURL(concatenateServerAndDeviceKey(server.trim(), deviceKey.trim()));
    }, [server, deviceKey]);

    const showAlert = (
        severity: "info" | "error" | "success" | "warning",
        message: string
    ) => {
        enqueueSnackbar("", {
            autoHideDuration: 3000,
            anchorOrigin: { vertical: 'top', horizontal: 'right' },
            content: (key: SnackbarKey) => (
                <Alert
                    severity={severity}
                    sx={{ width: "100%" }}
                    action={
                        <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => closeSnackbar(key)}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    {message}
                </Alert>
            ),
        });
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
            <DialogTitle>{title || t(editDevice ? 'device.edit' : 'device.add')} <span style={{ fontSize: '0.875rem', color: blue[500] }}>{selfHosted ? `(${t('device.self_hosted')})` : ''}</span></DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {selfHosted ? (
                        <Stack gap={2} direction="column" sx={{ px: 1, pb: 1 }}>
                            {/* 自建服务器地址 */}
                            <TextField
                                label={t('device.server')}
                                placeholder={t('device.server_placeholder')}
                                value={server}
                                onChange={(e) => {
                                    setServer(e.target.value);
                                    setError('');
                                }}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <Tooltip title={t('device.device_key_helper')}>
                                                <InputAdornment position="end" sx={{ cursor: 'cell' }}>
                                                    <FilterDramaIcon fontSize="small" />
                                                </InputAdornment>
                                            </Tooltip>
                                        ),
                                    },
                                }}
                                variant="standard"
                                fullWidth
                                size="small"
                                error={!!error && error === t('device.server_invalid')}
                            // helperText={
                            //     error === t('device.server_invalid')
                            //         ? error
                            //         : t('device.server_helper')
                            // }
                            />
                            <TextField
                                label={t('device.device_key')}
                                placeholder={t('device.device_key_placeholder')}
                                value={deviceKey}
                                onChange={(e) => {
                                    setDeviceKey(e.target.value);
                                    setError('');
                                }}
                                size="small"
                                variant="standard"
                                fullWidth
                                error={!!error && error === t('device.device_key_invalid')}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <Tooltip title={t('device.device_key_helper')}>
                                                <InputAdornment position="end" sx={{ cursor: 'cell' }}>
                                                    <PhonelinkIcon fontSize="small" />
                                                </InputAdornment>
                                            </Tooltip>
                                        ),
                                    },
                                }}
                            />


                        </Stack>
                    ) : ( // 非自建
                        <TextField
                            label={t('device.api_url')}
                            placeholder={t('device.api_url_placeholder')}
                            value={deviceApiURL}
                            onChange={(e) => {
                                setDeviceApiURL(e.target.value);
                                setError('');
                            }}
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={2}
                            error={!!error && (error === t('device.api_url_invalid') || error === t('device.device_key_invalid'))}
                            helperText={
                                (error === t('device.api_url_invalid') || error === t('device.device_key_invalid'))
                                    ? error
                                    : t('device.api_url_helper')
                            }
                        />)}
                    {/* 实时预览 */}
                    {selfHosted && server.trim() && deviceKey.trim() && (
                        <Stack direction="column" gap={0} sx={{ px: 1, py: 0.2, backgroundColor: "ButtonFace", borderRadius: 0.5 }}>
                            {/* 最终地址 */}
                            <Typography variant="caption" color="text.secondary">
                                {t('device.final_url')}:
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                {concatenateServerAndDeviceKey(server.trim(), deviceKey.trim())}
                            </Typography>
                        </Stack>
                    )}
                    <Stack sx={{ px: selfHosted ? 1 : 0 }}>
                        <Box>
                            <TextField
                                label={t('device.name')}
                                placeholder={t('device.name_placeholder')}
                                value={deviceAlias}
                                onChange={(e) => setDeviceAlias(e.target.value)}
                                variant={selfHosted ? "standard" : "outlined"}
                                fullWidth
                                helperText={t('device.name_helper')}
                            />
                            {!editDevice && !selfHosted && (
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    {COMMON_DEVICE_NAMES.map((name) => (
                                        <Chip
                                            key={name}
                                            label={t(`device.common_names.${name}`)}
                                            onClick={() => setDeviceAlias(t(`device.common_names.${name}`))}
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                    {error && error !== t('device.api_url_invalid') && error !== t('device.device_key_invalid') && (
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    )}

                    {/* Basic Auth */}
                    {/* Basic Auth 认证区域 */}
                    <Box sx={{ display: (selfHosted || enableBasicAuth) ? 'block' : 'none' }}>
                        <Divider sx={{ mb: .5, px: 1.5, userSelect: 'none' }} >
                            <Box sx={{
                                fontSize: '0.625rem', cursor: 'pointer',
                            }} onClick={() => setIsBasicAuthCollapsed(!isBasicAuthCollapsed)}>
                                {t('device.basic_auth.title')}
                            </Box>
                        </Divider>
                        <Collapse in={!isBasicAuthCollapsed}>
                            <Card>
                                <Stack direction="column" gap={1.5} sx={{ px: 2, py: 1.5 }}>
                                    <TextField
                                        // label="用户名"
                                        // placeholder="输入用户名"
                                        label={t('device.basic_auth.username')}
                                        placeholder={t('device.basic_auth.username_placeholder')}
                                        value={basicAuthUsername}
                                        onChange={(e) => setBasicAuthUsername(e.target.value)}
                                        variant="standard"
                                        size="small"
                                        fullWidth
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true  // 禁用浮动
                                            }
                                        }}
                                    />
                                    <TextField
                                        // label="密码"
                                        // placeholder="输入密码"
                                        label={t('device.basic_auth.password')}
                                        placeholder={t('device.basic_auth.password_placeholder')}
                                        type="text"
                                        value={basicAuthPassword}
                                        onChange={(e) => setBasicAuthPassword(e.target.value)}
                                        variant="standard"
                                        size="small"
                                        fullWidth
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true  // 禁用浮动
                                            }
                                        }}
                                    />
                                </Stack>
                            </Card>
                        </Collapse>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                {/* 取消 */}
                <Stack direction="row" gap={1} sx={{ mr: "auto", px: 1.5 }}>
                    <Badge color="info" variant="dot" invisible={!selfHosted} overlap="circular" anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                        <Tooltip title={selfHosted ? t('device.official_switch') : t('device.self_hosted_switch')} placement="bottom-start" arrow>
                            <IconButton onClick={() => setSelfHosted(!selfHosted)} color={selfHosted ? 'info' : 'default'} size="small">
                                <GiteIcon />
                            </IconButton>
                        </Tooltip>
                    </Badge>
                    <PingButton apiURL={deviceApiURL} showAlert={showAlert} />
                </Stack>
                <Button onClick={onClose}>{t('common.cancel')}</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    color={selfHosted ? 'info' : 'primary'}
                    disabled={loading || !deviceAlias.trim() || !deviceApiURL.trim() || (selfHosted && !deviceKey.trim())}
                >
                    {loading ? t('common.processing') : editDevice ? t('common.save') : t('common.add')}
                </Button>
            </DialogActions>
            {/* 自建服务器提醒 */}
            {!selfHosted && deviceApiURL.length > 25 && !deviceApiURL.includes('wzs.app/') && (
                <Snackbar open
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelfHosted(!selfHosted)}
                >
                    <Alert
                        icon={<GiteIcon fontSize="inherit" />}
                        severity="warning"
                        variant="standard"
                        sx={{ width: '100%' }}
                    >
                        {t(editDevice ? 'device.self_hosted_tip_edit' : 'device.self_hosted_tip')}
                    </Alert>
                </Snackbar>
            )}
        </Dialog >
    );
} 