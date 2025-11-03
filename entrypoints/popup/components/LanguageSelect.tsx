import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemText, Tooltip } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useTranslation } from 'react-i18next';
import { getSupportedLanguages } from '../utils/languages';

export default function LanguageSelect() {
    const { i18n, t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    // 获取支持的语言列表
    const supportedLanguages = getSupportedLanguages();

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageSelect = async (languageCode: string) => {
        try {
            // 切换语言
            await i18n.changeLanguage(languageCode);
            // 保存语言设置到 storage
            await browser.storage.local.set({ language: languageCode });
            handleClose();
        } catch (error) {
            console.error('切换语言失败:', error);
        }
    };

    return (
        <>
            <Tooltip title={t('settings.language.title')} placement="left">
                <IconButton
                    style={{ outline: 'none' }}
                    onClick={handleClick}
                    size="small"
                    sx={{ ml: 1 }}
                    aria-controls={open ? 'language-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    <TranslateIcon sx={{ color: 'white' }} />
                </IconButton>
            </Tooltip>
            <Menu
                id="language-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {supportedLanguages.map((language) => (
                    <MenuItem
                        key={language.code}
                        selected={i18n.language === language.code}
                        onClick={() => handleLanguageSelect(language.code)}
                    >
                        <ListItemText>{language.label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
} 