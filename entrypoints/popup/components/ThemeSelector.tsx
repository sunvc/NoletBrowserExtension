import React from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useTranslation } from 'react-i18next';
import { ThemeMode } from '../types';

interface ThemeSelectorProps {
    themeMode: ThemeMode;
    onThemeChange: (mode: ThemeMode) => void;
}

export default function ThemeSelector({ themeMode, onThemeChange }: ThemeSelectorProps) {
    const { t } = useTranslation();

    return (
        <ToggleButtonGroup
            value={themeMode}
            exclusive
            onChange={(event, newMode) => {
                if (newMode !== null) {
                    onThemeChange(newMode);
                }
            }}
            aria-label="theme mode"
            size="small"
        >
            <ToggleButton value="light" aria-label="light mode" style={{ outline: 'none' }}>
                <LightModeIcon sx={{ mr: 1 }} fontSize="small" />
                {/* 浅色 */}
                {t('settings.theme.light')}
            </ToggleButton>
            <ToggleButton value="dark" aria-label="dark mode" style={{ outline: 'none' }}>
                <DarkModeIcon sx={{ mr: 1 }} fontSize="small" />
                {/* 深色 */}
                {t('settings.theme.dark')}
            </ToggleButton>
            <ToggleButton value="system" aria-label="system mode" style={{ outline: 'none' }}>
                <SettingsBrightnessIcon sx={{ mr: 1 }} fontSize="small" />
                {/* 跟随系统 */}
                {t('settings.theme.system')}
            </ToggleButton>
        </ToggleButtonGroup>
    );
} 