import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Chip,
  Box,
  Collapse,
  Card,
  Divider,
  IconButton,
  Snackbar,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Device } from "../types";
import { validateApiURL } from "../utils/api";
import { useAppContext } from "../contexts/AppContext";
import PingButton from "./PingButton";
import GiteIcon from "@mui/icons-material/Gite";
import { useSnackbar, SnackbarKey } from "notistack";
import { Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SlideUpTransition } from "./DialogTransitions";

const COMMON_DEVICE_NAMES = ["iphone", "ipad", "mac"];
const defaultServer = "wzs.app";

// 截取第 4 个斜杠后的内容 (如果没有协议则截取第 2 个斜杠后的内容)
const truncateAfterFourthSlash = (url: string): string => {
  if (!url) return url;

  // 检查是否包含协议
  const hasProtocol = /^https?:\/\//.test(url);

  if (hasProtocol) {
    const match = url.match(/^(.*?\/.*?\/.*?\/.*?\/)/);
    return match ? match[1] : url;
  } else {
    const match = url.match(/^(.*?\/.*?\/)/);
    return match ? match[1] : url;
  }
};

interface DeviceDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    alias: string,
    apiURL: string,
    authorization?: { type: "basic"; user: string; pwd: string; value: string }
  ) => Promise<void>;
  editDevice?: Device;
  title?: string;
}

