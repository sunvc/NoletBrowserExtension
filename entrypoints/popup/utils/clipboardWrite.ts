/**
 * 写入内容到剪切板
 * @param data - 文字内容或图片的 Blob/URL/Base64 
 * @param type - 'txt'（默认）表示写文本，'img' 表示写图片
 */
export async function writeToClipboard(
    data: string | Blob,
    type: "txt" | "img" = "txt"
): Promise<void> {
    try {
        if (type === "txt") {
            // 写入文字
            await navigator.clipboard.writeText(String(data));
        }
    } catch (err) {
        console.error("写入剪切板失败:", err);
        throw new Error("Clipboard write failed: " + err);
    }
}
