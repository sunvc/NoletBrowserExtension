import { ThemeOptions } from '@mui/material/styles';

// 从主色生成完整的调色板
export function generateCustomPalette(mainColor: string, mode: 'light' | 'dark') {
    // 简单的颜色调整函数
    const adjustColor = (hex: string, percent: number) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1).toUpperCase();
    };

    const light = adjustColor(mainColor, 20);
    const dark = adjustColor(mainColor, -20);

    if (mode === 'light') {
        return {
            mode: 'light',
            primary: {
                main: mainColor,
                light: light,
                dark: dark,
                contrastText: '#ffffff',
            },
            secondary: {
                main: adjustColor(mainColor, -10),
                light: adjustColor(mainColor, 10),
                dark: adjustColor(mainColor, -30),
                contrastText: '#ffffff',
            },
            background: {
                default: '#fafafa',
                paper: '#ffffff',
            },
            text: {
                primary: '#111827',
                secondary: '#374151',
            },
            divider: 'rgba(0, 0, 0, 0.08)',
            action: {
                hover: `${mainColor}0a`,
                selected: `${mainColor}14`,
            },
        } as ThemeOptions['palette'];
    } else {
        return {
            mode: 'dark',
            primary: {
                main: light,
                light: adjustColor(mainColor, 40),
                dark: mainColor,
                contrastText: '#000000',
            },
            secondary: {
                main: adjustColor(mainColor, 30),
                light: adjustColor(mainColor, 50),
                dark: adjustColor(mainColor, 10),
                contrastText: '#000000',
            },
            background: {
                default: '#000000',
                paper: '#121212',
            },
            text: {
                primary: '#ffffff',
                secondary: 'rgba(255, 255, 255, 0.85)',
            },
            divider: 'rgba(255, 255, 255, 0.15)',
            action: {
                hover: `${light}14`,
                selected: `${light}29`,
                disabledBackground: 'rgba(255, 255, 255, 0.05)',
                disabled: 'rgba(255, 255, 255, 0.3)',
            },
        } as ThemeOptions['palette'];
    }
}

// 从主色生成自定义颜色配置
export function generateCustomColors(mainColor: string, mode: 'light' | 'dark') {
    const adjustColor = (hex: string, percent: number) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1).toUpperCase();
    };

    const light = adjustColor(mainColor, 20);
    const secondary = adjustColor(mainColor, -10);

    if (mode === 'light') {
        return {
            gradients: {
                primary: `linear-gradient(135deg, ${mainColor} 0%, ${light} 100%)`,
                secondary: `linear-gradient(135deg, ${secondary} 0%, ${mainColor} 100%)`,
            },
            shadows: {
                primary: `0 4px 14px 0 ${mainColor}40`,
                secondary: `0 4px 14px 0 ${secondary}40`,
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
                optionHoverBackground: `linear-gradient(145deg, #ffffff, ${mainColor}14)`,
                optionHoverShadow: '0 8px 16px rgba(0,0,0,0.1)',
                iconBackground: '#ffffff',
                iconShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
            previewCard: {
                shadow: '0 2px 8px rgba(0,0,0,0.08)',
                hoverShadow: '0 4px 16px rgba(0,0,0,0.12)',
            },
            table: {
                headerBackground: 'rgba(0, 0, 0, 0.02)',
            },
            alert: {
                background: `${mainColor}14`,
                color: 'rgba(0, 0, 0, 0.87)',
                border: `${mainColor}33`,
                iconColor: mainColor,
            },
        };
    } else {
        return {
            gradients: {
                primary: `linear-gradient(135deg, ${light} 0%, ${light} 100%)`,
                secondary: `linear-gradient(135deg, ${mainColor} 0%, ${mainColor} 100%)`,
            },
            shadows: {
                primary: `0 4px 14px 0 ${light}26`,
                secondary: `0 4px 14px 0 ${mainColor}26`,
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
                optionHoverBackground: `linear-gradient(145deg, ${light}26, ${light}0d)`,
                optionHoverShadow: '0 8px 16px rgba(0,0,0,0.4)',
                iconBackground: `${light}1a`,
                iconShadow: 'none',
            },
            previewCard: {
                shadow: '0 2px 8px rgba(0,0,0,0.2)',
                hoverShadow: '0 4px 16px rgba(0,0,0,0.3)',
            },
            table: {
                headerBackground: 'rgba(255, 255, 255, 0.02)',
            },
            alert: {
                background: `${light}26`,
                color: 'rgba(255, 255, 255, 0.9)',
                border: `${light}4d`,
                iconColor: light,
            },
        };
    }
}
