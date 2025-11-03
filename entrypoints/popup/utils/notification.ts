/**
 * 取代 browser.notifications.create 用于显示系统级通知
 * @param title 通知标题
 * @param message 通知消息
 * @param isEssential 是否是必要通知（错误通知），默认false
 */
export async function showSYSNotification(
    title: string,
    message: string,
    isEssential: boolean = false
): Promise<void> {
    try {
        const settingsResult = await browser.storage.local.get('nolet_app_settings');
        const settings = settingsResult.nolet_app_settings || {};

        // 检查系统通知设置
        if (settings.enableSystemNotifications === false) {
            return;
        }

        // 检查保留必要通知设置
        if (settings.keepEssentialNotifications === true && !isEssential) {
            return;
        }

        await browser.notifications.create({
            type: 'basic',
            iconUrl: '/icon/128.png',
            title,
            message
        });
    } catch (error) {
        console.error('创建通知失败:', error);
    }
}
