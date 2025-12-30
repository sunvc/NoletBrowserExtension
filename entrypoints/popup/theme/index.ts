import { createTheme, ThemeOptions } from '@mui/material/styles';
import { zhCN, enUS } from '@mui/material/locale';

declare module '@mui/material/styles' {
    interface Theme {
        customColors: {
            gradients: {
                primary: string;
                secondary: string;
            };
            shadows: {
                primary: string;
                secondary: string;
            };
        };
    }

    interface ThemeOptions {
        customColors?: {
            gradients?: {
                primary: string;
                secondary: string;
            };
            shadows?: {
                primary: string;
                secondary: string;
            };
        };
    }
}

// 通用主题配置
const getCommonTheme = (mode: 'light' | 'dark'): ThemeOptions => ({
    typography: {
        fontFamily: [
            '-apple-system',
            'Roboto',
            'Arial',
            'sans-serif'
        ].join(','),
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.3,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
            lineHeight: 1.4,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
            lineHeight: 1.4,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            lineHeight: 1.5,
        },
        h6: {
            fontSize: '1.1rem',
            fontWeight: 500,
            lineHeight: 1.5,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.43,
        },
        caption: {
            fontSize: '0.75rem',
            lineHeight: 1.66,
        },
    },
    shape: {
        borderRadius: 16,
    },
    spacing: 8,
    components: {
        // CssBaseline组件样式 
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    margin: 0,
                    padding: 0,
                    overflow: 'hidden',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: mode === 'dark' ? '#2b2b2b' : '#f1f1f1',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: mode === 'dark' ? '#555' : '#c1c1c1',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: mode === 'dark' ? '#666' : '#a8a8a8',
                        },
                    },
                },
                '*': {
                    boxSizing: 'border-box',
                    outline: 'none',
                    '&:focus-visible': {
                        outline: '2px solid #1976d2',
                        outlineOffset: '2px',
                    },
                },
            },
        },
        // 按钮组件样式 
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: mode === 'dark'
                            ? '0 1px 4px rgba(144, 202, 249, 0.15)'
                            : '0 1px 4px rgba(25, 118, 210, 0.1)',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: mode === 'dark'
                            ? '0 2px 6px rgba(144, 202, 249, 0.2)'
                            : '0 2px 6px rgba(25, 118, 210, 0.15)',
                    },
                },
                outlined: {
                    '&.MuiButton-outlinedPrimary': {
                        '&:hover': {
                            backgroundColor: mode === 'dark'
                                ? 'rgba(144, 202, 249, 0.08)'
                                : 'rgba(25, 118, 210, 0.04)',
                            borderColor: mode === 'dark' ? '#90caf9' : '#1976d2',
                        },
                    },
                    '&.MuiButton-outlinedSecondary': {
                        '&:hover': {
                            backgroundColor: mode === 'dark'
                                ? 'rgba(244, 143, 177, 0.08)'
                                : 'rgba(220, 0, 78, 0.04)',
                            borderColor: mode === 'dark' ? '#f48fb1' : '#dc004e',
                        },
                    },
                    '&.MuiButton-outlinedError': {
                        '&:hover': {
                            backgroundColor: mode === 'dark'
                                ? 'rgba(244, 67, 54, 0.08)'
                                : 'rgba(211, 47, 47, 0.04)',
                            borderColor: mode === 'dark' ? '#f44336' : '#d32f2f',
                        },
                    },
                    '&.MuiButton-outlinedWarning': {
                        '&:hover': {
                            backgroundColor: mode === 'dark'
                                ? 'rgba(255, 152, 0, 0.08)'
                                : 'rgba(237, 108, 2, 0.04)',
                            borderColor: mode === 'dark' ? '#ff9800' : '#ed6c02',
                        },
                    },
                    '&.MuiButton-outlinedInfo': {
                        '&:hover': {
                            backgroundColor: mode === 'dark'
                                ? 'rgba(41, 182, 246, 0.08)'
                                : 'rgba(2, 136, 209, 0.04)',
                            borderColor: mode === 'dark' ? '#29b6f6' : '#0288d1',
                        },
                    },
                    '&.MuiButton-outlinedSuccess': {
                        '&:hover': {
                            backgroundColor: mode === 'dark'
                                ? 'rgba(102, 187, 106, 0.08)'
                                : 'rgba(46, 125, 50, 0.04)',
                            borderColor: mode === 'dark' ? '#66bb6a' : '#2e7d32',
                        },
                    },
                },
                // 小尺寸按钮
                sizeSmall: {
                    borderRadius: 12,
                },
                // 中等尺寸按钮
                sizeMedium: {
                    borderRadius: 14,
                    // 圆形按钮(fab)使用50%圆角
                    '&.MuiButton-fab': {
                        borderRadius: '50%',
                    },
                },
                // 大尺寸按钮
                sizeLarge: {
                    borderRadius: 14,
                },
            },
        },
        // 纸张组件样式 
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    borderRadius: 14,
                    border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
                },
                elevation1: {
                    boxShadow: mode === 'dark'
                        ? '0 1px 2px rgba(0, 0, 0, 0.3)'
                        : '0 1px 2px rgba(0, 0, 0, 0.08)',
                },
                elevation2: {
                    boxShadow: mode === 'dark'
                        ? '0 1px 3px rgba(0, 0, 0, 0.35)'
                        : '0 1px 3px rgba(0, 0, 0, 0.1)',
                },
            },
        },
        // 应用栏组件样式 
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    padding: '2px 4px',
                    borderRadius: 0,
                    borderBottom: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.12)'
                        : '1px solid rgba(0, 0, 0, 0.12)',
                },
            },
        },
        // 卡片组件样式 
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
                    boxShadow: mode === 'dark'
                        ? '0 1px 4px rgba(0, 0, 0, 0.15)'
                        : '0 1px 4px rgba(0, 0, 0, 0.06)',
                },
            },
        },
        // 输入框组件样式 
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 14,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? '#90caf9' : '#1976d2',
                        },
                    },
                },
            },
            defaultProps: {
                slotProps: {
                    htmlInput: {
                        spellCheck: false, // 禁用拼写检查
                        autoComplete: 'off',
                    },
                },
            },
        },
        // 切换按钮组件样式 
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    border: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.23)'
                        : '1px solid rgba(0, 0, 0, 0.23)',
                    '&.Mui-selected': {
                        backgroundColor: mode === 'dark' ? 'rgba(144, 202, 249, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                        color: mode === 'dark' ? '#90caf9' : '#1976d2',
                        '&:hover': {
                            backgroundColor: mode === 'dark' ? 'rgba(144, 202, 249, 0.3)' : 'rgba(25, 118, 210, 0.2)',
                        },
                    },
                },
            },
        },
        // 切换按钮组样式 
        MuiToggleButtonGroup: {
            styleOverrides: {
                root: {
                    borderRadius: '14px',
                    padding: '3px',
                    backgroundColor: mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.01)',
                    border: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.12)'
                        : '1px solid rgba(0, 0, 0, 0.12)',
                    gap: '4px',
                    '& .MuiToggleButton-root': {
                        border: 'none',
                        borderRadius: 0,
                        padding: '6px 10px',
                        '&:first-of-type': {
                            borderRadius: '14px 0px 0px 14px',
                        },
                        '&:last-of-type': {
                            borderRadius: '0px 14px 14px 0px',
                        },
                        '&.Mui-selected': {
                            backgroundColor: mode === 'dark' ? 'rgba(144, 202, 249, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                            color: mode === 'dark' ? '#90caf9' : '#1976d2',
                        },
                    },
                },
            },
        },
        // 按钮组样式 
        MuiButtonGroup: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    padding: '2px',
                    backgroundColor: mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                    border: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.12)'
                        : '1px solid rgba(0, 0, 0, 0.12)',
                    gap: '2px',
                    boxShadow: 'none',
                    '& .MuiButton-root': {
                        border: 'none',
                        borderRadius: 12,
                        boxShadow: 'none',
                        '&:first-of-type': {
                            borderRadius: 12,
                        },
                        '&:last-of-type': {
                            borderRadius: 12,
                        },
                        '&:not(:last-of-type)': {
                            borderRadius: 12,
                        },
                        '&:hover': {
                            boxShadow: 'none',
                            backgroundColor: mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                        },
                    },
                },
                grouped: {
                    minWidth: 'auto',
                },
            },
        },
        // 菜单组件样式 
        MuiMenu: {
            styleOverrides: {
                paper: {
                    borderRadius: 14,
                    boxShadow: mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.12)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                },
            },
        },
        // 弹出层组件样式 
        MuiPopover: {
            styleOverrides: {
                paper: {
                    borderRadius: 14,
                    boxShadow: mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.12)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                },
            },
        },
        // 选择框组件样式  
        MuiSelect: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                },
            },
        },
        // 菜单项组件样式 
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    margin: '6px 2px', // 选项间距
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    '&:hover': {
                        backgroundColor: mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: mode === 'dark'
                            ? 'rgba(144, 202, 249, 0.2)'
                            : 'rgba(25, 118, 210, 0.1)',
                        '&:hover': {
                            backgroundColor: mode === 'dark'
                                ? 'rgba(144, 202, 249, 0.3)'
                                : 'rgba(25, 118, 210, 0.15)',
                        },
                    },
                },
            },
        },
        // 列表组件样式 
        MuiList: {
            styleOverrides: {
                root: {
                    padding: '0px 6px',
                },
            },
        },
        // 工具提示组件样式 
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 12,
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    maxWidth: 300,
                    backgroundColor: mode === 'dark'
                        ? 'rgba(30, 30, 30, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                    color: mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.9)'
                        : 'rgba(0, 0, 0, 0.87)',
                    border: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.2)'
                        : '1px solid rgba(0, 0, 0, 0.15)',
                    boxShadow: mode === 'dark'
                        ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)'
                        : '0 4px 12px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    backgroundImage: mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
                },
                // 箭头样式
                arrow: {
                    color: mode === 'dark'
                        ? 'rgba(30, 30, 30, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                    '&::before': {
                        border: mode === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.2)'
                            : '1px solid rgba(0, 0, 0, 0.15)',
                        boxShadow: mode === 'dark'
                            ? '0 2px 6px rgba(0, 0, 0, 0.3)'
                            : '0 2px 6px rgba(0, 0, 0, 0.1)',
                    },
                },
                // 不同位置的样式调整
                tooltipPlacementTop: {
                    marginBottom: '8px !important',
                },
                tooltipPlacementBottom: {
                    marginTop: '8px !important',
                },
                tooltipPlacementLeft: {
                    marginRight: '8px !important',
                },
                tooltipPlacementRight: {
                    marginLeft: '8px !important',
                },
            },
        },
        // 警告框/提醒框样式 
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                },
            },
        },
        // 对话框样式 
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 12,
                },
            },
        },
        // Snackbar样式 
        MuiSnackbar: {
            styleOverrides: {
                root: {
                    '& .MuiSnackbarContent-root': {
                        borderRadius: 10,
                    },
                },
            },
        },
        // 导航栏相关组件样式 
        MuiTabs: {
            styleOverrides: {
                root: {
                    '& .MuiTabs-indicator': {
                        backgroundColor: mode === 'dark' ? '#90caf9' : '#1976d2',
                    },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 0,
                    '&:hover': {
                        backgroundColor: mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                    },
                },
            },
        },
    },
});

