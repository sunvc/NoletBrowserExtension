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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import { getDevices, getDefaultDevice } from '../utils/storage';
import { BackupCrypto } from '../utils/backup-crypto';
import { GoogleDriveAPI } from '../utils/google-drive';
import { BackupData } from './BackupRestoreCard';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';


interface CloudBackupDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function CloudBackupDialog({
    open,
    onClose
}: CloudBackupDialogProps) {
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
            console.error('获取语言设置失败:', error);
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
                appSettings: appSettings || {} as any,
                language: currentLanguage
            };
        } catch (error) {
            console.error('收集备份数据失败:', error);
            throw new Error('收集备份数据失败');
        }
    };

    // 处理云备份
    const handleCloudBackup = async (encrypted: boolean) => {
        if (encrypted && !password.trim()) {
            setToast({
                open: true,
                // 请输入密码
                message: t('backup.restore_dialog.password_required'),
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

            // 生成文件名
            const now = new Date();
            const timestamp_str = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = encrypted
                ? `nolet-backup-${timestamp_str}-[encrypted].json`
                : `nolet-backup-${timestamp_str}.json`;

            // 上传到Google Drive
            const backupJson = JSON.stringify(finalBackupData, null, 2);
            await GoogleDriveAPI.uploadBackup(fileName, backupJson);

            setToast({
                open: true,
                // 备份到云端成功！
                message: t('backup.cloud_backup_dialog.success'),
                severity: 'success'
            });

            // 关闭对话框
            handleClose();
        } catch (error) {
            console.error('云备份失败:', error);
            setToast({
                open: true,
                // 云备份失败: {{message}}
                message: t('backup.cloud_backup_dialog.failed', { message: error instanceof Error ? error.message : '未知错误' }),
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
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudUploadIcon />
                    {/* 备份到Google Drive */}
                    {t('backup.cloud_backup_dialog.title')}
                </DialogTitle>
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
                            // 密码
                            label={t('backup.cloud_backup_dialog.password_label')}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            variant='standard'
                            // 留空则不加密
                            placeholder={t('backup.cloud_backup_dialog.password_placeholder')}
                            disabled={loading}
                        />

                        {password.trim()?.length >= 4 && (<TextField
                            // 密码提示
                            label={t('backup.cloud_backup_dialog.password_hint_label')}
                            value={passwordHint}
                            onChange={(e) => setPasswordHint(e.target.value)}
                            fullWidth
                            variant='standard'
                            color='info'
                            // 可选，帮助记忆密码
                            placeholder={t('backup.cloud_backup_dialog.password_hint_placeholder')}
                            disabled={loading}
                        />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    {password.trim()?.length < 4 && (<Button
                        onClick={() => handleCloudBackup(false)}
                        disabled={loading}
                        color="warning"
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        {/* 备份 */}
                        {loading ? t('backup.cloud_backup_dialog.backing_up') : t('backup.cloud_backup_dialog.backup_button')}
                    </Button>)}
                    <Button
                        onClick={() => handleCloudBackup(true)}
                        disabled={loading || !isEncryptEnabled}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        {/* 备份（加密） */}
                        {loading ? t('backup.cloud_backup_dialog.backing_up') : t('backup.cloud_backup_dialog.backup_encrypted_button')}
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
