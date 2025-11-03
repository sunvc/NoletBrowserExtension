import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Stack,
    Button,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import LottiePlayer from '../components/LottiePlayer';
import {
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { HistoryRecord, dbManager } from '../utils/database';
import HistoryTableSkeleton from '../components/HistoryTableSkeleton';
import { GrowTransition } from '../components/DialogTransitions';

const HistoryTable = React.lazy(() => // 懒加载HistoryTable组件
    import(
        /* webpackChunkName: "history-table" */
        /* webpackPrefetch: true */
        '../components/HistoryTable'
    )
);

const RecordDetailModal = React.lazy(() => // 懒加载RecordDetailModal组件
    import(
        /* webpackChunkName: "record-detail-modal" */
        /* webpackPrefetch: true */
        '../components/RecordDetailModal'
    )
);

export default function History() {
    const { t } = useTranslation();
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [hasData, setHasData] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(-1);
    const [scrollToRecordId, setScrollToRecordId] = useState<number | undefined>(undefined);
    const [filteredRecords, setFilteredRecords] = useState<HistoryRecord[]>([]); // 过滤后的记录
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasInitialized = useRef(false); // 防止重复初始化
    const importLock = useRef(false); // 导入锁，防止重复导入

    // 导入 storage.local 中的暂存历史记录到IndexedDB
    const importStorageHistory = async () => {
        // 检查导入锁
        if (importLock.current) {
            console.debug('导入操作正在进行中，跳过重复导入');
            return;
        }

        try {
            importLock.current = true; // 加锁
            console.debug('开始导入 storage.local 中的暂存历史记录');

            // 1. 从 storage.local读取暂存历史记录
            const result = await browser.storage.local.get('nolet_history');
            const storageHistory = result.nolet_history || [];

            if (storageHistory.length === 0) {
                console.debug('没有需要导入的暂存历史记录');
                return;
            }

            console.debug(`发现 ${storageHistory.length} 条暂存历史记录，准备导入`);

            // 2. 深拷贝暂存数据
            const historyToImport = JSON.parse(JSON.stringify(storageHistory));

            // 3. 删除 storage.local中的暂存数据
            await browser.storage.local.remove('nolet_history');
            console.debug('已清除 storage.local 中的暂存历史记录');

            // 4. 将深拷贝的数据导入到IndexedDB
            let importedCount = 0;
            for (const record of historyToImport) {
                try {
                    // 检查是否已存在相同UUID的记录
                    const existingRecords = await dbManager.getAllRecords();
                    const exists = existingRecords.some(existing => existing.uuid === record.uuid);

                    if (!exists) {
                        // 移除id字段，让数据库自动生成
                        const { id, ...recordWithoutId } = record;
                        await dbManager.addRecord(recordWithoutId);
                        importedCount++;
                    }
                } catch (error) {
                    console.error('导入单条记录失败:', error, record);
                }
            }

            console.debug(`成功导入 ${importedCount} 条历史记录到IndexedDB`);

        } catch (error) {
            console.error('导入暂存历史记录失败:', error);
        } finally {
            importLock.current = false; // 释放锁
        }
    };

    // 加载历史记录, 因为 background 记录到 IndexedDB 中困难，所以暂存 storage.local 读取历史记录
    const loadRecords = async (forceReload: boolean = false) => {
        // 防止重复调用（除非强制刷新）
        if (hasInitialized.current && !forceReload) {
            console.debug('loadRecords 已经初始化过，跳过重复调用');
            return;
        }

        try {
            setLoading(true);
            if (!forceReload) {
                hasInitialized.current = true; // 标记已初始化
            }

            // 从 storage.local 读取历史记录
            const result = await browser.storage.local.get('nolet_history');
            const storageHistory = result.nolet_history || [];

            console.debug('从 storage.local读取的历史记录:', storageHistory);
            console.debug('历史记录数量:', storageHistory.length);

            // 如果有暂存的历史记录，自动导入到IndexedDB
            if (storageHistory.length > 0) {
                await importStorageHistory();
            }

            // 从IndexedDB读取历史记录用于显示
            const data = await dbManager.getAllRecords();
            setRecords(data);
            setHasData(data.length > 0);
        } catch (error) {
            console.error('加载历史记录失败:', error);
            setAlert({ type: 'error', message: t('history.messages.load_failed') }); // 加载历史记录失败
        } finally {
            setLoading(false);
        }
    };

    // 批量删除记录
    const handleDelete = async () => {
        if (selectedIds.length === 0) return;

        try {
            setDeleting(true);
            await dbManager.deleteRecords(selectedIds);
            setSelectedIds([]);
            setShowDeleteDialog(false);
            await loadRecords(true);
            setAlert({ type: 'success', message: t('history.messages.delete_success', { count: selectedIds.length }) }); // 已删除 {{count}} 条记录
        } catch (error) {
            console.error('删除失败:', error);
            setAlert({ type: 'error', message: t('history.messages.delete_failed') }); // 删除失败
        } finally {
            setDeleting(false);
        }
    };

    // 导出记录
    const handleExport = async () => {
        try {
            const data = await dbManager.exportRecords();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nolet-history-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setAlert({ type: 'success', message: t('history.messages.export_success') });
        } catch (error) {
            console.error('导出失败:', error);
            setAlert({ type: 'error', message: t('history.messages.export_failed') });
        }
    };

    // 从右键菜单导出指定记录
    const handleExportRecords = async (records: HistoryRecord[]) => {
        try {
            const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nolet-history-selected-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setAlert({ type: 'success', message: t('history.messages.export_success') });
        } catch (error) {
            console.error('导出失败:', error);
            setAlert({ type: 'error', message: t('history.messages.export_failed') });
        }
    };

    // 从右键菜单删除指定记录
    const handleDeleteRecords = async (recordIds: number[]) => {
        try {
            await dbManager.deleteRecords(recordIds);
            await loadRecords(true);
            setAlert({ type: 'success', message: t('history.messages.delete_success', { count: recordIds.length }) });
        } catch (error) {
            console.error('删除失败:', error);
            setAlert({ type: 'error', message: t('history.messages.delete_failed') });
        }
    };

    // 导入记录
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text) as HistoryRecord[];

            if (!Array.isArray(data)) {
                throw new Error('无效的文件格式');
            }

            const result = await dbManager.importRecords(data);
            await loadRecords(true);
            setAlert({
                type: 'success',
                message: t('history.messages.import_success_message', { success: result.success, skipped: result.skipped, errors: result.errors }) // 导入完成：成功 {{success}} 条，跳过 {{skipped}} 条，失败 {{errors}} 条
            });
        } catch (error) {
            console.error('导入失败:', error);
            setAlert({ type: 'error', message: t('history.messages.import_failed', { message: error instanceof Error ? error.message : t('common.error_unknown') }) }); // 导入失败
        }

        // 重置文件输入
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 处理行双击事件
    const handleRowDoubleClick = (record: HistoryRecord) => {
        // 在过滤后的记录中找到索引
        const index = filteredRecords.findIndex(r => r.id === record.id);
        setSelectedRecord(record);
        setCurrentRecordIndex(index);
        setDetailModalOpen(true);
    };

    // 处理过滤后数据变化
    const handleFilteredDataChanged = (filtered: HistoryRecord[]) => {
        setFilteredRecords(filtered);
        // 如果当前有选中的记录，重新计算其在过滤后结果中的索引
        if (selectedRecord) {
            const newIndex = filtered.findIndex(r => r.id === selectedRecord.id);
            if (newIndex >= 0) {
                setCurrentRecordIndex(newIndex);
            } else {
                // 如果当前选中的记录在新的过滤列表中不存在，关闭详情
                setDetailModalOpen(false);
                setSelectedRecord(null);
                setCurrentRecordIndex(-1);
            }
        }
    };

    // 处理记录更新
    const handleRecordUpdate = (updatedRecord: HistoryRecord) => {
        setSelectedRecord(updatedRecord);
        // 同时更新records数组中的对应记录
        setRecords(prev => prev.map(record =>
            record.id === updatedRecord.id ? updatedRecord : record
        ));
    };

    // 关闭详情模态（仅关闭，不清空数据，等待退出动画结束）
    const handleCloseDetailModal = () => {
        setDetailModalOpen(false);
    };

    // 退出动画结束后清空记录
    const handleDetailExited = () => {
        setSelectedRecord(null);
        setCurrentRecordIndex(-1);
        setScrollToRecordId(undefined);
    };

    // 处理导航（上一个/下一个）
    const handleNavigate = (direction: 'prev' | 'next') => {
        if (currentRecordIndex === -1 || filteredRecords.length === 0) return;

        let newIndex: number;
        if (direction === 'prev') {
            newIndex = Math.max(0, currentRecordIndex - 1);
        } else {
            newIndex = Math.min(filteredRecords.length - 1, currentRecordIndex + 1);
        }

        if (newIndex !== currentRecordIndex && newIndex < filteredRecords.length) {
            const newRecord = filteredRecords[newIndex];
            setSelectedRecord(newRecord);
            setCurrentRecordIndex(newIndex);
            // 设置滚动目标
            setScrollToRecordId(newRecord.id);
        }
    };

    useEffect(() => {
        loadRecords();
    }, []);

    // 初始化过滤记录为所有记录，当 records 变化时同步更新
    useEffect(() => {
        // 如果过滤记录为空，或者记录数量发生变化（如导入新数据），或者记录内容发生变化，则更新过滤记录
        const shouldUpdate = filteredRecords.length === 0 ||
            filteredRecords.length !== records.length ||
            (records.length > 0 && filteredRecords.length > 0 &&
                records[0]?.id !== filteredRecords[0]?.id);

        if (shouldUpdate) {
            setFilteredRecords(records);
            // console.debug('更新过滤记录列表，记录数量:', records.length);
        }
    }, [records, filteredRecords]);

    if (loading && !hasData) {
        return (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 操作栏 */}
            <Stack spacing={1} sx={{ mb: 0.5 }} direction="row" justifyContent="space-between">
                <Stack direction="row" gap={1} alignItems="flex-end" justifyContent="space-between" sx={{ mb: 1, mt: 0 }}>
                    {/* 记录统计 */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, pl: .3 }}>
                        {selectedIds.length > 0 ? `${t('history.table.selected_count', { count: selectedIds.length })}` : t('history.table.records_count', { count: records.length })}
                    </Typography>
                </Stack>
                {/* 操作按钮 */}
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1}>
                        <Tooltip title={t('history.export')}>
                            <span>
                                <IconButton
                                    onClick={handleExport}
                                    color="primary"
                                    size="small"
                                    disabled={!hasData}
                                >
                                    <DownloadIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={t('history.import')}>
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadIcon />
                            </IconButton>
                        </Tooltip>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </Stack>

                    {selectedIds.length > 0 && (
                        <Button
                            variant="text"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            {t('history.toolbar.delete_selected')} ({selectedIds.length})
                        </Button>
                    )}
                </Stack>
            </Stack>

            {/* 警告信息 */}
            {alert && (
                <Alert
                    severity={alert.type}
                    onClose={() => setAlert(null)}
                    sx={{ mb: 2 }}
                >
                    {alert.message}
                </Alert>
            )}

            {/* 记录表格 */}
            {!hasData && searchKeyword.trim() === '' ?
                <Box
                    sx={{
                        p: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Stack spacing={2} alignItems="center">
                        <LottiePlayer
                            autoplay
                            loop
                            src="/lottie/coming-soon.json"
                            style={{ height: '180px', width: '180px' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                            {/* 空 */}
                            {t('history.messages.empty')}
                        </Typography>
                    </Stack>
                </Box>
                :
                <>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <React.Suspense fallback={
                            <HistoryTableSkeleton />
                        }>
                            <HistoryTable
                                records={records}
                                selectedIds={selectedIds}
                                onSelectionChanged={setSelectedIds}
                                onRowDoubleClick={handleRowDoubleClick}
                                scrollToRecordId={scrollToRecordId}
                                onFilteredDataChanged={handleFilteredDataChanged}
                                onRecallSuccess={() => loadRecords(true)}
                                onDeleteRecords={handleDeleteRecords}
                                onExportRecords={handleExportRecords}
                            />
                        </React.Suspense>
                    </Box>
                </>
            }

            {/* 删除确认对话框 */}
            <Dialog slots={{
                transition: GrowTransition,
            }}
                open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                {/* 确认删除 */}
                <DialogTitle>{t('history.confirm_delete')}</DialogTitle>
                {/* 确定要删除选中的 {{count}} 条记录吗？此操作不可撤销。 */}
                <DialogContent>
                    {t('history.confirm_delete_message', { count: selectedIds.length })}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)}>取消</Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {deleting ? t('common.processing') : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 详情模态框 */}
            <React.Suspense fallback={null}>
                <RecordDetailModal
                    record={selectedRecord}
                    open={detailModalOpen}
                    onClose={handleCloseDetailModal}
                    onExited={handleDetailExited}
                    currentIndex={currentRecordIndex}
                    totalCount={filteredRecords.length} // 使用过滤后的总数
                    onNavigate={handleNavigate}
                    onRecallSuccess={() => loadRecords(true)} // 撤回成功后刷新数据
                    onRecordUpdate={handleRecordUpdate} // 记录更新回调
                />
            </React.Suspense>
        </Box >
    );
} 