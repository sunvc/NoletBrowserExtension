import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  Stack,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Radio,
  FormControlLabel,
  Switch,
  Link,
  Tooltip,
  LinearProgress,
  Snackbar,
  Popover,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DevicesIcon from "@mui/icons-material/Devices";
import InfoIcon from "@mui/icons-material/Info";
import GitHubIcon from "@mui/icons-material/GitHub";
import EmailIcon from "@mui/icons-material/Email";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SecurityIcon from "@mui/icons-material/Security";
import TuneIcon from "@mui/icons-material/Tune";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import GavelIcon from "@mui/icons-material/Gavel";
import WysiwygIcon from "@mui/icons-material/Wysiwyg";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ReadMoreIcon from "@mui/icons-material/ReadMore";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
// import AutoStoriesIcon from '@mui/icons-material/AutoStories';

import { useTranslation } from "react-i18next";
import { Device, ThemeMode } from "../types";
import { useAppContext } from "../contexts/AppContext";
import DeviceDialog from "../components/DeviceDialog";
import EncryptionDialog from "../components/EncryptionDialog";
import SoundDialog from "../components/SoundDialog";
import FeatureSettings from "../components/FeatureSettings";
import BackupRestoreCard from "../components/BackupRestoreCard";
// import CacheSetting from "../components/CacheSetting";
import DnsQueryCard from "../components/DnsQueryCard";
import { openGitHub, openStoreRating } from "../utils/extension";
import { detectBrowser } from "../utils/platform";

interface SettingsProps {
  devices: Device[];
  defaultDeviceId: string;
  onAddDevice: (
    alias: string,
    apiURL: string,
    authorization?: { type: "basic"; user: string; pwd: string; value: string }
  ) => Promise<Device>;
  onEditDevice: (
    oldDeviceId: string,
    alias: string,
    apiURL: string,
    authorization?: { type: "basic"; user: string; pwd: string; value: string }
  ) => Promise<Device>;
  onRemoveDevice: (deviceId: string) => Promise<void>;
  onSetDefaultDevice: (deviceId: string) => Promise<void>;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onSettingsChange?: () => void;
}