// 浅色主题配置
const lightTheme = createTheme({
    ...getCommonTheme('light'),
    palette: {
        mode: 'light',
        primary: {
            main: '#6200ea', // Deep Purple
            light: '#9d46ff',
            dark: '#0a00b6',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#00bfa5', // Teal
            light: '#5df2d6',
            dark: '#008e76',
            contrastText: '#000000',
        },
        background: {
            default: '#f3f4f6',
            paper: '#ffffff',
        },
        text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
        },
        divider: 'rgba(0, 0, 0, 0.08)',
        action: {
            hover: 'rgba(98, 0, 234, 0.04)',
            selected: 'rgba(98, 0, 234, 0.08)',
        },
    },
    customColors: {
        gradients: {
            primary: 'linear-gradient(135deg, #6200ea 0%, #9d46ff 100%)',
            secondary: 'linear-gradient(135deg, #00bfa5 0%, #5df2d6 100%)',
        },
        shadows: {
            primary: '0 4px 12px rgba(98, 0, 234, 0.2)',
            secondary: '0 4px 12px rgba(0, 191, 165, 0.2)',
        },
    },
});

// 深色主题配置
const darkTheme = createTheme({
    ...getCommonTheme('dark'),
    palette: {
        mode: 'dark',
        primary: {
            main: '#b388ff', // Light Deep Purple
            light: '#e7b9ff',
            dark: '#7c52cb',
            contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        secondary: {
            main: '#64ffda', // Light Teal
            light: '#9effff',
            dark: '#14cba8',
            contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
        divider: 'rgba(255, 255, 255, 0.08)',
        action: {
            hover: 'rgba(255, 255, 255, 0.08)',
            selected: 'rgba(255, 255, 255, 0.16)',
        },
    },
    customColors: {
        gradients: {
            primary: 'linear-gradient(135deg, #b388ff 0%, #7c52cb 100%)',
            secondary: 'linear-gradient(135deg, #64ffda 0%, #14cba8 100%)',
        },
        shadows: {
            primary: '0 4px 12px rgba(179, 136, 255, 0.2)',
            secondary: '0 4px 12px rgba(100, 255, 218, 0.2)',
        },
    },
});

// 创建主题
export const createAppTheme = (mode: 'light' | 'dark', locale: 'zh' | 'en' = 'zh') => {
    const baseTheme = mode === 'light' ? lightTheme : darkTheme;
    const muiLocale = locale === 'zh' ? zhCN : enUS;

    return createTheme(baseTheme, muiLocale);
};

// 浅色和深色主题
export { lightTheme, darkTheme }; 