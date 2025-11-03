import React, { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CloudIcon from '@mui/icons-material/Cloud';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import { detectBrowser } from '../utils/platform';
import { GoogleDriveAPI } from '../utils/google-drive';
import CloudBackupDialog from './CloudBackupDialog';
import CloudRestoreDialog from './CloudRestoreDialog';
import { useTranslation } from 'react-i18next';
import { BackupData } from './BackupRestoreCard';
import { Tooltip, Collapse, Divider, Stack } from '@mui/material';

interface CloudSyncCardProps {
    onBackupDataReady?: (backupData: BackupData) => void;
}

export default function CloudSyncCard({ onBackupDataReady }: CloudSyncCardProps) {
    const [isChrome, setIsChrome] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null表示未知状态
    const [backupDialogOpen, setBackupDialogOpen] = useState(false);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false); // 控制授权成功提示的显示
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });
    const { t } = useTranslation();

    useEffect(() => {    // 检查浏览器和授权状态
        const browser = detectBrowser();
        const chromeSupported = browser === 'chrome';
        setIsChrome(chromeSupported);

        if (chromeSupported) {
            checkAuthStatus();
        }
    }, []);

    // 监听授权状态变化，自动显示和隐藏成功提示
    useEffect(() => {
        if (isAuthorized === true) {
            setShowSuccessAlert(true);
            const timer = setTimeout(() => {
                setShowSuccessAlert(false);
            }, 3000);

            // 清理定时器
            return () => clearTimeout(timer);
        } else {
            setShowSuccessAlert(false);
        }
    }, [isAuthorized]);

    // 检查授权状态
    const checkAuthStatus = async () => {
        try {
            const authorized = await GoogleDriveAPI.isAuthorized();
            setIsAuthorized(authorized);
        } catch (error) {
            console.error('检查授权状态失败:', error);
            setIsAuthorized(false);
        }
    };

    // 处理授权
    const handleAuthorize = async () => {
        try {
            setIsAuthorized(null); // 设置为处理中状态
            await GoogleDriveAPI.authorize();
            setIsAuthorized(true);
            // setToast({
            //     open: true,
            //     message: t('backup.authorize_success') || '授权成功',
            //     severity: 'success'
            // });
        } catch (error) {
            console.error('授权失败:', error);
            setIsAuthorized(false);

            // 显示具体的错误信息
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            setToast({
                open: true,
                message: t('backup.authorize_failed', { message: errorMessage }) || `授权失败: ${errorMessage}`,
                severity: 'error'
            });
        }
    };

    // 处理撤销授权
    const handleRevokeAuth = async () => {
        try {
            setIsAuthorized(null); // 设置为处理中状态
            await GoogleDriveAPI.revokeAuth();
            setIsAuthorized(false);
        } catch (error) {
            console.error('撤销授权失败:', error);
            // 即使撤销失败也重新检查状态
            checkAuthStatus();
        }
    };

    // 如果不是Chrome浏览器，不显示此卡片
    if (!isChrome) {
        return null;
    }

    const getAuthButtonText = () => {
        if (isAuthorized === null) return t('backup.processing');
        return isAuthorized ? t('backup.revoke_auth') : t('backup.authorize');
    };

    const getAuthButtonAction = () => {
        if (isAuthorized === null) return undefined;
        return isAuthorized ? handleRevokeAuth : handleAuthorize;
    };

    return (
        <>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudIcon />

                        {/* Google Drive 同步 */}
                        {t('backup.gd_sync')}
                    </Typography>

                    <Tooltip title={isAuthorized ? t('backup.authorize_status_success') : t('backup.authorize_status_failed')}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={getAuthButtonAction()}
                            disabled={isAuthorized === null}
                            color={isAuthorized ? "error" : "primary"}
                        >
                            {getAuthButtonText()}
                        </Button>
                    </Tooltip>
                </Box>

                {!isAuthorized && isAuthorized !== null && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {t('backup.authorize_description')}
                    </Alert>
                )}


                <List sx={{ px: 0 }}>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => setBackupDialogOpen(true)}
                            disabled={!isAuthorized}
                        >
                            <ListItemIcon>
                                <BackupIcon color={isAuthorized ? "primary" : "disabled"} />
                            </ListItemIcon>
                            <ListItemText
                                primary={t('backup.gd_backup')}
                                secondary={t('backup.gd_backup_description')}
                            />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => setRestoreDialogOpen(true)}
                            disabled={!isAuthorized}
                        >
                            <ListItemIcon>
                                <RestoreIcon color={isAuthorized ? "warning" : "disabled"} />
                            </ListItemIcon>
                            <ListItemText
                                primary={t('backup.gd_restore')}
                                secondary={t('backup.gd_restore_description')}
                            />
                        </ListItemButton>
                    </ListItem>
                </List>

                {/* 授权成功提示 */}
                <Collapse in={isAuthorized === true && showSuccessAlert}>
                    <Alert severity="success" sx={{ my: 2 }}>
                        {t('backup.authorize_status_success')}
                    </Alert>
                </Collapse>
            </Paper>

            <Stack sx={{
                px: 1.2,
                opacity: 0.8
            }}>
                <Typography variant="caption" color="text.secondary" fontSize={'0.625rem'}>
                    {t(`backup.gd_sync_tips`)}
                </Typography>
                <Divider />
                {/* 授权后会在 Google Drive 根目录创建一个名为 "Nolet Backups" 的文件夹, 所有操作均在此文件夹内进行。 */}
                <Typography variant="caption" color="text.secondary" fontSize={'0.625rem'}>
                    - {t(`backup.gd_sync_tips_1`)}
                </Typography>
                {/* 你也可以随时从 Google Drive 中下载备份文件, 然后在 本地同步 中还原。 */}
                <Typography variant="caption" color="text.secondary" fontSize={'0.625rem'}>
                    - {t(`backup.gd_sync_tips_2`)}
                </Typography>
            </Stack>

            {/* 云备份对话框 */}
            <CloudBackupDialog
                open={backupDialogOpen}
                onClose={() => setBackupDialogOpen(false)}
            />

            {/* 云还原对话框 */}
            <CloudRestoreDialog
                open={restoreDialogOpen}
                onClose={() => setRestoreDialogOpen(false)}
                onBackupDataReady={onBackupDataReady}
            />

            {/* Toast 消息 */}
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast({ ...toast, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
