import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { GrowTransition } from './DialogTransitions';
import { useTranslation } from 'react-i18next';
import { Device, AppSettings } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { getDevices, getDefaultDevice } from '../utils/storage';
import { BackupCrypto } from '../utils/backup-crypto';
import { BackupData } from './BackupRestoreCard';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';


interface BackupDialogProps {
    open: boolean;
    onClose: () => void;
    devices: Device[];
    defaultDeviceId: string;
}

export default function BackupDialog({
    open,
    onClose,
    devices,
    defaultDeviceId
}: BackupDialogProps) {
    const { t } = useTranslation();
    const { appSettings } = useAppContext();
    const [password, setPassword] = useState('');
    const [passwordHint, setPasswordHint] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // 获取当前语言设置
    const getCurrentLanguage = async (): Promise<string> => {
        try {
            const storage = (window as any).chrome?.storage || (window as any).browser?.storage;
            if (storage) {
                const result = await storage.local.get('language');
                return result.language || 'zh-CN';
            }
            return 'zh-CN';
        } catch (error) {
            console.error(t('backup.backup_dialog.language_fetch_failed'), error);
            return 'zh-CN';
        }
    };

    // 收集备份数据
    const collectBackupData = async (): Promise<BackupData['data']> => {
        try {
            const [allDevices, defaultDevice, currentLanguage] = await Promise.all([
                getDevices(),
                getDefaultDevice(),
                getCurrentLanguage()
            ]);

            return {
                devices: allDevices,
                defaultDeviceId: defaultDevice,
                appSettings: appSettings || {} as AppSettings,
                language: currentLanguage
            };
        } catch (error) {
            console.error(t('backup.backup_dialog.collect_data_failed'), error);
            throw new Error(t('backup.backup_dialog.collect_data_failed'));
        }
    };

    // 下载备份文件
    const downloadBackupFile = (backupData: BackupData) => {
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `nolet-sender-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 处理备份
    const handleBackup = async (encrypted: boolean) => {
        if (encrypted && !password.trim()) {
            setToast({
                open: true,
                message: t('backup.backup_dialog.password_required'),
                severity: 'error'
            });
            return;
        }

        try {
            setLoading(true);
            const backupData = await collectBackupData();
            const version = BackupCrypto.getVersion();
            const runId = BackupCrypto.getRunId();
            const userAgent = BackupCrypto.getUserAgent();
            const timestamp = Date.now();

            let finalBackupData: BackupData;

            if (encrypted && password) {
                // 加密备份
                const encryptionResult = await BackupCrypto.encrypt(backupData, password);

                finalBackupData = {
                    version,
                    runId,
                    userAgent,
                    encrypted: true,
                    passwordHint: passwordHint || undefined,
                    timestamp,
                    encryptedData: encryptionResult.encryptedData,
                    iv: encryptionResult.iv,
                    salt: encryptionResult.salt
                };
            } else {
                // 明文备份
                finalBackupData = {
                    version,
                    runId,
                    userAgent,
                    encrypted: false,
                    timestamp,
                    data: backupData
                };
            }

            // 下载备份文件
            downloadBackupFile(finalBackupData);

            setToast({
                open: true,
                message: t('backup.backup_dialog.success'),
                severity: 'success'
            });

            // 关闭对话框
            handleClose();
        } catch (error) {
            console.error('备份失败:', error);
            setToast({
                open: true,
                message: t('backup.backup_dialog.failed', { message: error instanceof Error ? error.message : t('common.error_unknown') }),
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setPassword('');
        setPasswordHint('');
        onClose();
    };

    const isEncryptEnabled = password.trim().length > 0;

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                slots={{
                    transition: GrowTransition,
                }}
            >
                <DialogTitle>{t('backup.backup_dialog.title')}</DialogTitle>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent sx={{ py: 1 }}>
                    <Stack gap={2.5}>
                        <Stack gap={1} sx={{ pb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                {t('backup.backup_dialog.description_line1')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('backup.backup_dialog.description_line2')}
                            </Typography>
                        </Stack>

                        <TextField
                            label={t('backup.backup_dialog.password_label')}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            variant='standard'
                            placeholder={t('backup.backup_dialog.password_placeholder')}
                            disabled={loading}
                        />

                        {password.trim()?.length >= 4 && (
                            <TextField
                                label={t('backup.backup_dialog.password_hint_label')}
                                value={passwordHint}
                                onChange={(e) => setPasswordHint(e.target.value)}
                                fullWidth
                                variant='standard'
                                color='info'
                                placeholder={t('backup.backup_dialog.password_hint_placeholder')}
                                disabled={loading}
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    {password.trim()?.length < 4 && (
                        <Button
                            color="success"
                            onClick={() => handleBackup(false)}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : null}
                        >
                            {/* 直接备份 */}
                            {t('backup.backup_dialog.direct_backup')}
                        </Button>)}
                    <Button
                        onClick={() => handleBackup(true)}
                        disabled={loading || !isEncryptEnabled}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        {t('backup.backup_dialog.encrypted_backup')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast({ ...toast, open: false })}
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
