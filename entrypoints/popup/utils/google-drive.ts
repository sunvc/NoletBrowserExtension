/**
 * Google Drive API
 * Identity 为 Chrome 特有
 */
export interface GoogleDriveFile {
    id: string;
    name: string;
    createdTime: string;
    modifiedTime: string;
    size: string;
    mimeType: string;
}

export class GoogleDriveAPI {
    private static readonly FOLDER_NAME = 'Nolet Backups';
    private static lastAuthCheck: { result: boolean; timestamp: number } | null = null;

    /**
     * 检查是否已授权
     */
    static async isAuthorized(): Promise<boolean> {
        // 如果 5 分钟内已经检查过，直接返回缓存结果
        const now = Date.now();
        if (this.lastAuthCheck && now - this.lastAuthCheck.timestamp < 300000) {
            return this.lastAuthCheck.result;
        }

        try {
            const token = await new Promise<string>((resolve, reject) => {
                (window as any).chrome.identity.getAuthToken({ interactive: false }, (token: string) => {
                    if ((window as any).chrome.runtime.lastError) {
                        reject(new Error((window as any).chrome.runtime.lastError.message));
                        return;
                    }
                    resolve(token);
                });
            });

            if (!token) {
                this.lastAuthCheck = { result: false, timestamp: now };
                return false;
            }

            // 验证 token 是否有效
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
            const isAuthorized = response.ok;

            if (!isAuthorized) {
                // token 无效，清除缓存
                await new Promise<void>((resolve) => {
                    (window as any).chrome.identity.removeCachedAuthToken({ token }, () => {
                        resolve();
                    });
                });
            }

            // 缓存结果
            this.lastAuthCheck = { result: isAuthorized, timestamp: now };
            return isAuthorized;
        } catch {
            this.lastAuthCheck = { result: false, timestamp: now };
            return false;
        }
    }

    /**
     * 授权 Google Drive
     */
    static async authorize(): Promise<void> {
        try {
            // 清除缓存
            this.lastAuthCheck = null;

            // 先清除可能存在的无效 token 缓存
            try {
                const existingToken = await new Promise<string>((resolve) => {
                    (window as any).chrome.identity.getAuthToken({ interactive: false }, (token: string) => {
                        resolve(token || '');
                    });
                });

                if (existingToken) {
                    // 测试现有 token 是否有效
                    const testResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${existingToken}`);
                    if (!testResponse.ok) {
                        // token 无效，清除缓存
                        await new Promise<void>((resolve) => {
                            (window as any).chrome.identity.removeCachedAuthToken({ token: existingToken }, () => {
                                resolve();
                            });
                        });
                    }
                }
            } catch (cleanupError) {
                console.log('Token cleanup completed:', cleanupError);
            }

            // 获取新的 token
            const token = await new Promise<string>((resolve, reject) => {
                (window as any).chrome.identity.getAuthToken({ interactive: true }, (token: string) => {
                    if ((window as any).chrome.runtime.lastError) {
                        reject(new Error((window as any).chrome.runtime.lastError.message));
                        return;
                    }

                    if (!token) {
                        reject(new Error('Authorization cancelled'));
                        return;
                    }

                    resolve(token);
                });
            });

            // 验证新 token
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
            if (!response.ok) {
                // 如果新 token 也无效，清除它并抛出错误
                await new Promise<void>((resolve) => {
                    (window as any).chrome.identity.removeCachedAuthToken({ token }, () => {
                        resolve();
                    });
                });
                throw new Error('Failed to obtain valid token');
            }
        } catch (error) {
            console.error('Authorization failed:', error);
            throw error;
        }
    }

    /**
     * 获取访问令牌
     */
    private static async getAccessToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            (window as any).chrome.identity.getAuthToken({ interactive: false }, (token: string) => {
                if ((window as any).chrome.runtime.lastError) {
                    reject(new Error((window as any).chrome.runtime.lastError.message));
                    return;
                }

                if (!token) {
                    reject(new Error('No access token available'));
                    return;
                }

                resolve(token);
            });
        });
    }

    /**
     * 创建或获取备份文件夹
     */
    private static async getOrCreateBackupFolder(): Promise<string> {
        const accessToken = await this.getAccessToken();

        // 搜索现有文件夹
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!searchResponse.ok) {
            throw new Error('Failed to search for backup folder');
        }

        const searchResult = await searchResponse.json();

        if (searchResult.files && searchResult.files.length > 0) {
            return searchResult.files[0].id;
        }

        // 创建新文件夹
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            })
        });

        if (!createResponse.ok) {
            throw new Error('Failed to create backup folder');
        }

        const createResult = await createResponse.json();
        return createResult.id;
    }

    /**
     * 上传备份文件到 Google Drive
     */
    static async uploadBackup(fileName: string, content: string): Promise<string> {
        const accessToken = await this.getAccessToken();
        const folderId = await this.getOrCreateBackupFolder();

        const metadata = {
            name: fileName,
            parents: [folderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: form
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to upload backup: ${errorText}`);
        }

        const result = await response.json();
        return result.id;
    }

    /**
     * 获取备份文件列表
     */
    static async getBackupFiles(): Promise<GoogleDriveFile[]> {
        const accessToken = await this.getAccessToken();
        const folderId = await this.getOrCreateBackupFolder();

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=parents in '${folderId}' and trashed=false&fields=files(id,name,createdTime,modifiedTime,size,mimeType)&orderBy=modifiedTime desc`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get backup files: ${errorText}`);
        }

