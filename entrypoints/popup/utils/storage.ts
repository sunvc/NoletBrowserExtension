import { Device } from '../types';
import { formatApiURL } from './api';

// 存储键名常量
const STORAGE_KEYS = {
    DEVICES: 'nolet_devices',
    DEFAULT_DEVICE: 'nolet_default_device'
};

// 获取浏览器存储API - 使用Promise包装以兼容不同API
function getStorage() {
    return new Promise((resolve, reject) => {
        try {
            // 检查chrome.storage是否可用
            const chromeAPI = (window as any).chrome;
            if (chromeAPI && chromeAPI.storage) {
                resolve(chromeAPI.storage);
                return;
            }

            // 检查browser.storage是否可用  
            const browserAPI = (window as any).browser;
            if (browserAPI && browserAPI.storage) {
                resolve(browserAPI.storage);
                return;
            }

            // 作为开发环境的fallback，使用localStorage模拟
            const localStorageMock = {
                local: {
                    get: (keys: string) => {
                        return Promise.resolve({
                            [keys]: JSON.parse(localStorage.getItem(keys) || 'null')
                        });
                    },
                    set: (items: Record<string, any>) => {
                        Object.keys(items).forEach(key => {
                            localStorage.setItem(key, JSON.stringify(items[key]));
                        });
                        return Promise.resolve();
                    }
                }
            };
            resolve(localStorageMock);
        } catch (error) {
            reject(new Error('存储API初始化失败'));
        }
    });
}

// 获取设备列表
export async function getDevices(): Promise<Device[]> {
    try {
        const storage: any = await getStorage();
        const result = await storage.local.get(STORAGE_KEYS.DEVICES);
        return result[STORAGE_KEYS.DEVICES] || [];
    } catch (error) {
        console.error('获取设备列表失败:', error);
        return [];
    }
}

// 保存设备列表
export async function saveDevices(devices: Device[]): Promise<void> {
    try {
        const storage: any = await getStorage();
        await storage.local.set({ [STORAGE_KEYS.DEVICES]: devices });
    } catch (error) {
        console.error('保存设备列表失败:', error);
        throw error;
    }
}

// 添加新设备
export async function addDevice(alias: string, apiURL: string, authorization?: { type: 'basic'; user: string; pwd: string; value: string; }): Promise<Device> {
    const timestamp = Date.now();
    const date = new Date(timestamp);

    // 格式化为 YYYY-MM-DD HH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // 格式化 URL
    const formattedApiURL = formatApiURL(apiURL);

    let server: string | undefined;
    let deviceKey: string | undefined;

    try {
        const url = new URL(formattedApiURL);
        // const oldServer = `${url.protocol}//${url.host}`; // 旧的获取 server 的方式，新的应该是整段地址除去最后一段 /<device_key>/

        const pathParts = url.pathname.split('/').filter(part => part);
        if (pathParts.length > 0) {
            deviceKey = pathParts[pathParts.length - 1];
            server = formattedApiURL.slice(0, -deviceKey.length - 1).replace(/\/$/, ''); // 去除最后的 /
            // console.debug('server', server, 'deviceKey', deviceKey, formattedApiURL, 'oldServer', oldServer);
        }
    } catch (error) {
        console.error('解析API URL失败:', error);
    }

    const device: Device = {
        id: timestamp.toString(),
        alias,
        apiURL: formattedApiURL,
        createdAt,
        timestamp,
        ...(authorization && { authorization }), // 如果提供了认证信息，则添加到设备中
        ...(server && { server }), // 服务器地址
        ...(deviceKey && { deviceKey }) // deviceKey
    };

    const devices = await getDevices();
    devices.push(device);
    await saveDevices(devices);

    return device;
}

// 删除设备
export async function removeDevice(deviceId: string): Promise<void> {
    const devices = await getDevices();
    const updatedDevices = devices.filter(device => device.id !== deviceId);
    await saveDevices(updatedDevices);

    // 如果删除的是默认设备，清除默认设备设置
    const defaultDevice = await getDefaultDevice();
    if (defaultDevice === deviceId) {
        await setDefaultDevice('');
    }
}

// 获取默认设备ID
export async function getDefaultDevice(): Promise<string> {
    try {
        const storage: any = await getStorage();
        const result = await storage.local.get(STORAGE_KEYS.DEFAULT_DEVICE);
        return result[STORAGE_KEYS.DEFAULT_DEVICE] || '';
    } catch (error) {
        console.error('获取默认设备失败:', error);
        return '';
    }
}

// 设置默认设备
export async function setDefaultDevice(deviceId: string): Promise<void> {
    try {
        const storage: any = await getStorage();
        await storage.local.set({ [STORAGE_KEYS.DEFAULT_DEVICE]: deviceId });
    } catch (error) {
        console.error('设置默认设备失败:', error);
        throw error;
    }
}
