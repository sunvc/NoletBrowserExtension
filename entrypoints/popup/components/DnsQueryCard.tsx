import React, { useState, useRef } from 'react';
import {
    Box,
    Typography,
    Stack,
    Paper,
    TextField,
    Button,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
    Collapse,
    Chip,
    InputAdornment,
    Card
} from '@mui/material';
import DnsIcon from '@mui/icons-material/Dns';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTranslation } from 'react-i18next';
import { detectBrowser } from '../utils/platform';

interface DnsResult {
    ip: string;
    provider: string;
    success: boolean;
    error?: string;
}

interface DohProvider {
    name: string;
    url: string;
}

const getDohProviders = (t: any): DohProvider[] => [
    {
        name: t('settings.dns_query.providers.tencent'),
        url: 'https://doh.pub/dns-query'
    },
    {
        name: t('settings.dns_query.providers.aliyun_primary'),
        url: 'https://223.5.5.5/resolve'
    },
    {
        name: t('settings.dns_query.providers.aliyun_secondary'),
        url: 'https://223.6.6.6/resolve'
    },
    {
        name: t('settings.dns_query.providers.cloudflare'),
        url: 'https://cloudflare-dns.com/dns-query'
    },
    {
        name: t('settings.dns_query.providers.cloudflare_backup'),
        url: 'https://1.1.1.1/dns-query'
    },
    {
        name: t('settings.dns_query.providers.google'),
        url: 'https://dns.google/resolve'
    }
];

interface DnsQueryCardProps {
    onToast: (message: string) => void;
    onError: (error: string) => void;
}

