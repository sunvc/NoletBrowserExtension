import { openDB, DBSchema, IDBPDatabase } from "idb";
import { v4 as uuidv4 } from "uuid";

// 历史记录接口
export interface HistoryRecord {
  id?: number; // 自增ID, 前端渲染使用
  uuid: string; // 唯一标识符, 用于去重
  timestamp: number; // 唯一时间戳, 用作 key (结合 uuid 在导入时实现去重排序)
  body: string; // 推送内容
  apiUrl: string; // 请求的API URL
  deviceName: string; // 设备名称
  parameters: any[]; // 完整的参数数组
  responseJson: any; // 响应的JSON内容
  requestTimestamp: number; // 请求时间戳
  responseTimestamp: number; // 响应时间戳
  timezone: string; // 请求时用户的时区
  title?: string; // 推送标题（可选）
  sound?: string; // 铃声（可选）
  url?: string; // 链接（可选）
  isEncrypted: boolean; // 是否加密
  createdAt: string; // 创建时间字符串 YYYY-MM-DD HH:mm:ss
  status?: string | null; // 状态标记: null=正常, 'recalled'=已撤回
  authorization?: {
    type: "basic"; // 认证类型
    user: string; // 用户名 (用于显示)
    pwd: string; // 密码 (用于显示)
    value: string; // Basic <凭证> (用于请求)
  }; // Basic Auth (可选)
  inspectType?: string; // 推送类型
}

// Favicon 缓存记录接口
export interface FaviconRecord {
  id?: number; // 自增ID
  url: string; // 图片地址
  timestamp: number; // 存储时间戳
  createdAt: string; // 创建时间字符串
  size: number; // 字节大小
  content: ArrayBuffer; // 文件内容
}

// 图片缓存记录接口
export interface ImageRecord {
  id?: number; // 自增ID
  url: string; // 图片地址
  timestamp: number; // 存储时间戳
  createdAt: string; // 创建时间字符串
  size: number; // 字节大小
  content: ArrayBuffer; // 文件内容
  pushID: string; // 推送ID，用于关联特定的推送记录
}

// 数据库结构定义
interface NoLetDB extends DBSchema {
  history: {
    key: number;
    value: HistoryRecord;
    indexes: {
      "by-timestamp": number;
      "by-uuid": string;
    };
  };
}

// 文件缓存数据库结构定义
interface NoLetFileDB extends DBSchema {
  fav: {
    key: number;
    value: FaviconRecord;
    indexes: {
      "by-url": string;
      "by-timestamp": number;
      "by-url-size": [string, number];
    };
  };
  img: {
    key: number;
    value: ImageRecord;
    indexes: {
      "by-pushID": string;
      "by-timestamp": number;
    };
  };
}

class DatabaseManager {
  private db: IDBPDatabase<NoLetDB> | null = null;
  private readonly DB_NAME = "NoLetSenderDB";
  private readonly DB_VERSION = 1;

  // 初始化数据库
  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<NoLetDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // 创建历史记录表
        const historyStore = db.createObjectStore("history", {
          keyPath: "id",
          autoIncrement: true,
        });

