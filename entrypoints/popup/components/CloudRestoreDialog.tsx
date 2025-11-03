import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { SlideUpTransition } from './DialogTransitions';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import LockIcon from '@mui/icons-material/Lock';
import { useTranslation } from 'react-i18next';
import { GoogleDriveAPI } from '../utils/google-drive';
import { BackupData } from './BackupRestoreCard';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';


interface CloudRestoreDialogProps {
    open: boolean;
    onClose: () => void;
    onBackupDataReady?: (backupData: BackupData) => void;
}

interface CloudBackupFile {
    id: string;
    name: string;
    size: string;
    modifiedTime: string;
}

// 检查文件名是否表示加密备份
const isEncryptedBackup = (fileName: string): boolean => {
    return fileName.includes('-[encrypted]');
};

export default function CloudRestoreDialog({
    open,
    onClose,
    onBackupDataReady
}: CloudRestoreDialogProps) {
    const { t } = useTranslation();
    const [backupFiles, setBackupFiles] = useState<CloudBackupFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; file: CloudBackupFile | null }>({
        open: false,
        file: null
    });
    const [clearAllConfirm, setClearAllConfirm] = useState(false);
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Toast 显示函数
    const showToast = (severity: 'success' | 'error', message: string) => {
        setToast({
            open: true,
            message,
            severity
        });
    };

    // 格式化文件大小
    const formatFileSize = (bytes: number | string) => {
        const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
        if (size === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(size) / Math.log(k));
        return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 加载备份文件列表
    const loadBackupFiles = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const files = await GoogleDriveAPI.getBackupFiles();
            setBackupFiles(files);
        } catch (error) {
            console.error('加载备份文件失败:', error);
            showToast('error', t('backup.cloud_restore_dialog.load_failed', { message: error instanceof Error ? error.message : '未知错误' }));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // 处理文件选择和下载
    const handleSelectFile = async (file: CloudBackupFile) => {
        try {
            setLoading(true);

            // 从Google Drive下载文件内容
            const content = await GoogleDriveAPI.downloadBackup(file.id);

            // 解析备份数据
            const backupData: BackupData = JSON.parse(content);

            // 验证备份文件格式
            if (!backupData.version || !backupData.runId || typeof backupData.encrypted !== 'boolean') {
                // 无效的备份文件格式 这里不共用 父组件的 toast
                showToast('error', t('backup.restore_dialog.invalid_format'));
                return;
            }

            // 关闭当前对话框
            onClose();

            // 将备份数据传递给父组件
            onBackupDataReady?.(backupData);

        } catch (error) {
            console.error('下载备份文件失败:', error);
            showToast('error', t('backup.cloud_restore_dialog.download_failed', { message: error instanceof Error ? error.message : '未知错误' }));
        } finally {
            setLoading(false);
        }
    };

    // 处理删除文件
    const handleDeleteFile = async (file: CloudBackupFile, event: React.MouseEvent) => {
        event.stopPropagation(); // 阻止事件冒泡

        // 显示确认对话框
        setDeleteConfirm({ open: true, file });
    };

    // 清空所有备份文件
    const handleClearAllBackups = async () => {
        try {
            setLoading(true);

            // 使用新的清空所有备份方法（删除文件夹并重新创建）
            await GoogleDriveAPI.clearAllBackups();

            // 清空本地列表
            setBackupFiles([]);

            showToast('success', t('backup.cloud_restore_dialog.clear_all_success', { count: backupFiles.length }));
        } catch (error) {
            console.error('清空所有备份文件失败:', error);
            showToast('error', t('backup.cloud_restore_dialog.clear_all_failed', { message: error instanceof Error ? error.message : '未知错误' }));
        } finally {
            setLoading(false);
            setClearAllConfirm(false);
        }
    };
    const confirmDeleteFile = async () => {
        const file = deleteConfirm.file;
        if (!file) return;

        try {
            setLoading(true);
            await GoogleDriveAPI.deleteBackup(file.id);

            // 直接从本地列表中移除文件，不触发刷新
            setBackupFiles(prev => prev.filter(f => f.id !== file.id));

            showToast('success', t('backup.cloud_restore_dialog.delete_success'));
        } catch (error) {
            console.error('删除备份文件失败:', error);
            showToast('error', t('backup.cloud_restore_dialog.delete_failed', { message: error instanceof Error ? error.message : '未知错误' }));
        } finally {
            setLoading(false);
            setDeleteConfirm({ open: false, file: null });
        }
    };

    // 当对话框打开时加载文件列表
    useEffect(() => {
        if (open) {
            loadBackupFiles();
        }
    }, [open]);

    const handleClose = () => {
        if (loading) return;
        setBackupFiles([]);
        setDeleteConfirm({ open: false, file: null });
        setClearAllConfirm(false);
        setToast({ open: false, message: '', severity: 'success' });
        onClose();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                slots={{
                    transition: SlideUpTransition,
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudDownloadIcon />
                        {/* 从 Google Drive 还原 */}
                        {t('backup.cloud_restore_dialog.title')}
                    </Box>
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
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {/* 选择要还原的备份文件，点击文件即可开始还原流程。 */}
                            {t('backup.cloud_restore_dialog.description')}
                        </Typography>

                        {loading && !refreshing ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : backupFiles.length > 0 ? (
                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {backupFiles.map((file) => (
                                    <ListItem key={file.id} disablePadding>
                                        <ListItemButton
                                            onClick={() => handleSelectFile(file)}
                                            disabled={loading}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body1">
                                                            {dayjs(file.modifiedTime).format('YYYY-MM-DD HH:mm:ss')}
                                                            {/* {file.name} */}
                                                        </Typography>
                                                        {isEncryptedBackup(file.name) && (
                                                            <LockIcon fontSize="small" color="inherit" />
                                                        )}
                                                        {/* {refreshing && (
                                                            <CircularProgress size={16} />
                                                        )} */}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                        <Chip
                                                            // 大小: {{size}}
                                                            label={t('backup.cloud_restore_dialog.file_size', { size: formatFileSize(file.size) })}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        {/* <Chip
                                                            // 时间: {{time}}
                                                            label={t('backup.cloud_restore_dialog.file_time', { time: formatDate(file.modifiedTime) })}
                                                            size="small"
                                                            variant="outlined"
                                                        /> */}
                                                    </Stack>
                                                }
                                            />
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => handleDeleteFile(file, e)}
                                                disabled={loading || refreshing}
                                                size="small"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="info">
                                {/* Google Drive 中没有找到备份文件 */}
                                {t('backup.cloud_restore_dialog.no_files')}
                            </Alert>
                        )}

                        {/* Toast 提醒 */}
                        {toast.open && (
                            <Alert
                                severity={toast.severity}
                                variant="filled"
                                onClose={() => setToast({ ...toast, open: false })}
                                sx={{ mt: 2 }}
                            >
                                {toast.message}
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    {backupFiles.length > 2 && (
                        <Button
                            onClick={() => setClearAllConfirm(true)}
                            disabled={loading || refreshing}
                            size="small"
                            color="error"
                            sx={{ mr: 'auto' }}
                            startIcon={<DeleteSweepIcon />}
                        >
                            {/* 清空所有 */}
                            {t('backup.cloud_restore_dialog.clear_all')}
                        </Button>
                    )}
                    <Button
                        onClick={() => loadBackupFiles(true)}
                        disabled={loading || refreshing}
                        size="small"
                        loading={loading || refreshing}
                        startIcon={<RefreshIcon />}
                    >

                        {/* 刷新 */}
                        {t('backup.cloud_restore_dialog.refresh')}
                    </Button>

                </DialogActions>
            </Dialog>

            {/* 清空所有备份确认对话框 */}
            <Dialog
                open={clearAllConfirm}
                onClose={() => setClearAllConfirm(false)}
                slots={{
                    transition: SlideUpTransition,
                }}
            >
                <DialogTitle>
                    {/* 确认清空所有备份 */}
                    {t('backup.cloud_restore_dialog.confirm_clear_all_title')}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {/* 确定要删除所有备份文件吗？共 {{count}} 个文件，此操作无法撤销。 */}
                        {t('backup.cloud_restore_dialog.confirm_clear_all_message', { count: backupFiles.length })}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setClearAllConfirm(false)}
                        disabled={loading}
                    >
                        {/* 取消 */}
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleClearAllBackups}
                        disabled={loading}
                        color="error"
                        variant="contained"
                    >
                        {/* 清空所有 */}
                        {t('backup.cloud_restore_dialog.clear_all')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 删除确认对话框 */}
            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, file: null })}
                slots={{
                    transition: SlideUpTransition,
                }}
            >
                <DialogTitle>
                    {/* 确认删除 */}
                    {t('backup.cloud_restore_dialog.confirm_delete_title')}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {/* 确定要删除这个备份文件吗？此操作无法撤销。 */}
                        {t('backup.cloud_restore_dialog.confirm_delete_message')}
                    </Typography>
                    {deleteConfirm.file && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {dayjs(deleteConfirm.file.modifiedTime).format('YYYY-MM-DD HH:mm:ss')}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDeleteConfirm({ open: false, file: null })}
                        disabled={loading}
                    >
                        {/* 取消 */}
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={confirmDeleteFile}
                        disabled={loading}
                        color="error"
                        variant="contained"
                    >
                        {/* 删除 */}
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