export default function DnsQueryCard({ onToast, onError }: DnsQueryCardProps) {
    const { t } = useTranslation();
    const DOH_PROVIDERS = getDohProviders(t);
    const [domain, setDomain] = useState('wzs.app');
    const [isQuerying, setIsQuerying] = useState(false);
    const [results, setResults] = useState<DnsResult[]>([]);
    const [showGuide, setShowGuide] = useState(false);
    const [showDohGuide, setShowDohGuide] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    const browserType = detectBrowser();

    const getChipColor = (provider: string) => {
        const colors = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
        let hash = 0;
        for (let i = 0; i < provider.length; i++) {
            hash = provider.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // 执行 DoH 查询
    const performDohQuery = async (domain: string, provider: DohProvider, signal: AbortSignal): Promise<DnsResult> => {
        try {
            // 构建查询URL
            const url = `${provider.url}?name=${encodeURIComponent(domain)}&type=A`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/dns-json'
                },
                signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.Answer && data.Answer.length > 0) {
                // 查找A记录
                const aRecord = data.Answer.find((record: any) => record.type === 1);
                if (aRecord) {
                    return {
                        ip: aRecord.data,
                        provider: provider.name,
                        success: true
                    };
                }
            }

            return {
                ip: '',
                provider: provider.name,
                success: false,
                error: t('settings.dns_query.messages.no_a_record')
            };
        } catch (error) {
            // 检查是否是取消错误
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    ip: '',
                    provider: provider.name,
                    success: false,
                    error: '查询超时'
                };
            }

            return {
                ip: '',
                provider: provider.name,
                success: false,
                error: error instanceof Error ? error.message : t('settings.dns_query.messages.query_failed', { error: '未知错误' })
            };
        }
    };

    // 并发查询所有提供商（3秒超时）
    const handleQuery = async (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!domain.trim()) {
            onError(t('settings.dns_query.messages.domain_required'));
            return;
        }

        setIsQuerying(true);
        setResults([]);

        // AbortController 用于超时控制
        const abortController = new AbortController();

        // 3秒超时
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, 3000);

        try {
            // 并发查询所有提供商
            const promises = DOH_PROVIDERS.map(provider =>
                performDohQuery(domain.trim(), provider, abortController.signal)
            );

            // 使用Promise.allSettled等待所有查询完成（无论成功或失败）
            const settledResults = await Promise.allSettled(promises);

            // 提取所有结果（包括失败的）
            const allResults = settledResults.map(result =>
                result.status === 'fulfilled' ? result.value : {
                    ip: '',
                    provider: 'Unknown',
                    success: false,
                    error: '查询失败'
                }
            );

            // 只保留成功的结果
            const successResults = allResults.filter(r => r.success);
            setResults(successResults);

            if (successResults.length > 0) {
                onToast(t('settings.dns_query.messages.batch_success', { count: successResults.length }));

                // 查询成功后滚动到结果区域居中位置
                setTimeout(() => {
                    if (resultsRef.current) {
                        resultsRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }, 500);
            } else {
                onError(t('settings.dns_query.messages.batch_failed'));
            }
        } catch (error) {
            onError(t('settings.dns_query.messages.batch_error', { error: error instanceof Error ? error.message : '未知错误' }));
        } finally {
            // 清除超时定时器
            clearTimeout(timeoutId);
            setIsQuerying(false);
        }
    };

    // 复制IP地址
    const handleCopyIp = async (ip: string) => {
        try {
            await navigator.clipboard.writeText(ip);
            onToast(t('settings.dns_query.messages.ip_copied'));
        } catch (error) {
            onError(t('settings.dns_query.messages.copy_failed'));
        }
    };

    // 复制hosts条目
    const handleCopyHostsEntry = async (ip: string, domain: string) => {
        try {
            const hostsEntry = `${ip}    ${domain}`;
            await navigator.clipboard.writeText(hostsEntry);
            onToast(t('settings.dns_query.messages.hosts_copied'));
        } catch (error) {
            onError(t('settings.dns_query.messages.copy_failed'));
        }
    };

    // 按IP分组结果（results已经只包含成功的结果）
    const getGroupedResults = () => {
        const grouped: { [ip: string]: string[] } = {};

        results.forEach(result => {
            if (!grouped[result.ip]) {
                grouped[result.ip] = [];
            }
            grouped[result.ip].push(result.provider);
        });

        return grouped;
    };

    // 检查是否可能存在DNS污染
    const hasPotentialPollution = () => {
        const grouped = getGroupedResults();
        return Object.keys(grouped).length > 1;
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Stack spacing={3}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DnsIcon />
                    {t('settings.dns_query.title')}
                </Typography>

                {/* 输入区域 */}
                <Stack gap={2} sx={{ py: 1.2 }}>
                    <form onSubmit={handleQuery}>
                        <TextField
                            label={t('settings.dns_query.domain_label')}
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder={t('settings.dns_query.domain_placeholder')}
                            fullWidth
                            size="small"
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={handleQuery}>
                                                {isQuerying ? <CircularProgress size={16} /> : <SearchIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }
                            }}
                        />
                    </form>
                </Stack>

                {/* 查询结果 */}
                {results.length > 0 ? (
                    <Box ref={resultsRef}>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('settings.dns_query.results_title')}
                        </Typography>
                        <Stack spacing={2}>
                            {Object.entries(getGroupedResults()).map(([ip, providers]) => (
                                <Box
                                    key={ip}
                                    sx={{
                                        p: 2,
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1
                                    }}
                                >
                                    <Stack spacing={1}>
                                        {/* HOST条目格式展示 */}
                                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '1rem',
                                                    fontWeight: 'bold',
                                                    letterSpacing: '0.5px'
                                                }}
                                            >
                                                {ip}    {domain}
                                            </Typography>
                                            <Stack direction="row" spacing={0.5}>
                                                <Tooltip title={t('settings.dns_query.copy_ip_tooltip')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleCopyIp(ip)}
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('settings.dns_query.copy_hosts_tooltip')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleCopyHostsEntry(ip, domain)}
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>

                                        {/* DoH 提供商列表 */}
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                                {t('settings.dns_query.providers_label')}:
                                            </Typography>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                {providers.map((provider, index) => (
                                                    <Chip
                                                        key={`${provider}-${index}`}
                                                        label={provider}
                                                        size="small"
                                                        color={getChipColor(provider)}
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                ) : (
                    <Typography variant="caption" sx={{ px: 1.2 }} gutterBottom>
                        {t('settings.dns_query.help')}
                    </Typography>
                )}
                {/* DNS 查询到不同 IP 地址的警告 */}
                {hasPotentialPollution() && (
                    <Alert severity="warning" icon={<WarningIcon />}>
                        <Typography variant="body2" gutterBottom>
                            {t('settings.dns_query.pollution_warning')}
                        </Typography>
                        <Typography variant="body2">
                            {t('settings.dns_query.pollution_suggestion')}
                        </Typography>
                    </Alert>
                )}

                {/* Hosts 文件修改指南 */}
                <Box sx={{ opacity: 0.8 }}>
                    <Button
                        onClick={() => setShowGuide(!showGuide)}
                        startIcon={showGuide ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        size="small"
                        color="inherit"
                    >
                        {t('settings.dns_query.hosts_guide_title')}
                    </Button>
                    <Collapse in={showGuide}>
                        <Card sx={{ p: 1.5, my: 1 }}>
                            <Typography variant="body2" component="div" gutterBottom>
                                <strong>{t('settings.dns_query.hosts_guide_windows')}</strong>
                                <br />
                                {t('settings.dns_query.hosts_guide_windows_step1')}
                                <br />
                                {t('settings.dns_query.hosts_guide_windows_step2')}
                                <br />
                                {t('settings.dns_query.hosts_guide_windows_step3')}
                                <br />
                                {t('settings.dns_query.hosts_guide_windows_step4')}
                            </Typography>
                            <Typography variant="body2" component="div">
                                <strong>{t('settings.dns_query.hosts_guide_unix')}</strong>
                                <br />
                                {t('settings.dns_query.hosts_guide_unix_step1')}
                                <br />
                                {t('settings.dns_query.hosts_guide_unix_step2')}
                                <br />
                                {t('settings.dns_query.hosts_guide_unix_step3')}
                                <br />
                                {t('settings.dns_query.hosts_guide_unix_step4')}
                            </Typography>
                        </Card>
                    </Collapse>
                </Box>

                {/* DNS over HTTPS (DoH) 配置指南 */}
                <Box sx={{ opacity: 0.8 }}>
                    <Button
                        onClick={() => setShowDohGuide(!showDohGuide)}
                        startIcon={showDohGuide ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        size="small"
                        color="inherit"
                    >
                        {t('settings.dns_query.doh_guide_title')}
                    </Button>
                    <Collapse in={showDohGuide}>
                        <Card sx={{ p: 1.5, my: 1 }}>
                            {(browserType === 'chrome' || browserType === 'edge') && (
                                <Typography variant="body2" component="div" gutterBottom>
                                    <strong>{t(`settings.dns_query.doh_${browserType}_title`)}</strong>
                                    <br />
                                    {t('settings.dns_query.doh_chrome_step1')}
                                    <br />
                                    {t('settings.dns_query.doh_chrome_step2')}
                                    <br />
                                    {t('settings.dns_query.doh_chrome_step3')}
                                    <br />
                                    {t('settings.dns_query.doh_chrome_step4')}
                                    <br />
                                    {t('settings.dns_query.doh_chrome_step5')}
                                    <br />
                                    {t('settings.dns_query.doh_chrome_step6')}
                                </Typography>
                            )}

                            {browserType === 'firefox' && (
                                <Typography variant="body2" component="div" gutterBottom>
                                    <strong>{t('settings.dns_query.doh_firefox_title')}</strong>
                                    <br />
                                    {t('settings.dns_query.doh_firefox_step1')}
                                    <br />
                                    {t('settings.dns_query.doh_firefox_step2')}
                                    <br />
                                    {t('settings.dns_query.doh_firefox_step3')}
                                    <br />
                                    {t('settings.dns_query.doh_firefox_step4')}
                                    <br />
                                    {t('settings.dns_query.doh_firefox_step5')}
                                    <br />
                                    {t('settings.dns_query.doh_firefox_step6')}
                                    <br />
                                    {t('settings.dns_query.doh_firefox_step7')}
                                </Typography>
                            )}

                            <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>{t('settings.dns_query.doh_providers_title')}</strong>
                                <br />
                                • {t('settings.dns_query.doh_provider_tencent')}
                                <br />
                                • {t('settings.dns_query.doh_provider_cloudflare')}
                            </Typography>
                        </Card>
                    </Collapse>
                </Box>
            </Stack>
        </Paper>
    );
}
