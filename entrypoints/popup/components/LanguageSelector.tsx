import { FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getSupportedLanguages } from '../utils/languages';

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    // 使用统一的语言列表
    const supportedLanguages = getSupportedLanguages();

    const handleLanguageChange = async (event: SelectChangeEvent<string>) => {
        const newLanguage = event.target.value;

        try {
            // 切换语言
            await i18n.changeLanguage(newLanguage);
            // 保存语言设置到storage
            await browser.storage.local.set({ language: newLanguage });
        } catch (error) {
            console.error('切换语言失败:', error);
        }
    };

    return (
        <FormControl size="small" sx={{ minWidth: 140, width: '100%' }}>
            <Select
                value={i18n.language || 'zh-CN'}
                onChange={handleLanguageChange}
                variant="outlined"
                sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'divider',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                    },
                }}
                fullWidth
            >
                {supportedLanguages.map((language) => (
                    <MenuItem key={language.code} value={language.code}>
                        {language.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
} 