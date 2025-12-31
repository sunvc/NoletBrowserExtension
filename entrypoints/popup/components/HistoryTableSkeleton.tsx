import {
    Box,
    Paper,
    TextField,
    useTheme,
    Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';

interface HistoryTableSkeletonProps {
    onSearch?: (searchText: string) => void;
}

export default function HistoryTableSkeleton({ }: HistoryTableSkeletonProps) {
    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <>
            {/* 搜索框 */}
            <Box sx={{ border: 'none', boxShadow: 'lg', }}>
                <TextField
                    sx={{ width: '100%', pt: 1, pb: 1.5 }}
                    size="small"
                    placeholder={t('history.toolbar.search_placeholder')}
                    disabled
                    autoFocus
                    slotProps={{
                        input: {
                            startAdornment: <SearchIcon sx={{ mr: 1 }} fontSize="small" />,
                        }
                    }}
                />
            </Box>

            {/* 表格骨架屏 */}
            <Paper
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                }}
            >
                <Box
                    sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        backgroundColor: (theme) => theme.customColors.table.headerBackground,
                    }}
                >
                    <Stack direction="row" gap={1}>
                        <Stack direction="row" gap={1}>
                            <Box width="45px" height="40px" sx={{ borderRight: `1px solid ${theme.palette.divider}` }} />
                        </Stack>
                    </Stack>
                </Box>

                <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        flex: 1,
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        paddingBottom: '41px',
                    }}
                >
                    Loading...
                </Stack>
            </Paper>
        </>
    );
}
