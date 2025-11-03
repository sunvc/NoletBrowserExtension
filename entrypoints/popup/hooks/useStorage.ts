import { useState, useEffect } from 'react';
import { Device, AppSettings } from '../types';
import { getDevices, getDefaultDevice, addDevice, removeDevice, setDefaultDevice } from '../utils/storage';
import { getAppSettings, saveAppSettings } from '../utils/settings';

export function useDevices() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [defaultDeviceId, setDefaultDeviceId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // 加载设备数据
    const loadDevices = async () => {
        try {
            setLoading(true);
            const [deviceList, defaultId] = await Promise.all([
                getDevices(),
                getDefaultDevice()
            ]);
            setDevices(deviceList);
            // console.debug('deviceList', deviceList);
            setDefaultDeviceId(defaultId);
        } catch (error) {
            console.error('加载设备数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 添加设备
    const handleAddDevice = async (
        alias: string,
        apiURL: string,
        authorization?: { type: 'basic'; user: string; pwd: string; value: string; }):
        Promise<Device> => {
        const newDevice = await addDevice(alias, apiURL, authorization);
        setDevices(prev => [...prev, newDevice]);

        // 如果是第一个设备，设为默认设备
        if (devices.length === 0) {
            await handleSetDefaultDevice(newDevice.id);
        }

        return newDevice;
    };

    // 删除设备
    const handleRemoveDevice = async (deviceId: string) => {
        await removeDevice(deviceId);
        setDevices(prev => prev.filter(device => device.id !== deviceId));

        // 如果删除的是默认设备，更新默认设备状态
        if (defaultDeviceId === deviceId) {
            const remainingDevices = devices.filter(device => device.id !== deviceId);
            if (remainingDevices.length > 0) {
                // 按照id倒序寻找最后一个设备作为新的默认设备
                const lastDevice = [...remainingDevices].sort((a, b) => b.id.localeCompare(a.id))[0];
                await handleSetDefaultDevice(lastDevice.id);
            } else {
                setDefaultDeviceId('');
            }
        }
    };

    // 编辑设备
    const handleEditDevice = async (oldDeviceId: string, alias: string, apiURL: string, authorization?: { type: 'basic'; user: string; pwd: string; value: string; }): Promise<Device> => {
        const isDefault = defaultDeviceId === oldDeviceId;
        const newDevice = await addDevice(alias, apiURL, authorization);

        // 更新设备列表
        setDevices(prev => {
            const filtered = prev.filter(device => device.id !== oldDeviceId);
            return [...filtered, newDevice];
        });

        // 如果编辑的是默认设备，保持新设备为默认设备
        if (isDefault) {
            await handleSetDefaultDevice(newDevice.id);
        }

        // 删除旧设备
        await removeDevice(oldDeviceId);

        return newDevice;
    };

    // 设置默认设备
    const handleSetDefaultDevice = async (deviceId: string) => {
        await setDefaultDevice(deviceId);
        setDefaultDeviceId(deviceId);
    };

    // 获取默认设备
    const getDefaultDeviceInfo = () => {
        return devices.find(device => device.id === defaultDeviceId) || null;
    };

    useEffect(() => {
        loadDevices();
    }, []);

    return {
        devices,
        defaultDeviceId,
        loading,
        addDevice: handleAddDevice,
        editDevice: handleEditDevice,
        removeDevice: handleRemoveDevice,
        setDefaultDevice: handleSetDefaultDevice,
        getDefaultDevice: getDefaultDeviceInfo
    };
}

// 设置管理hook
export function useAppSettings() {
    const [settings, setSettings] = useState<AppSettings>({
        enableContextMenu: true,
        enableInspectSend: true,
        themeMode: 'system',
        enableEncryption: false,
        encryptionConfig: {
            algorithm: 'AES256',
            mode: 'GCM',
            key: ''
        },
        enableBasicAuth: false
    });
    const [loading, setLoading] = useState(true);

    // 加载设置
    const loadSettings = async () => {
        try {
            setLoading(true);
            const appSettings = await getAppSettings();
            setSettings(appSettings);
        } catch (error) {
            console.error('加载应用设置失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 更新设置
    const updateSettings = async (newSettings: AppSettings) => {
        await saveAppSettings(newSettings);
        setSettings(newSettings);
    };

    useEffect(() => {
        loadSettings();
    }, []);

    return {
        settings,
        loading,
        updateSettings,
        reload: loadSettings
    };
} 