        // 创建索引
        historyStore.createIndex("by-timestamp", "timestamp", { unique: true });
        historyStore.createIndex("by-uuid", "uuid", { unique: true });
      },
    });
  }

  // 添加历史记录
  async addRecord(
    record: Omit<HistoryRecord, "id" | "timestamp" | "createdAt"> & {
      uuid?: string;
    }
  ): Promise<HistoryRecord> {
    await this.init();
    if (!this.db) throw new Error("数据库未初始化");

    const now = Date.now();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const createdAt = new Date(now).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const fullRecord: HistoryRecord = {
      ...record,
      uuid: record.uuid,
      timestamp: now,
      timezone,
      createdAt,
    };

    try {
      const id = await this.db.add("history", fullRecord);
      return { ...fullRecord, id };
    } catch (error) {
      // 如果是唯一性约束错误, 生成新的时间戳
      if (error instanceof Error && error.name === "ConstraintError") {
        // 递增时间戳直到找到唯一值
        let uniqueTimestamp = now + 1;
        while (true) {
          try {
            const retryRecord = {
              ...fullRecord,
              timestamp: uniqueTimestamp,
            };
            const id = await this.db.add("history", retryRecord);
            return { ...retryRecord, id };
          } catch (retryError) {
            if (
              retryError instanceof Error &&
              retryError.name === "ConstraintError"
            ) {
              uniqueTimestamp++;
              continue;
            }
            throw retryError;
          }
        }
      }
      throw error;
    }
  }

  // 获取所有历史记录, 按时间倒序排列
  async getAllRecords(): Promise<HistoryRecord[]> {
    await this.init();
    if (!this.db) throw new Error("数据库未初始化");

    const records = await this.db.getAll("history");
    return records.sort((a, b) => b.timestamp - a.timestamp);
  }

  // 根据 ID 数组批量删除记录
  async deleteRecords(ids: number[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("数据库未初始化");

    const tx = this.db.transaction("history", "readwrite");
    const promises = ids.map((id) => tx.store.delete(id));
    await Promise.all(promises);
    await tx.done;
  }

  // 根据 UUID 查询对应记录
  async getRecordByUuid(uuid: string): Promise<HistoryRecord | null> {
    await this.init();
    if (!this.db) throw new Error("数据库未初始化");

    try {
      const record = await this.db.getFromIndex("history", "by-uuid", uuid);
      return record || null;
    } catch (error) {
      console.error("根据UUID查询记录失败:", error);
      return null;
    }
  }

  // 根据UUID更新记录状态
  async updateRecordStatus(
    uuid: string,
    status: string | null
  ): Promise<boolean> {
    await this.init();
    if (!this.db) throw new Error("数据库未初始化");

    try {
      // 先通过UUID查询记录
      const record = await this.db.getFromIndex("history", "by-uuid", uuid);
      if (!record) {
        console.error("未找到UUID对应的记录:", uuid);
        return false;
      }

      // 更新状态
      const updatedRecord = { ...record, status };

      // 保存更新后的记录
      await this.db.put("history", updatedRecord);
      // console.debug('成功更新记录状态:', uuid, status);
      return true;
    } catch (error) {
      console.error("更新记录状态失败:", error);
      return false;
    }
  }

  // 导出所有记录
  async exportRecords(): Promise<HistoryRecord[]> {
    return await this.getAllRecords();
  }

  // 导入记录（可去重）
  async importRecords(
    records: HistoryRecord[]
  ): Promise<{ success: number; skipped: number; errors: number }> {
    await this.init();
    if (!this.db) throw new Error("数据库未初始化");

    let success = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
      try {
        // 检查 UUID 是否已存在
        const existing = await this.db.getFromIndex(
          "history",
          "by-uuid",
          record.uuid
        );
        if (existing) {
          skipped++;
          continue;
        }

        // 检查时间戳是否已存在
        const existingByTimestamp = await this.db.getFromIndex(
          "history",
          "by-timestamp",
          record.timestamp
        );
        if (existingByTimestamp) {
          // 如果时间戳冲突但 UUID 不同, 调整时间戳
          let newTimestamp = record.timestamp;
          while (
            await this.db.getFromIndex("history", "by-timestamp", newTimestamp)
          ) {
            newTimestamp++;
          }
          record.timestamp = newTimestamp;
        }

        // 移除id字段, 让数据库自动生成
        const { id, ...recordWithoutId } = record;
        await this.db.add("history", recordWithoutId);
        success++;
      } catch (error) {
        console.error("导入记录失败:", error, record);
        errors++;
      }
    }

    return { success, skipped, errors };
  }

  // 清空所有记录
  async clearAllRecords(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("数据库未初始化");

    await this.db.clear("history");
  }

  // 根据关键字搜索记录
  async searchRecords(keyword: string): Promise<HistoryRecord[]> {
    const allRecords = await this.getAllRecords();
    const lowerKeyword = keyword.toLowerCase();

    return allRecords.filter((record) => {
      return (
        record.body.toLowerCase().includes(lowerKeyword) ||
        record.deviceName.toLowerCase().includes(lowerKeyword) ||
        (record.title && record.title.toLowerCase().includes(lowerKeyword)) ||
        record.apiUrl.toLowerCase().includes(lowerKeyword)
      );
    });
  }
}

// 导出单例实例
export const dbManager = new DatabaseManager();

// 根据 UUID 查询历史记录
export async function getHistoryRecordByUuid(
  uuid: string
): Promise<HistoryRecord | null> {
  return await dbManager.getRecordByUuid(uuid);
}

// 根据UUID更新历史记录状态
export async function updateHistoryRecordStatus(
  uuid: string,
  status: string | null
): Promise<boolean> {
  return await dbManager.updateRecordStatus(uuid, status);
}

