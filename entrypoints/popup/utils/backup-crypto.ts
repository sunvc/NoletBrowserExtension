export interface EncryptionResult {
    encryptedData: string;
    iv: string;
    salt: string;
}

export class BackupCrypto {
    /**
     * 加密备份数据
     * @param data 要加密的数据对象
     * @param password 用户密码
     * @returns 加密结果
     */
    static async encrypt(data: any, password: string): Promise<EncryptionResult> {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        // 生成随机盐值和IV
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // 使用 PBKDF2 派生密钥
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        // 加密数据
        const dataString = JSON.stringify(data);
        const encryptedBuffer = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encoder.encode(dataString)
        );

        // 转换 base64
        const encryptedArray = new Uint8Array(encryptedBuffer);
        const encryptedData = btoa(String.fromCharCode(...encryptedArray));
        const ivBase64 = btoa(String.fromCharCode(...iv));
        const saltBase64 = btoa(String.fromCharCode(...salt));

        return {
            encryptedData,
            iv: ivBase64,
            salt: saltBase64
        };
    }

    /**
     * 解密备份数据
     * @param encryptedData 加密的数据
     * @param ivBase64 Base64 IV
     * @param saltBase64 Base64 Salt
     * @param password 用户密码
     * @returns 解密后的数据对象
     */
    static async decrypt(encryptedData: string, ivBase64: string, saltBase64: string, password: string): Promise<any> {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        // 解码 base64 数据
        const salt = new Uint8Array(atob(saltBase64).split('').map(c => c.charCodeAt(0)));
        const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
        const encrypted = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

        // 使用相同的 PBKDF2 参数派生密钥
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // 解密数据
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encrypted
        );

        const decryptedString = decoder.decode(decryptedBuffer);
        return JSON.parse(decryptedString);
    }

    /**
     * 获取 Chrome 扩展 ID
     */
    static getRunId(): string {
        try {
            return (window as any)?.chrome?.runtime?.id || 'unknown';
        } catch {
            return 'unknown';
        }
    }

    /**
     * 获取扩展版本
     */
    static getVersion(): string {
        try {
            return (window as any)?.chrome?.runtime?.getManifest?.()?.version || '1.1.0';
        } catch {
            return '1.1.0';
        }
    }

    /**
     * 获取 UA
     */
    static getUserAgent(): string {
        return navigator.userAgent;
    }
}
