import { fileCacheManager } from './database';
import { getAppSettings } from './settings';

class FaviconManager {
    private blobUrls: Set<string> = new Set();

    // 预请求并缓存 favicon
    async cacheFavicon(url: string): Promise<void> {
        try {
            const settings = await getAppSettings();
            if (!settings.enableFileCache) {
                return; // 未启用文件缓存
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            await fileCacheManager.saveFavicon(url, arrayBuffer);
            console.debug('Favicon 已缓存:', url);
        } catch (error) {
            console.error('缓存 favicon 失败:', url, error);
        }
    }

    // 获取 favicon，优先从缓存获取
    async getFavicon(url: string, timestamp?: number): Promise<string> {
        try {
            const settings = await getAppSettings();
            if (!settings.enableFileCache) {
                return url; // 未启用文件缓存，返回原始 URL
            }

            // 尝试从缓存获取
            const cachedUrl = await fileCacheManager.getFavicon(url, timestamp);
            if (cachedUrl) {
                // 记录 blob URL 以便后续清理
                this.blobUrls.add(cachedUrl);
                return cachedUrl;
            }

            // 缓存中没有，尝试预请求并缓存
            await this.cacheFavicon(url);

            // 再次尝试从缓存获取
            const newCachedUrl = await fileCacheManager.getFavicon(url, timestamp);
            if (newCachedUrl) {
                this.blobUrls.add(newCachedUrl);
                return newCachedUrl;
            }

            // 都失败了，返回原始 URL
            return url;
        } catch (error) {
            console.error('获取 favicon 失败:', url, error);
            return url; // 出错时返回原始 URL
        }
    }

    // 清理所有创建的 blob URLs
    cleanupBlobUrls(): void {
        this.blobUrls.forEach(url => {
            try {
                URL.revokeObjectURL(url);
            } catch (error) {
                console.warn('清理 blob URL 失败:', url, error);
            }
        });
        this.blobUrls.clear();
        console.debug('已清理所有 blob URLs');
    }
}

export const faviconManager = new FaviconManager();

export async function getFaviconUrl(url: string, timestamp?: number): Promise<string> {
    return await faviconManager.getFavicon(url, timestamp);
}

export function cleanupFaviconBlobs(): void {
    faviconManager.cleanupBlobUrls();
}

export async function cacheFaviconUrl(url: string): Promise<void> {
    await faviconManager.cacheFavicon(url);
}

export async function getImageByPushID(pushID: string): Promise<string | null> {
    return await fileCacheManager.getImageByPushID(pushID);
}

export async function deleteImagesBefore(timestamp: number): Promise<void> {
    await fileCacheManager.deleteImagesBefore(timestamp);
}
