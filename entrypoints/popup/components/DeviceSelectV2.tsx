import React, { useState } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    SelectChangeEvent,
    Stack,
    Divider,
    OutlinedInput,
    Checkbox,
    ListItemText,
    FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { Device } from '../types';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP + 16,
            width: 'calc(100% - 120px)',
        },
        sx: {
            display: 'flex',
            flexDirection: 'column',
            '& .MuiList-root': {
                flex: '1 1 auto',
                overflow: 'auto'
            }
        }
    }
};

interface DeviceSelectV2Props {
    devices: Device[];
    selectedDevices: Device[];
    onDevicesChange: (devices: Device[]) => void;
    onAddClick: () => void;
    label?: string;
    placeholder?: string;
    showLabel?: boolean;
    defaultDevice?: Device | null;
}

export default function DeviceSelectV2({
    devices,
    selectedDevices,
    onDevicesChange,
    onAddClick,
    label = '选择设备',
    placeholder = '请选择设备',
    showLabel = true,
    defaultDevice = null
}: DeviceSelectV2Props) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const handleChange = (event: SelectChangeEvent<string[]>) => {
        const selectedIds = typeof event.target.value === 'string'
            ? event.target.value.split(',')
            : event.target.value;

        const selectedDevicesList = devices.filter(device => selectedIds.includes(device.id));
        onDevicesChange(selectedDevicesList);
    };

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(false);
        onAddClick();
    };

    // 获取选中设备的ID列表
    const selectedDeviceIds = selectedDevices.map(device => device.id);

    // 渲染选中设备的显示文本
    const renderValue = (selected: string[]) => {
        if (selected.length === 0) {
            return <em>{t('push.select_device')}</em>;
        }
        const selectedNames = devices
            .filter(device => selected.includes(device.id))
            .map(device => device.alias);
        return selectedNames.join(', ');
    };

    return (
        <FormControl fullWidth variant="outlined" size="small">
            {showLabel && <InputLabel
                shrink
                sx={{
                    backgroundColor: 'background.paper',
                    px: 0.5,
                    '&.MuiInputLabel-shrink': {
                        transform: 'translate(14px, -9px) scale(0.75)'
                    }
                }}
            >
                {/* 目标设备 */}
                {t('push.target_device')}
            </InputLabel>}
            <Select
                multiple
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                value={selectedDeviceIds}
                onChange={handleChange}
                input={<OutlinedInput label={showLabel ? t('push.target_device') : undefined} notched />}
                renderValue={renderValue}
                displayEmpty
                MenuProps={MenuProps}
                sx={{ py: 0.5, }}
            >
                {devices.length === 0 ?
                    <MenuItem disabled value="">
                        <em>{t('push.select_device')}</em>
                    </MenuItem> :
                    <Typography color="text.secondary" variant="overline" sx={{
                        px: 1, pt: 1, userSelect: 'none'
                    }}>
                        {/* 选择要发送推送的设备 */}
                        {t('push.select_device')}
                    </Typography>}
                {devices.map((device) => {
                    const isDefault = defaultDevice?.id === device.id;
                    return (
                        <MenuItem key={device.id} value={device.id}>
                            <Checkbox checked={selectedDeviceIds.includes(device.id)} sx={{ mr: 0.5 }} />
                            <Stack sx={{ width: '100%' }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                                    <Typography
                                        variant="body1"
                                    // sx={{
                                    //     color: isDefault ? 'primary.main' : 'text.primary'
                                    // }}
                                    >
                                        {device.alias}
                                    </Typography>
                                    {isDefault &&
                                        <Typography variant="caption" sx={{ fontSize: '0.625rem' }}
                                            color="text.secondary">{t('common.default')}</Typography>}
                                </Stack>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontSize: '0.75rem',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        wordBreak: 'break-all',
                                        whiteSpace: 'nowrap',
                                        fontWeight: 'normal'
                                    }}
                                >
                                    {device.deviceKey}
                                </Typography>
                            </Stack>
                        </MenuItem>
                    );
                })}
                <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    <Divider />
                    <MenuItem
                        onClick={handleAddClick}
                        sx={{
                            justifyContent: 'center',
                            p: 0,
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="center"
                            sx={{ p: 0, color: 'primary.main' }}>
                            <AddIcon sx={{ mr: 1 }} />
                            {/* 添加新设备 */}
                            {t('device.add')}
                        </Stack>
                    </MenuItem>
                </Box>
            </Select>
            <FormHelperText
                sx={{
                    color: 'text.secondary',
                    userSelect: 'none',
                    minHeight: '1.25em',
                    display: 'block',
                    opacity: 0.6,
                }}
            >
                {selectedDevices.length > 1 ? `${t('push.select_device_length', { count: selectedDevices.length })}` : t('push.select_device_helper')}
            </FormHelperText>

        </FormControl>
    );
}