export default function DeviceDialog({
  open,
  onClose,
  onSubmit,
  editDevice,
  title,
}: DeviceDialogProps) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [deviceAlias, setDeviceAlias] = useState("");
  const [deviceApiURL, setDeviceApiURL] = useState("");

  const [basicAuthUsername, setBasicAuthUsername] = useState("");
  const [basicAuthPassword, setBasicAuthPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBasicAuthCollapsed, setIsBasicAuthCollapsed] = useState(true);

  // 当编辑设备时，填充表单
  useEffect(() => {
    if (editDevice) {
      setDeviceAlias(editDevice.alias);
      setDeviceApiURL(editDevice.apiURL);
      setBasicAuthUsername(editDevice.authorization?.user || "");
      setBasicAuthPassword(editDevice.authorization?.pwd || "");

      // 如果有认证信息，自动展开基本认证区域
      setIsBasicAuthCollapsed(!editDevice.authorization);
    } else {
      setDeviceAlias("");
      setDeviceApiURL("");
      setBasicAuthUsername("");
      setBasicAuthPassword("");
      setIsBasicAuthCollapsed(true);
    }
    setError("");
  }, [editDevice, open]);

  const handleSubmit = async () => {
    let finalApiURL = deviceApiURL.trim();
    const shortUuidRegex = /^[A-HJ-NP-Za-km-z2-9]{22}$/;

    // 1. 如果是纯 UUID (22位)，补全为官方 URL
    if (shortUuidRegex.test(finalApiURL)) {
      finalApiURL = `https://${defaultServer}/${finalApiURL}/`;
    } else {
      // 2. 如果没有协议，补全 https://
      if (!/^https?:\/\//.test(finalApiURL)) {
        finalApiURL = `https://${finalApiURL}`;
      }

      // 3. 检查是否为官方域名
      if (finalApiURL.includes(defaultServer)) {
        // 如果是官方域名，执行标准的提取逻辑 (处理可能的参数或多余路径)

        // 这里复用之前的 switch 逻辑来提取 UUID，以确保官方 URL 的格式统一
        let deviceKey: string | null = null;
        let origin = `https://${defaultServer}`;

        // 尝试从 URL 中提取 22 位 UUID
        const containUuidRegex = /(?:^|\/)([A-HJ-NP-Za-km-z2-9]{22})(?:\/|$)/;
        const match = finalApiURL.match(containUuidRegex);

        if (match) {
          deviceKey = match[1];
          try {
            const url = new URL(finalApiURL);
            origin = url.origin;
          } catch {
            // ignore
          }
          finalApiURL = `${origin}/${deviceKey}/`;
        } else {
          // 如果无法提取 UUID，但包含 wzs.app，尝试做截取
          finalApiURL = truncateAfterFourthSlash(finalApiURL);
        }
      }
      // 4. 如果是非官方域名，保留用户输入的完整 URL (不做特殊处理，只要通过校验即可)
    }

    if (!validateApiURL(finalApiURL)) {
      setError(t("device.api_url_invalid"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      let authorization;
      if (basicAuthUsername.trim() && basicAuthPassword.trim()) {
        const credentials = btoa(
          `${basicAuthUsername.trim()}:${basicAuthPassword.trim()}`
        );
        authorization = {
          type: "basic" as const,
          user: basicAuthUsername.trim(),
          pwd: basicAuthPassword.trim(),
          value: `Basic ${credentials}`,
        };
      }

      await onSubmit(deviceAlias.trim(), finalApiURL, authorization);

      onClose();
    } catch (error) {
      setError(
        t("common.operation_failed", {
          message:
            error instanceof Error ? error.message : t("common.error_unknown"),
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (
    severity: "info" | "error" | "success" | "warning",
    message: string
  ) => {
    enqueueSnackbar("", {
      autoHideDuration: 3000,
      anchorOrigin: { vertical: "top", horizontal: "right" },
      content: (key: SnackbarKey) => (
        <Alert
          severity={severity}
          sx={{ width: "100%" }}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => closeSnackbar(key)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {message}
        </Alert>
      ),
    });
  };

  // 判断是否显示自建服务器提示
  const showSelfHostedWarning = !deviceApiURL.includes(defaultServer);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slots={{
        transition: SlideUpTransition,
      }}
      keepMounted
    >
      <DialogTitle>
        {title || t(editDevice ? "device.edit" : "device.add")}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t("device.api_url")}
            placeholder={t("device.api_url_placeholder")}
            value={deviceApiURL}
            onChange={(e) => {
              setDeviceApiURL(e.target.value);
              setError("");
            }}
            variant="outlined"
            fullWidth
            multiline
            rows={2}
            error={
              !!error &&
              (error === t("device.api_url_invalid") ||
                error === t("device.device_key_invalid"))
            }
            helperText={
              error === t("device.api_url_invalid") ||
              error === t("device.device_key_invalid")
                ? error
                : t("device.api_url_helper")
            }
          />

          <Stack sx={{ px: 0 }}>
            <Box>
              <TextField
                label={t("device.name")}
                placeholder={t("device.name_placeholder")}
                value={deviceAlias}
                onChange={(e) => setDeviceAlias(e.target.value)}
                variant="outlined"
                fullWidth
                helperText={t("device.name_helper")}
              />
              {!editDevice && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {COMMON_DEVICE_NAMES.map((name) => (
                    <Chip
                      key={name}
                      label={t(`device.common_names.${name}`)}
                      onClick={() =>
                        setDeviceAlias(t(`device.common_names.${name}`))
                      }
                      variant="outlined"
                      color="primary"
                      size="small"
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
          {error &&
            error !== t("device.api_url_invalid") &&
            error !== t("device.device_key_invalid") && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}

          {/* Basic Auth 认证区域 - 只有在明确是自建服务器(非wzs.app) 或者 开启了全局开关时才显示 */}
          {/* 或者只要 URL 不是空的，且不是 wzs.app，就显示? 或者默认隐藏，用户可以展开 */}
          {/* 这里逻辑稍微调整：始终允许展开，但默认折叠 */}
          <Box sx={{ display: "block" }}>
            <Divider sx={{ mb: 0.5, px: 1.5, userSelect: "none" }}>
              <Box
                sx={{
                  fontSize: "0.625rem",
                  cursor: "pointer",
                }}
                onClick={() => setIsBasicAuthCollapsed(!isBasicAuthCollapsed)}
              >
                {t("device.basic_auth.title")}
              </Box>
            </Divider>
            <Collapse in={!isBasicAuthCollapsed}>
              <Card>
                <Stack direction="column" gap={1.5} sx={{ px: 2, py: 1.5 }}>
                  <TextField
                    label={t("device.basic_auth.username")}
                    placeholder={t("device.basic_auth.username_placeholder")}
                    value={basicAuthUsername}
                    onChange={(e) => setBasicAuthUsername(e.target.value)}
                    variant="standard"
                    size="small"
                    fullWidth
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                  <TextField
                    label={t("device.basic_auth.password")}
                    placeholder={t("device.basic_auth.password_placeholder")}
                    type="text"
                    value={basicAuthPassword}
                    onChange={(e) => setBasicAuthPassword(e.target.value)}
                    variant="standard"
                    size="small"
                    fullWidth
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                </Stack>
              </Card>
            </Collapse>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" gap={1} sx={{ mr: "auto", px: 1.5 }}>
          <PingButton apiURL={deviceApiURL} showAlert={showAlert} />
        </Stack>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          color="primary"
          disabled={loading || !deviceAlias.trim() || !deviceApiURL.trim()}
        >
          {loading
            ? t("common.processing")
            : editDevice
            ? t("common.save")
            : t("common.add")}
        </Button>
      </DialogActions>

      {/* 自建服务器安全提醒 */}
      {showSelfHostedWarning && (
        <Snackbar
          open
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{ cursor: "default" }}
        >
          <Alert
            icon={<GiteIcon fontSize="inherit" />}
            severity="warning"
            variant="standard"
            sx={{ width: "100%" }}
          >
            {t(
              editDevice
                ? "device.self_hosted_tip_edit"
                : "device.self_hosted_tip"
            )}
          </Alert>
        </Snackbar>
      )}
    </Dialog>
  );
}
