import { recordPushHistory } from './database';

// 历史记录服务，监听来自 background script 的记录请求
export function initHistoryService() {
    // 监听来自 background script 的消息
    browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
        if (message.action === 'recordHistory') {
            handleRecordHistory(message)
                .then((result) => {
                    sendResponse({ success: true, data: result });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true; // 保持消息通道开放
        }
    });
}

// 处理记录历史请求
async function handleRecordHistory(message: any) {
    const {
        body,
        apiUrl,
        deviceName,
        response,
        method = 'GET',
        options = {}
    } = message;

    return await recordPushHistory(
        body,
        apiUrl,
        deviceName,
        response,
        method,
        options
    );
}

// 从 background script 记录历史
export async function recordHistoryFromBackground(
    body: string,
    apiUrl: string,
    deviceName: string,
    response: any,
    method: 'GET' | 'POST' = 'GET',
    options: {
        title?: string;
        sound?: string;
        url?: string;
        isEncrypted?: boolean;
        parameters?: any[];
    } = {}
) {
    try {
        const result = await browser.runtime.sendMessage({
            action: 'recordHistory',
            body,
            apiUrl,
            deviceName,
            response,
            method,
            options
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data;
    } catch (error) {
        console.error('记录历史失败:', error);
        // 不抛出错误，避免影响主要功能
    }
} 