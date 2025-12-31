import { ThemeOptions } from '@mui/material/styles';

// 浅色模式配色
export const lightPalette: ThemeOptions['palette'] = {
    mode: 'light',
    primary: {
        main: '#EA580C', // Orange 600
        light: '#F97316',
        dark: '#C2410C',
        contrastText: '#ffffff',
    },
    secondary: {
        main: '#D97706', // Amber 600
        light: '#F59E0B',
        dark: '#B45309',
        contrastText: '#ffffff',
    },
    background: {
        default: '#fafafa', // Gray 50
        paper: '#ffffff',
    },
    text: {
        primary: '#111827', // Gray 900
        secondary: '#374151', // Gray 700
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    action: {
        hover: 'rgba(234, 88, 12, 0.04)',
        selected: 'rgba(234, 88, 12, 0.08)',
    },
};

// 深色模式配色
export const darkPalette: ThemeOptions['palette'] = {
    mode: 'dark',
    primary: {
        main: '#FB923C', // Orange 400
        light: '#FDBA74',
        dark: '#EA580C',
        contrastText: '#000000',
    },
    secondary: {
        main: '#FBBF24', // Amber 400
        light: '#FCD34D',
        dark: '#D97706',
        contrastText: '#000000',
    },
    background: {
        default: '#000000', // Pure Black
        paper: '#121212', // Material Dark
    },
    text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.85)',
    },
    divider: 'rgba(255, 255, 255, 0.15)',
    action: {
        hover: 'rgba(251, 146, 60, 0.08)',
        selected: 'rgba(251, 146, 60, 0.16)',
        disabledBackground: 'rgba(255, 255, 255, 0.05)',
        disabled: 'rgba(255, 255, 255, 0.3)',
    },
};

// 自定义颜色配置
export const customColors = {
    light: {
        gradients: {
            primary: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
            secondary: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
        },
        shadows: {
            primary: '0 4px 14px 0 rgba(234, 88, 12, 0.25)',
            secondary: '0 4px 14px 0 rgba(217, 119, 6, 0.25)',
        },
        input: {
            background: 'rgba(0, 0, 0, 0.06)',
            shadow: 'inset 0 2px 6px 0 rgba(0, 0, 0, 0.12)',
            borderColor: '#0000001f',
            hoverBorderColor: '#0000004d',
            focusedBackground: 'rgba(0, 0, 0, 0.08)',
        },
        paper: {
            shadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
        },
        button: {
            disabledBackground: 'rgba(0, 0, 0, 0.12)',
            disabledText: 'rgba(0, 0, 0, 0.26)',
            secondaryHover: 'rgba(0, 0, 0, 0.03)',
        },
        menu: {
            background: '#fff',
            shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.12)',
        },
        status: {
            success: '#4caf50',
        },
        advancedParams: {
            drawerShadow: '0px -2px 4px rgba(0,0,0,0.05)',
        },
        urlDialog: {
            optionBackground: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,247,250,0.9))',
            optionShadow: '0 2px 8px rgba(0,0,0,0.05)',
            optionHoverBackground: 'linear-gradient(145deg, #ffffff, #e3f2fd)',
            optionHoverShadow: '0 8px 16px rgba(0,0,0,0.1)',
            iconBackground: '#ffffff',
            iconShadow: '0 2px 4px rgba(0,0,0,0.05)',
        },
        previewCard: {
            shadow: '0 0 6px 0 rgba(0, 0, 0, 0.01)',
            hoverShadow: '0 0 8px 0 rgba(0, 0, 0, 0.05)',
        },
        table: {
            headerBackground: 'rgba(0, 0, 0, 0.02)',
        },
        alert: {
            background: 'rgba(234, 88, 12, 0.08)',
            color: 'rgba(0, 0, 0, 0.87)',
            border: 'rgba(234, 88, 12, 0.2)',
            iconColor: '#EA580C',
        },
    },
    dark: {
        gradients: {
            primary: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
            secondary: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        },
        shadows: {
            primary: '0 4px 14px 0 rgba(251, 146, 60, 0.15)',
            secondary: '0 4px 14px 0 rgba(251, 191, 36, 0.15)',
        },
        input: {
            background: 'rgba(255, 255, 255, 0.06)',
            shadow: 'inset 0 2px 6px 0 rgba(0, 0, 0, 0.4)',
            borderColor: '#ffffff1f',
            hoverBorderColor: '#ffffff4d',
            focusedBackground: '#ffffff0d',
        },
        paper: {
            shadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
        },
        button: {
            disabledBackground: 'rgba(255, 255, 255, 0.05)',
            disabledText: 'rgba(255, 255, 255, 0.3)',
            secondaryHover: 'rgba(255, 255, 255, 0.05)',
        },
        menu: {
            background: '#1E1E1E',
            shadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
        },
        status: {
            success: '#4caf50',
        },
        advancedParams: {
            drawerShadow: '0px -2px 4px rgba(0,0,0,0.2)',
        },
        urlDialog: {
            optionBackground: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(255, 255, 255, 0.01))',
            optionShadow: '0 2px 8px rgba(0,0,0,0.2)',
            optionHoverBackground: 'linear-gradient(145deg, rgba(251, 146, 60, 0.15), rgba(251, 146, 60, 0.05))',
            optionHoverShadow: '0 8px 16px rgba(0,0,0,0.4)',
            iconBackground: 'rgba(251, 146, 60, 0.1)',
            iconShadow: 'none',
        },
        previewCard: {
            shadow: '0 0 6px 0 rgba(0, 0, 0, 0.2)',
            hoverShadow: '0 0 8px 0 rgba(0, 0, 0, 0.4)',
        },
        table: {
            headerBackground: 'rgba(255, 255, 255, 0.05)',
        },
        alert: {
            background: 'rgba(251, 146, 60, 0.15)',
            color: 'rgba(255, 255, 255, 0.9)',
            border: 'rgba(251, 146, 60, 0.3)',
            iconColor: '#FB923C',
        },
    },
};