// 记录推送历史
export async function recordPushHistory(
  body: string,
  apiUrl: string,
  deviceName: string,
  response: any,
  options: {
    title?: string;
    sound?: string;
    url?: string;
    isEncrypted?: boolean;
    parameters?: any[];
    uuid?: string;
    authorization?: {
      type: "basic";
      user: string;
      pwd: string;
      value: string;
    };
  } = {}
): Promise<HistoryRecord> {
  const requestTimestamp = Date.now();
  const responseTimestamp = Date.now();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return await dbManager.addRecord({
    uuid: options.uuid || uuidv4(),
    body,
    apiUrl,
    deviceName,
    parameters: options.parameters || [],
    responseJson: response,
    requestTimestamp,
    responseTimestamp,
    timezone,
    title: options.title,
    sound: options.sound,
    url: options.url,
    isEncrypted: options.isEncrypted || false,
    authorization: options.authorization,
  });
}

// 文件缓存管理器类
class FileCacheManager {
  private fileDb: IDBPDatabase<NoLetFileDB> | null = null;
  private readonly FILE_DB_NAME = "NoLetSenderFileDB";
  private readonly FILE_DB_VERSION = 1;

  // 关闭数据库连接
  async close(): Promise<void> {
    if (this.fileDb) {
      this.fileDb.close();
      this.fileDb = null;
      console.debug("文件缓存数据库连接已关闭");
    }
  }

  // 完全销毁数据库
  async destroy(): Promise<void> {
    // 先关闭连接
    await this.close();

    // 删除整个数据库
    return new Promise<void>((resolve, reject) => {
      console.debug("正在销毁文件缓存数据库...");
      const deleteReq = indexedDB.deleteDatabase(this.FILE_DB_NAME);

      deleteReq.onsuccess = () => {
        console.debug("文件缓存数据库销毁成功");
        resolve();
      };

      deleteReq.onerror = () => {
        console.error("销毁文件缓存数据库失败:", deleteReq.error);
        reject(deleteReq.error);
      };

      deleteReq.onblocked = () => {
        console.warn("销毁数据库被阻塞，可能有其他连接未关闭");
        // 等待一段时间后重试
        setTimeout(() => {
          reject(new Error("数据库销毁被阻塞"));
        }, 5000);
      };
    });
  }

  // 初始化文件缓存数据库
  async init(): Promise<void> {
    if (this.fileDb) return;

    this.fileDb = await openDB<NoLetFileDB>(
      this.FILE_DB_NAME,
      this.FILE_DB_VERSION,
      {
        upgrade(db) {
          // 创建 favicon 缓存表
          const favStore = db.createObjectStore("fav", {
            keyPath: "id",
            autoIncrement: true,
          });

          // 创建索引
          favStore.createIndex("by-url", "url", { unique: false });
          favStore.createIndex("by-timestamp", "timestamp", { unique: false });
          favStore.createIndex("by-url-size", ["url", "size"], {
            unique: true,
          });

          // 创建图片缓存表
          const imgStore = db.createObjectStore("img", {
            keyPath: "id",
            autoIncrement: true,
          });

          // 只创建必要的索引
          imgStore.createIndex("by-pushID", "pushID", { unique: true }); // pushID 唯一
          imgStore.createIndex("by-timestamp", "timestamp", { unique: false });
        },
      }
    );
  }

  // 保存 favicon 到缓存
  async saveFavicon(url: string, content: ArrayBuffer): Promise<FaviconRecord> {
    await this.init();
    if (!this.fileDb) throw new Error("文件缓存数据库未初始化");

    const now = Date.now();
    const size = content.byteLength;
    const createdAt = new Date(now).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // 检查是否已存在相同 URL 和大小的记录
    try {
      const existing = await this.fileDb.getFromIndex("fav", "by-url-size", [
        url,
        size,
      ]);
      if (existing) {
        console.debug("Favicon 已存在缓存中:", url);
        return existing;
      }
    } catch (error) {
      // 索引不存在或查询失败，继续保存
    }

    const record: FaviconRecord = {
      url,
      timestamp: now,
      createdAt,
      size,
      content,
    };

    try {
      const id = await this.fileDb.add("fav", record);
      return { ...record, id };
    } catch (error) {
      console.error("保存 favicon 失败:", error);
      throw error;
    }
  }

