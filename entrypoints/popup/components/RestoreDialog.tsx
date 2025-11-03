import React, { useState, useRef, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import { SlideUpTransition } from './DialogTransitions';
import SecurityIcon from '@mui/icons-material/Security';
import { useTranslation } from 'react-i18next';
import { Device, ThemeMode } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { getDevices } from '../utils/storage';
import { saveAppSettings } from '../utils/settings';
import { BackupCrypto } from '../utils/backup-crypto';
import { BackupData } from './BackupRestoreCard';


interface RestoreDialogProps {
    open: boolean;
    onClose: () => void;
    devices: Device[];
    defaultDeviceId: string;
    onSettingsChange?: () => void;
    // 设备操作函数
    onAddDevice?: (alias: string, apiURL: string, authorization?: { type: 'basic'; user: string; pwd: string; value: string; }) => Promise<Device>;
    onEditDevice?: (oldDeviceId: string, alias: string, apiURL: string, authorization?: { type: 'basic'; user: string; pwd: string; value: string; }) => Promise<Device>;
    onSetDefaultDevice?: (deviceId: string) => Promise<void>;
    // 主题操作函数
    onThemeChange?: (mode: ThemeMode) => void;
    // 云端备份数据（可选）
    cloudBackupData?: BackupData | null;
    showToast?: (severity: 'error' | 'warning' | 'info' | 'success', message: string) => void;
}

export default function RestoreDialog({
    open,
    onClose,
    devices,
    defaultDeviceId,
    onSettingsChange,
    onAddDevice,
    onEditDevice,
    onSetDefaultDevice,
    onThemeChange,
    cloudBackupData,
    showToast
}: RestoreDialogProps) {
    const { t } = useTranslation();
    const { reloadSettings } = useAppContext();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [successToast, setSuccessToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // 当有云端备份数据时，直接使用它
    useEffect(() => {
        if (cloudBackupData) {
            setPassword(''); // 重置密码
        }
    }, [cloudBackupData]);

    const backupData = cloudBackupData;

    // 合并设备配置
    const mergeDevicesWithOperations = async (backupDevices: Device[]): Promise<void> => {
        if (!onAddDevice || !onEditDevice) {
            console.warn('设备操作函数未提供，跳过设备合并');
            return;
        }

        let addedCount = 0;
        let updatedCount = 0;

        for (const backupDevice of backupDevices) {
            const existingDevice = devices.find(device => device.id === backupDevice.id);

            if (existingDevice) { // 存在相同ID，更新设备配置
                try {
                    await onEditDevice(
                        backupDevice.id,
                        backupDevice.alias,
                        backupDevice.apiURL,
                        backupDevice.authorization
                    );
                    updatedCount++;
                    console.log('更新设备:', backupDevice.alias, `(ID: ${backupDevice.id})`);
                } catch (error) {
                    console.error('更新设备失败:', backupDevice.alias, error);
                }
            } else { // 不存在，添加新设备
                try {
                    await onAddDevice(
                        backupDevice.alias,
                        backupDevice.apiURL,
                        backupDevice.authorization
                    );
                    addedCount++;
                    console.log('添加设备:', backupDevice.alias, `(ID: ${backupDevice.id})`);
                } catch (error) {
                    console.error('添加设备失败:', backupDevice.alias, error);
                }
            }
        }

        console.log(`设备合并完成: 新增 ${addedCount} 个，更新 ${updatedCount} 个`);
    };

    // 执行还原操作
    const performRestore = async (restoredData: BackupData['data']) => {
        if (!restoredData) {
            throw new Error('还原数据为空');
        }

        try {
            // 1. 还原设备配置（增量合并）
            if (restoredData.devices && Array.isArray(restoredData.devices)) {
                await mergeDevicesWithOperations(restoredData.devices);
                console.log('设备配置已合并还原:', restoredData.devices.length, '个备份设备');
            }

            // 2. 还原默认设备
            if (restoredData.defaultDeviceId && onSetDefaultDevice) {
                // 检查默认设备是否在当前设备列表中（包括刚刚合并的）
                const allDevices = await getDevices();
                const deviceExists = allDevices.some(device => device.id === restoredData.defaultDeviceId);
                if (deviceExists) {
                    await onSetDefaultDevice(restoredData.defaultDeviceId);
                    console.log('默认设备已还原:', restoredData.defaultDeviceId);
                } else {
                    console.warn('默认设备ID不存在于设备列表中，跳过设置默认设备');
                }
            }

            // 3. 还原应用设置
            if (restoredData.appSettings) {
                await saveAppSettings(restoredData.appSettings);
                console.log('应用设置已还原:', restoredData.appSettings);

                // 如果包含主题设置，立即应用主题
                if (restoredData.appSettings.themeMode && onThemeChange) {
                    onThemeChange(restoredData.appSettings.themeMode);
                    console.log('主题已切换:', restoredData.appSettings.themeMode);
                }
            }

            // 4. 还原语言设置
            if (restoredData.language) {
                try {
                    const storage = (window as any).chrome?.storage || (window as any).browser?.storage;
                    if (storage) {
                        await storage.local.set({ language: restoredData.language });
                        console.log('语言设置已还原:', restoredData.language);
                    }
                } catch (error) {
                    console.error('还原语言设置失败:', error);
                    // 语言还原失败不应该阻止整个还原过程
                }
            }

            await reloadSettings(); // 重新加载应用设置
            onSettingsChange?.(); // 通知父组件更新

            console.log('所有数据还原完成');
        } catch (error) {
            console.error('还原过程中发生错误:', error);
            throw new Error(`还原失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    };

    // 处理确认还原
    const handleConfirmRestore = async () => {
        if (!backupData) return;

        // 如果是加密文件但没有输入密码
        if (backupData.encrypted && !password.trim()) {
            setErrorMessage(t('backup.restore_dialog.password_required'));
            return;
        }

        try {
            setLoading(true);
            setErrorMessage(''); // 清除错误信息
            let restoredData: BackupData['data'];

            if (backupData.encrypted && backupData.encryptedData && backupData.iv && backupData.salt) {
                try {
                    // 解密数据
                    restoredData = await BackupCrypto.decrypt(
                        backupData.encryptedData,
                        backupData.iv,
                        backupData.salt,
                        password
                    );
                } catch (decryptError) {
                    throw new Error('decrypt_failed');
                }
            } else if (!backupData.encrypted && backupData.data) {
                // 明文数据
                restoredData = backupData.data;
            } else {
                showToast?.('error', t('backup.restore_dialog.invalid_format'));
                return;
            }

            // 执行还原
            await performRestore(restoredData);

            setSuccessToast(true);
            handleClose();
        } catch (error) {
            console.error('还原失败:', error);
            setErrorMessage(
                error instanceof Error
                    ? error.message === 'decrypt_failed'
                        ? t('backup.restore_dialog.decrypt_failed')
                        : t('backup.restore_dialog.failed', {
                            message: error.message === 'Error'
                                ? t('common.error_unknown')
                                : error.message
                        })
                    : t('backup.restore_dialog.failed', { message: t('common.error_unknown') })
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setPassword('');
        onClose();
    };

    return (
        <>
            {/* 确认还原对话框 */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                slots={{
                    transition: SlideUpTransition,
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {backupData?.encrypted ? (
                        <>
                            <SecurityIcon color="warning" />
                            {/* 输入解密密码 */}
                            {t('backup.restore_dialog.encrypted_title')}
                        </>
                    ) : (
                        // 确认还原
                        t('backup.restore_dialog.confirm_title')
                    )}
                </DialogTitle>
                <DialogContent sx={{ py: 1 }}>
                    <Stack gap={2} sx={{ py: 2 }}>
                        {backupData?.encrypted ? (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    {/* 确认要还原这个备份吗？还原操作将会覆盖当前的所有配置。 */}
                                    {t('backup.restore_dialog.encrypted_description')}
                                </Typography>
                                <TextField
                                    label={t('backup.restore_dialog.password_label')}
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setErrorMessage(''); // 清除错误信息
                                    }}
                                    fullWidth
                                    autoFocus
                                    variant='standard'
                                    placeholder={t('backup.restore_dialog.password_placeholder')}
                                    disabled={loading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && password.trim()) {
                                            handleConfirmRestore();
                                        }
                                    }}
                                    error={!!errorMessage}
                                    helperText={errorMessage || t('backup.restore_dialog.password_helper')}
                                />
                                {backupData.passwordHint && (
                                    <Alert severity="info">
                                        <Typography variant="body2">
                                            {/* 密码提示: {{hint}} */}
                                            {t('backup.restore_dialog.password_hint', { hint: backupData.passwordHint })}
                                        </Typography>
                                    </Alert>
                                )}

                            </>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    {/* 确认要还原这个备份吗？还原操作将会覆盖当前的所有配置。 */}
                                    {t('backup.restore_dialog.confirm_description')}
                                </Typography>

                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        {/* 取消 */}
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirmRestore}
                        variant="contained"
                        color="warning"
                        disabled={loading || (backupData?.encrypted && !password.trim())}
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        {/* 确认还原 */}
                        {loading ? t('backup.restore_dialog.restoring') : t('backup.restore_dialog.confirm_restore')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={successToast}
                autoHideDuration={4000}
                onClose={() => setSuccessToast(false)}
            >
                <Alert
                    onClose={() => setSuccessToast(false)}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    {t('backup.restore_dialog.success')}
                </Alert>
            </Snackbar>
        </>
    );
}