        const result = await response.json();
        return result.files || [];
    }

    /**
     * 下载备份文件
     */
    static async downloadBackup(fileId: string): Promise<string> {
        const accessToken = await this.getAccessToken();

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to download backup: ${errorText}`);
        }

        return await response.text();
    }

    /**
     * 删除备份文件
     */
    static async deleteBackup(fileId: string): Promise<void> {
        const accessToken = await this.getAccessToken();

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete backup: ${errorText}`);
        }
    }

    /**
     * 清空所有备份文件（删除备份文件夹并重新创建避免浪费多余请求）
     */
    static async clearAllBackups(): Promise<void> {
        const accessToken = await this.getAccessToken();

        // 搜索现有备份文件夹
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!searchResponse.ok) {
            throw new Error('Failed to search for backup folder');
        }

        const searchResult = await searchResponse.json();

        // 如果文件夹存在，删除它
        if (searchResult.files && searchResult.files.length > 0) {
            const folderId = searchResult.files[0].id;

            const deleteResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!deleteResponse.ok) {
                const errorText = await deleteResponse.text();
                throw new Error(`Failed to delete backup folder: ${errorText}`);
            }
        }

        // 重新创建备份文件夹
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            })
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Failed to recreate backup folder: ${errorText}`);
        }
    }

    /**
     * 撤销授权
     */
    static async revokeAuth(): Promise<void> {
        try {
            // 清除缓存
            this.lastAuthCheck = null;

            // 获取当前 token
            const token = await this.getAccessToken();

            // 撤销 token
            await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
                method: 'POST'
            });

            // 清除 Chrome Identity 中的缓存 token
            await new Promise<void>((resolve) => {
                (window as any).chrome.identity.removeCachedAuthToken({ token }, () => {
                    resolve();
                });
            });
        } catch (error) {
            console.error('Failed to revoke token:', error);

            // 撤销失败，清除缓存和所有可能的缓存 token
            this.lastAuthCheck = null;

            try {
                // 尝试获取并清除任何缓存的 token
                const cachedToken = await new Promise<string>((resolve) => {
                    (window as any).chrome.identity.getAuthToken({ interactive: false }, (token: string) => {
                        resolve(token || '');
                    });
                });

                if (cachedToken) {
                    await new Promise<void>((resolve) => {
                        (window as any).chrome.identity.removeCachedAuthToken({ token: cachedToken }, () => {
                            resolve();
                        });
                    });
                }
            } catch (cleanupError) {
                console.error('Failed to cleanup cached tokens:', cleanupError);
            }
        }
    }
}