export default function Settings({
  devices,
  defaultDeviceId,
  onAddDevice,
  onEditDevice,
  onRemoveDevice,
  onSetDefaultDevice,
  themeMode,
  onThemeChange,
  onSettingsChange,
}: SettingsProps) {
  const { t } = useTranslation();
  const {
    appSettings,
    updateAppSetting,
    updateEncryptionConfig,
    shortcutKeys,
  } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | undefined>();
  const [encryptionDialogOpen, setEncryptionDialogOpen] = useState(false);
  const [soundDialogOpen, setSoundDialogOpen] = useState(false);
  const [shortcutGuideAnchor, setShortcutGuideAnchor] =
    useState<HTMLElement | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [version, setVersion] = useState<string | null>(null);

  // 检测浏览器类型
  const browserType = detectBrowser();

  // 复制快捷键设置地址
  const handleCopyShortcutUrl = async () => {
    const url =
      browserType === "firefox"
        ? "about:addons"
        : `${
            browserType === "chrome" ? "chrome" : "edge"
          }://extensions/shortcuts`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  // 系统通知开关切换
  const handleSystemNotificationsToggle = async (enabled: boolean) => {
    try {
      await updateAppSetting("enableSystemNotifications", enabled);
      if (!enabled) {
        handleKeepEssentialNotificationsToggle(false);
      }
    } catch (error) {
      setError(
        t("common.error_update", {
          message: error instanceof Error ? error.message : "未知错误",
        })
      );
    }
  };

  // 保留必要通知开关
  const handleKeepEssentialNotificationsToggle = async (enabled: boolean) => {
    try {
      await updateAppSetting("keepEssentialNotifications", enabled);
      if (enabled) {
        setToast({
          open: true,
          message: t("settings.system_notifications.enable_success"),
        });
      }
    } catch (error) {
      setError(
        t("common.error_update", {
          message: error instanceof Error ? error.message : "未知错误",
        })
      );
    }
  };

  // 处理加密开关切换
  const handleEncryptionToggle = async (enabled: boolean) => {
    try {
      await updateAppSetting("enableEncryption", enabled);
      if (enabled) {
        // 如果开启加密，则打开加密配置
        setEncryptionDialogOpen(true);
        setToast({
          open: true,
          message: t("settings.encryption.tips_on"),
        });
      }
    } catch (error) {
      // 更新加密设置失败: {{message}}
      setError(
        t("settings.encryption.errors.update_failed", {
          message: error instanceof Error ? error.message : "未知错误",
        })
      );
    }
  };

  // 处理加密配置保存
  const handleEncryptionConfigSave = async (config: any) => {
    try {
      await updateEncryptionConfig(config);
    } catch (error) {
      // 保存加密配置失败: {{message}}
      setError(
        t("settings.encryption.errors.config_save_failed", {
          message: error instanceof Error ? error.message : "未知错误",
        })
      );
    }
  };

  // 处理铃声保存
  const handleSoundSave = async (sound: string) => {
    try {
      await updateAppSetting("sound", sound || undefined);
    } catch (error) {
      // 保存铃声设置失败: {{message}}
      setError(
        t("common.error_update", {
          message: error instanceof Error ? error.message : "未知错误",
        })
      );
    }
  };

  const handleAddDevice = async (
    alias: string,
    apiURL: string,
    authorization?: { type: "basic"; user: string; pwd: string; value: string }
  ) => {
    setLoading(true);
    setError("");
    try {
      await onAddDevice(alias, apiURL, authorization);
      onSettingsChange?.();
      setDeviceDialogOpen(false);
      setError("");
    } catch (error) {
      // setError(`添加设备失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setError(
        t("common.add_device_failed", {
          message:
            error instanceof Error ? error.message : t("common.error_unknown"),
        })
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleEditDevice = async (
    alias: string,
    apiURL: string,
    authorization?: { type: "basic"; user: string; pwd: string; value: string }
  ) => {
    if (!editingDevice) return;

    setLoading(true);
    setError("");
    try {
      await onEditDevice(editingDevice.id, alias, apiURL, authorization);
      setEditingDevice(undefined);
      onSettingsChange?.();
      setDeviceDialogOpen(false);
      setError("");
    } catch (error) {
      // setError(`编辑设备失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setError(
        t("common.edit_device_failed", {
          message:
            error instanceof Error ? error.message : t("common.error_unknown"),
        })
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (deviceId: string) => {
    try {
      await onRemoveDevice(deviceId);
      onSettingsChange?.();
    } catch (error) {
      // setError(`删除设备失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setError(
        t("common.delete_device_failed", {
          message:
            error instanceof Error ? error.message : t("common.error_unknown"),
        })
      );
    }
  };

  const handleSetDefault = async (deviceId: string) => {
    try {
      await onSetDefaultDevice(deviceId);
      onSettingsChange?.();
    } catch (error) {
      // setError(`设置默认设备失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setError(
        t("common.set_default_device_failed", {
          message:
            error instanceof Error ? error.message : t("common.error_unknown"),
        })
      );
    }
  };

  useEffect(() => {
    try {
      const v =
        (window as any)?.chrome?.runtime?.getManifest?.()?.version ?? null;
      setVersion(v);
    } catch {
      setVersion(null);
    }
  }, []);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minHeight: "min-content", // 确保内容可以撑开
        }}
      >
        {/* 顶部加载中进度条 绝对定位 */}
        {loading && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
          />
        )}
        {/* 设备管理卡片 */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <DevicesIcon />
                {/* 设备管理 */}
                {t("device.title")}
              </Typography>
              <Button
                variant="text"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingDevice(undefined);
                  setDeviceDialogOpen(true);
                }}
                sx={{
                  px: 1.2,
                }}
              >
                {/* 添加设备 */}
                {t("device.add")}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {/* 设备列表 */}
            {devices.length > 0 ? (
              <List>
                {devices.map((device) => (
                  <ListItem key={device.id} divider sx={{ padding: 0.5 }}>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <FormControlLabel
                            value={device.id}
                            control={
                              <Radio
                                checked={defaultDeviceId === device.id}
                                onChange={() => handleSetDefault(device.id)}
                                size="small"
                                sx={{
                                  padding: 0,
                                }}
                              />
                            }
                            label=""
                            sx={{ m: 0 }}
                          />
                          <Typography variant="body1">
                            {device.alias}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          color="text.secondary"
                          variant="caption"
                          sx={{
                            display: "inline-block",
                            maxWidth: "180px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {device.apiURL}
                        </Typography>
                      }
                    />
                    <Stack direction="row" gap={1}>
                      <IconButton
                        edge="end"
                        aria-label="编辑"
                        onClick={() => {
                          setEditingDevice(device);
                          setDeviceDialogOpen(true);
                        }}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="删除"
                        onClick={() => handleRemove(device.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                {/* 暂无设备，请点击"添加设备"按钮添加一个设备。 */}
                {t("device.no_devices")}
              </Alert>
            )}
          </Stack>
        </Paper>

        {/* 铃声设置卡片 */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <VolumeUpIcon />
                {/* 铃声设置 */}
                {t("settings.sound.title")}
              </Typography>
              <Tooltip title={t("settings.sound.select")} placement="top">
                <Button
                  variant="outlined"
                  size="small"
                  disabled={devices.length === 0}
                  onClick={() => setSoundDialogOpen(true)}
                  startIcon={<VolumeUpIcon />}
                >
                  {/* 选择铃声 -> 当前铃声: xxx */}
                  {appSettings?.sound || t("settings.sound.default")}
                </Button>
              </Tooltip>
            </Box>
          </Stack>
        </Paper>

        {/* 加密设置卡片 */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SecurityIcon fontSize="small" />
                {/* 加密设置 */}
                {t("settings.encryption.title")}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {appSettings?.enableEncryption && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setEncryptionDialogOpen(true)}
                    startIcon={<TuneIcon />}
                  >
                    {/* 加密选项 */}
                    {t("settings.encryption.options")}
                  </Button>
                )}
                <FormControlLabel
                  control={
                    <Switch
                      disabled={devices.length === 0}
                      checked={appSettings?.enableEncryption || false}
                      onChange={(e) => handleEncryptionToggle(e.target.checked)}
                      size="small"
                    />
                  }
                  label={t("settings.encryption.enable")}
                  sx={{ userSelect: "none", mr: 0 }}
                />
              </Stack>
            </Box>

            {/* 根据算法的对应长度检测 key 是否有效 */}
            {appSettings?.enableEncryption &&
              (() => {
                const algorithm = appSettings?.encryptionConfig?.algorithm;
                const key = appSettings?.encryptionConfig?.key || "";
                let isValid = false;

                switch (algorithm) {
                  case "AES256":
                    isValid = /^[A-Za-z0-9]{32}$/.test(key);
                    break;
                  case "AES192":
                    isValid = /^[A-Za-z0-9]{24}$/.test(key);
                    break;
                  case "AES128":
                    isValid = /^[A-Za-z0-9]{16}$/.test(key);
                    break;
                }

                return (
                  <Alert
                    severity={isValid ? "success" : "error"}
                    sx={{ mt: 1 }}
                  >
                    <Typography variant="body2">
                      {isValid
                        ? /* 密钥有效 */
                          t("settings.encryption.key_valid")
                        : /* 密钥无效 */
                          t("settings.encryption.key_invalid")}
                    </Typography>
                  </Alert>
                );
              })()}
          </Stack>
        </Paper>
        {/* 功能设置卡片 */}
        <FeatureSettings
          devices={devices}
          onError={setError}
          onToast={(message) => setToast({ open: true, message })}
        />

        {/* 系统通知设置 */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <NotificationsNoneIcon />
                {/* 系统通知设置 */}
                {t("settings.system_notifications.title")}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                {/* 保留必要通知开关 */}
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={appSettings?.keepEssentialNotifications ?? false}
                      onChange={(e) =>
                        handleKeepEssentialNotificationsToggle(e.target.checked)
                      }
                    />
                  }
                  label={t("settings.system_notifications.keep_essential")}
                  sx={{
                    userSelect: "none",
                    pointerEvents:
                      appSettings?.enableSystemNotifications ?? false
                        ? "auto"
                        : "none",
                    opacity:
                      appSettings?.enableSystemNotifications ?? false ? 1 : 0.5,
                    mr: 0,
                  }}
                />
                {/* 系统通知开关 */}
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={appSettings?.enableSystemNotifications ?? false}
                      onChange={(e) =>
                        handleSystemNotificationsToggle(e.target.checked)
                      }
                    />
                  }
                  label={t("settings.system_notifications.enable")}
                  sx={{ userSelect: "none", mr: 0 }}
                />
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* 快捷键设置 */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <KeyboardIcon />
                {/* 快捷键 */}
                {t("settings.shortcuts.title")}
              </Typography>
              <IconButton
                onClick={(event) => setShortcutGuideAnchor(event.currentTarget)}
                size="small"
                sx={{
                  color: "text.secondary",
                }}
              >
                <InfoIcon />
              </IconButton>
            </Box>

            <Popover
              open={Boolean(shortcutGuideAnchor)}
              anchorEl={shortcutGuideAnchor}
              onClose={() => setShortcutGuideAnchor(null)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
            >
              <Box sx={{ p: 2, maxWidth: 320 }}>
                <Typography variant="body2" gutterBottom>
                  {t("settings.shortcuts.guide")}
                </Typography>

                {browserType === "firefox" && (
                  <Typography variant="body2" gutterBottom>
                    {t("settings.shortcuts.guide_firefox")}
                  </Typography>
                )}

                <Box
                  sx={{
                    mt: 2,
                    p: 1,
                    backgroundColor: "text.secondary",
                    color: "background.paper",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      wordBreak: "break-all",
                    }}
                  >
                    {browserType === "firefox"
                      ? "about:addons"
                      : `${
                          browserType === "chrome" ? "chrome" : "edge"
                        }://extensions/shortcuts`}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleCopyShortcutUrl}
                    sx={{ flexShrink: 0 }}
                    color="inherit"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Popover>
            <Alert
              icon={<InfoIcon />}
              severity="info"
              sx={{
                "& .MuiAlert-message": {
                  width: "100%",
                },
              }}
            >
              <Typography variant="body2" component="div" gutterBottom>
                {/* 打开推送窗口: {{key}} */}
                {t("settings.shortcuts.open_window", {
                  key: shortcutKeys.openExtension,
                })}
              </Typography>
            </Alert>
          </Stack>
        </Paper>

        {/* DNS查询 */}
        <DnsQueryCard
          onToast={(message) => setToast({ open: true, message })}
          onError={setError}
        />

        {/* 备份/还原配置卡片 */}
        <BackupRestoreCard
          devices={devices}
          defaultDeviceId={defaultDeviceId}
          onSettingsChange={onSettingsChange}
          onAddDevice={onAddDevice}
          onEditDevice={onEditDevice}
          onSetDefaultDevice={onSetDefaultDevice}
          onThemeChange={onThemeChange}
        />

        {/* 版本 */}
        {version && (
          <Stack
            sx={{
              textAlign: "center",
              position: "sticky",
              width: "100%",
              bottom: "8px",
              zIndex: 1,
              opacity: 0.5,
              mt: 4,
              mb: 2,
            }}
            gap={0.3}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              gap={0.6}
            >
              <Typography variant="caption" color="text.secondary">
                <Link
                  onClick={() =>
                    window.open("https://nolet.wzs.app/", "_blank")
                  }
                  color="inherit"
                  sx={{
                    fontSize: "0.8rem",
                    textDecoration: "none",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {t("about.version")}: v{version}
                </Link>
              </Typography>
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              gap={0.6}
              sx={{ flex: 1, color: "text.secondary" }}
            >
              <EmailIcon style={{ fontSize: "0.8rem" }} aria-label="contact" />
              <Link
                href={`mailto:${t("about.contact.email")}`}
                underline="hover"
                color="inherit"
                sx={{
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  "&:hover": { color: "primary.main" },
                }}
              >
                {t("about.contact.email")}
              </Link>
            </Stack>
          </Stack>
        )}
      </Box>

      <DeviceDialog
        open={deviceDialogOpen}
        onClose={() => {
          setDeviceDialogOpen(false);
          setEditingDevice(undefined);
        }}
        onSubmit={editingDevice ? handleEditDevice : handleAddDevice}
        editDevice={editingDevice}
        title={editingDevice ? t("device.edit") : t("device.add")}
      />

      <EncryptionDialog
        open={encryptionDialogOpen}
        config={
          appSettings?.encryptionConfig || {
            algorithm: "AES256",
            mode: "GCM",
            key: "",
          }
        }
        onClose={() => setEncryptionDialogOpen(false)}
        onSave={handleEncryptionConfigSave}
      />

      <SoundDialog
        open={soundDialogOpen}
        onClose={() => setSoundDialogOpen(false)}
        onSave={handleSoundSave}
        currentSound={appSettings?.sound || ""}
      />

      {/* Toast提示 */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        message={toast.message}
      />
    </Box>
  );
}
