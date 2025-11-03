// 读取剪切板内容
export async function readClipboard(): Promise<string> {
    try {
        // 使用 Clipboard API
        if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            return text || '';
        }

        throw new Error('浏览器不支持剪切板API');
    } catch (error) {
        console.error('读取剪切板失败:', error);

        // 如果是权限问题，提供更友好的错误信息
        if (error instanceof Error && error.name === 'NotAllowedError') {
            throw new Error('剪切板权限被拒绝，请允许扩展访问剪切板');
        }

        throw new Error('无法读取剪切板内容，请检查权限设置');
    }
} 