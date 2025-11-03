import React from 'react';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import { Device } from '../types';

interface DeviceAutocompleteProps {
    devices: Device[];
    selectedDevice: Device | null;
    onDeviceChange: (device: Device | null) => void;
    label?: string;
    placeholder?: string;
}

export default function DeviceAutocomplete({
    devices,
    selectedDevice,
    onDeviceChange,
    label = '选择设备',
    placeholder = '请选择一个设备'
}: DeviceAutocompleteProps) {
    return (
        <Autocomplete
            options={devices}
            value={selectedDevice}
            size="small"
            onChange={(_, newValue) => onDeviceChange(newValue)}
            getOptionLabel={(option) => option.alias}
            renderOption={(props, option) => (
                <Box component="li" {...props}>
                    <div>
                        <Typography variant="body1" component="div">{option.alias}</Typography>
                        <Typography variant="body2" color="text.secondary" fontSize="0.75rem" component="div">
                            {option.apiURL}
                        </Typography>
                    </div>
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    variant="outlined"
                    fullWidth
                />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="暂无设备，请先在配置页面添加设备"
        />
    );
} 