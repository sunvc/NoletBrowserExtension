import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { SlideLeftTransition } from './DialogTransitions';
import { Device, AppSettings, ThemeMode } from '../types';
import LocalSyncCard from './LocalSyncCard';
import CloudSyncCard from './CloudSyncCard';
import RestoreDialog from './RestoreDialog';
import { useTranslation } from 'react-i18next';
import SyncIcon from '@mui/icons-material/Sync';
import Button from '@mui/material/Button';
// import { Chip } from '@mui/material';

interface BackupRestoreCardProps {
    devices: Device[];
    defaultDeviceId: string;
    onSettingsChange?: () => void;
    // 设备操作函数
    onAddDevice?: (alias: string, apiURL: string, authorization?: { type: 'basic'; user: string; pwd: string; value: string; }) => Promise<Device>;
    onEditDevice?: (oldDeviceId: string, alias: string, apiURL: string, authorization?: { type: 'basic'; user: string; pwd: string; value: string; }) => Promise<Device>;
    onSetDefaultDevice?: (deviceId: string) => Promise<void>;
    // 主题操作函数
    onThemeChange?: (mode: ThemeMode) => void;
}

export interface BackupData {
    version: string;
    runId: string;
    userAgent: string;
    encrypted: boolean;
    passwordHint?: string;
    timestamp: number;
    data?: {
        devices: Device[];
        defaultDeviceId: string;
        appSettings: AppSettings;
        language: string;
    };
    // 加密数据字段
    encryptedData?: string;
    iv?: string;
    salt?: string;
}

export default function BackupRestoreCard({
    devices,
    defaultDeviceId,
    onSettingsChange,
    onAddDevice,
    onEditDevice,
    onSetDefaultDevice,
    onThemeChange
}: BackupRestoreCardProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [cloudBackupData, setCloudBackupData] = useState<BackupData | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [toast, setToast] = useState<{
        open: boolean;
        message: string;
        severity: 'error' | 'warning' | 'info' | 'success';
    }>({
        open: false,
        message: '',
        severity: 'error'
    });
    const { t } = useTranslation();

    // 显示toast消息
    const showToast = (severity: 'error' | 'warning' | 'info' | 'success', message: string) => {
        setToast({
            open: true,
            message,
            severity
        });
    };

    const handleClose = () => {
        setDialogOpen(false);
        setIsDragging(false);
    };

    // 处理云端备份数据准备就绪
    const handleCloudBackupDataReady = (backupData: BackupData) => {
        setCloudBackupData(backupData);
    };

    // 处理文件拖拽
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) {
            setIsDragging(true);
        }
    }, [isDragging]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));

        if (!jsonFile) {
            showToast('error', t('backup.restore_dialog.drag_json_file'));
            return;
        }

        try {
            const fileContent = await jsonFile.text();
            const parsedBackupData: BackupData = JSON.parse(fileContent);

            // 验证备份文件格式
            if (!parsedBackupData.version || !parsedBackupData.runId || typeof parsedBackupData.encrypted !== 'boolean') {
                showToast('error', t('backup.restore_dialog.invalid_format'));
                return;
            }

            setCloudBackupData(parsedBackupData);
        } catch (error) {
            console.error('文件解析失败:', error);
            showToast('error', t('backup.restore_dialog.file_parse_failed'));
        }
    }, [showToast, t]);

    return (
        <>
            <Paper sx={{ p: 0 }}>
                <Button onClick={() => setDialogOpen(true)}
                    sx={{ width: '100%', justifyContent: 'space-between' }}>
                    <Stack direction="row" justifyContent="space-between"
                        sx={{ px: 2, py: 1.5, width: '100%' }}>
                        <Typography variant="h6" color="textPrimary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SyncIcon />
                            {t('backup.title')}
                            {/* <Chip label="Beta" size="small" variant="outlined" color="warning" /> */}
                        </Typography>
                        <NavigateNextIcon />
                    </Stack>
                </Button>
            </Paper >

            {/* 全屏对话框 */}
            <Dialog
                open={dialogOpen}
                slots={{
                    transition: SlideLeftTransition,
                }
                }
                onClose={handleClose}
                fullScreen
                sx={{ '& .MuiDialog-paper': { borderRadius: 0, border: 'none' } }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <AppBar sx={{ position: 'relative' }}>
                    <Toolbar variant="dense">
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={handleClose}
                            aria-label="close"
                        >
                            <ArrowBackIosNewIcon />
                        </IconButton>
                        <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                            {t('backup.title')}
                        </Typography>
                    </Toolbar>
                </AppBar>

                {/* 内容区域 */}
                <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                    <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
                        {/* 本地同步卡片 */}
                        <LocalSyncCard
                            devices={devices}
                            defaultDeviceId={defaultDeviceId}
                            onSettingsChange={onSettingsChange}
                            onAddDevice={onAddDevice}
                            onEditDevice={onEditDevice}
                            onSetDefaultDevice={onSetDefaultDevice}
                            onThemeChange={onThemeChange}
                            isDragging={isDragging}
                            showToast={showToast}
                        />

                        {/* 云同步卡片 */}
                        <CloudSyncCard onBackupDataReady={handleCloudBackupDataReady} />
                    </Stack>
                </Box>
            </Dialog >

            {/* 还原对话框 - 云端备份 和 拖拽文件 共用状态 */}
            <RestoreDialog
                open={!!cloudBackupData}
                onClose={() => setCloudBackupData(null)}
                devices={devices}
                defaultDeviceId={defaultDeviceId}
                onSettingsChange={onSettingsChange}
                onAddDevice={onAddDevice}
                onEditDevice={onEditDevice}
                onSetDefaultDevice={onSetDefaultDevice}
                onThemeChange={onThemeChange}
                cloudBackupData={cloudBackupData}
                showToast={showToast}
            />

            {/* Toast 消息 */}
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast({ ...toast, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ zIndex: 9999 }}
            >
                <Alert
                    onClose={() => setToast({ ...toast, open: false })}
                    severity={toast.severity}
                    sx={{ width: '100%' }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </>
    );
}