  // 根据 URL 和时间戳获取 favicon
  async getFavicon(url: string, timestamp?: number): Promise<string | null> {
    await this.init();
    if (!this.fileDb) throw new Error("文件缓存数据库未初始化");

    try {
      // 获取所有匹配 URL 的记录
      const records = await this.fileDb.getAllFromIndex("fav", "by-url", url);

      if (records.length === 0) {
        return null;
      }

      let targetRecord: FaviconRecord;

      if (records.length === 1) {
        // 只有一个记录，直接返回
        targetRecord = records[0];
      } else if (timestamp) {
        // 多个记录，根据时间戳筛选
        const validRecords = records.filter(
          (record) => record.timestamp <= timestamp
        );
        if (validRecords.length === 0) {
          return null;
        }
        // 返回最近的那一个
        targetRecord = validRecords.reduce((latest, current) =>
          current.timestamp > latest.timestamp ? current : latest
        );
      } else {
        // 没有提供时间戳，返回最新的
        targetRecord = records.reduce((latest, current) =>
          current.timestamp > latest.timestamp ? current : latest
        );
      }

      // 创建 Blob URL
      const blob = new Blob([targetRecord.content]);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("获取 favicon 失败:", error);
      return null;
    }
  }

  // 删除指定时间前的 favicon 缓存
  async deleteFaviconsBefore(timestamp: number): Promise<void> {
    await this.init();
    if (!this.fileDb) throw new Error("文件缓存数据库未初始化");

    const tx = this.fileDb.transaction("fav", "readwrite");
    const store = tx.objectStore("fav");
    const index = store.index("by-timestamp");

    const range = IDBKeyRange.upperBound(timestamp);
    const cursor = await index.openCursor(range);

    const deletePromises: Promise<void>[] = [];

    if (cursor) {
      do {
        deletePromises.push(cursor.delete());
      } while (await cursor.continue());
    }

    await Promise.all(deletePromises);
    await tx.done;
  }

  // 保存图片到缓存
  async saveImage(
    url: string,
    content: ArrayBuffer,
    pushID: string
  ): Promise<ImageRecord> {
    await this.init();
    if (!this.fileDb) throw new Error("文件缓存数据库未初始化");

    const now = Date.now();
    const size = content.byteLength;
    const createdAt = new Date(now).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // 图片缓存每次都保存，pushID 确保唯一性
    const record: ImageRecord = {
      url,
      timestamp: now,
      createdAt,
      size,
      content,
      pushID,
    };

    try {
      const id = await this.fileDb.add("img", record);
      console.debug("图片缓存保存成功:", { url, pushID, size });
      return { ...record, id };
    } catch (error) {
      // 如果是 pushID 重复错误，查询现有记录并返回
      if (error instanceof DOMException && error.name === "ConstraintError") {
        try {
          const existing = await this.fileDb.getFromIndex(
            "img",
            "by-pushID",
            pushID
          );
          if (existing) {
            console.debug("Image 已存在缓存中 (pushID):", pushID);
            return existing;
          }
        } catch (queryError) {
          console.error("查询现有图片记录失败:", queryError);
        }
      }
      console.error("保存 image 失败:", error);
      throw error;
    }
  }

  // 根据 pushID 获取图片
  async getImageByPushID(pushID: string): Promise<string | null> {
    await this.init();
    if (!this.fileDb) throw new Error("文件缓存数据库未初始化");

    try {
      const record = await this.fileDb.getFromIndex("img", "by-pushID", pushID);

      if (!record) {
        return null;
      }

      // 创建 Blob URL
      const blob = new Blob([record.content]);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("获取 image 失败:", error);
      return null;
    }
  }

  // 删除指定时间前的图片缓存
  async deleteImagesBefore(timestamp: number): Promise<void> {
    await this.init();
    if (!this.fileDb) throw new Error("文件缓存数据库未初始化");

    const tx = this.fileDb.transaction("img", "readwrite");
    const store = tx.objectStore("img");
    const index = store.index("by-timestamp");

    const range = IDBKeyRange.upperBound(timestamp);
    const cursor = await index.openCursor(range);

    const deletePromises: Promise<void>[] = [];

    if (cursor) {
      do {
        deletePromises.push(cursor.delete());
      } while (await cursor.continue());
    }

    await Promise.all(deletePromises);
    await tx.done;
  }
}

// 导出文件缓存管理器单例
export const fileCacheManager = new FileCacheManager();
