import React from "react";
import {
  Box,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import { SlideUpTransition } from "./DialogTransitions";
import LinkIcon from "@mui/icons-material/Link";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import { useTranslation } from "react-i18next";
import { Device } from "../types";
import DeviceSelectV2 from "./DeviceSelectV2";
import { sendPushMessage } from "../utils/api";
import { generateID } from "../../shared/push-service";

interface UrlDialogMainProps {
  open: boolean;
  onClose: () => void;
  urlParams: {
    url?: string;
    title?: string;
    selectionText?: string;
    linkUrl?: string;
    linkText?: string;
  };
  selectedDevices: Device[];
  devices: Device[];
  onDevicesChange: (devices: Device[]) => void;
  onDeviceAdd: () => void;
  onSuccess: (message: string, uuid: string) => void;
  onError: (error: string) => void;
  defaultDevice?: Device | null;
}

interface SendOptionProps {
  icon: React.ReactNode;
  primary: string;
  secondary: string;
  onClick: () => void;
  disabled: boolean;
  multiline?: boolean;
}

const SendOption = React.forwardRef<HTMLButtonElement, SendOptionProps>(
  (props, ref) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
      <Button
        ref={ref}
        onClick={props.onClick}
        disabled={props.disabled}
        variant="text" // 改为 text 变体
        fullWidth
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center", // 改为 center
          textAlign: "left",
          gap: 2, // 增加间距
          borderRadius: 3, // 更圆润的边角
          background: theme.customColors.urlDialog.optionBackground,
          boxShadow: theme.customColors.urlDialog.optionShadow,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // 更平滑的过渡
          border: isDark ? `1px solid ${theme.palette.divider}` : "none",
          "&:hover": {
            background: theme.customColors.urlDialog.optionHoverBackground,
            transform: "translateY(-2px)", // 悬停上浮效果
            boxShadow: theme.customColors.urlDialog.optionHoverShadow,
            borderColor: isDark ? theme.palette.primary.main : "transparent",
            "& .icon-box": {
              // 悬停时图标容器变化
              background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              color: "#fff",
              transform: "scale(1.1)",
            },
          },
        }}
      >
        <Box
          className="icon-box" // 添加类名以便在父级hover时选中
          sx={{
            color: "primary.main", // 图标使用主色调
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 44, // 稍微加大
            minHeight: 44,
            borderRadius: "12px", // 稍微圆角
            bgcolor: theme.customColors.urlDialog.iconBackground,
            boxShadow: theme.customColors.urlDialog.iconShadow,
            transition: "all 0.3s ease", // 图标过渡
            border: isDark
              ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              : "none",
          }}
        >
          {props.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1" // 加大字号
            sx={{
              fontWeight: 600,
              color: "text.primary",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            {props.primary}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              ...(props.multiline
                ? {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    height: "40px",
                    lineHeight: "20px",
                  }
                : {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }),
              wordBreak: "break-all",
              opacity: 0.8,
            }}
          >
            {props.secondary}
          </Typography>
        </Box>
      </Button>
    );
  }
);

export default function UrlDialogMain({
  open,
  onClose,
  urlParams,
  selectedDevices,
  devices,
  onDevicesChange,
  onDeviceAdd,
  onSuccess,
  onError,
  defaultDevice = null,
}: UrlDialogMainProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [faviconUrl, setFaviconUrl] = React.useState<string | null>(null);
  const firstOptionRef = React.useRef<HTMLButtonElement>(null);

  // 当对话框打开时，聚焦到第一个可用的选项
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (firstOptionRef.current) {
          firstOptionRef.current.focus();
        }
      }, 450); // 等待 Slide 动画完成
      return () => clearTimeout(timer);
    }
  }, [open]);

  // 预加载favicon
  React.useEffect(() => {
    if (open && urlParams.url) {
      const runtime =
        (window as any).chrome?.runtime || (window as any).browser?.runtime;
      if (runtime) {
        runtime
          .sendMessage({
            action: "prefetchFavicon",
            url: urlParams.url,
          })
          .then((response: any) => {
            if (response?.success && response?.faviconUrl) {
              setFaviconUrl(response.faviconUrl);
            }
          })
          .catch((error: any) => {
            console.debug("预加载favicon失败:", error);
          });
      }
    } else if (!open) {
      // 重置favicon状态
      setFaviconUrl(null);
    }
  }, [open, urlParams.url]);

  // 获取第一个可用选项的 ref
  const getFirstOptionRef = (index: number) => {
    if (index === 0) {
      return firstOptionRef;
    }
    return undefined;
  };

  // 发送页面 URL
  const handleSendPageUrl = async () => {
    if (selectedDevices.length === 0 || !urlParams.url) return;

    setLoading(true);
    try {
      const pushUuid = generateID();
      const response = await sendPushMessage(
        selectedDevices[0],
        urlParams.url,
        undefined,
        pushUuid,
        urlParams.title || "Web",
        undefined,
        undefined,
        selectedDevices,
        faviconUrl || undefined
      );

      if (response.code === 200) {
        onClose();
        onSuccess(urlParams.url, pushUuid);
      } else {
        onError(t("push.errors.send_failed", { message: response.message }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("common.error_unknown");
      const finalMessage = errorMessage.startsWith("utils.api.")
        ? t(errorMessage)
        : errorMessage;
      onError(t("push.errors.send_failed", { message: finalMessage }));
    } finally {
      setLoading(false);
    }
  };

  // 发送选中文本
  const handleSendSelectedText = async () => {
    if (selectedDevices.length === 0 || !urlParams.selectionText) return;

    setLoading(true);
    try {
      const pushUuid = generateID();
      const response = await sendPushMessage(
        selectedDevices[0],
        urlParams.selectionText || urlParams.title || "Text",
        undefined,
        pushUuid,
        urlParams.title || "Text",
        undefined,
        undefined,
        selectedDevices,
        faviconUrl || undefined
      );

      if (response.code === 200) {
        onClose();
        onSuccess(urlParams.selectionText, pushUuid);
      } else {
        onError(t("push.errors.send_failed", { message: response.message }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("common.error_unknown");
      const finalMessage = errorMessage.startsWith("utils.api.")
        ? t(errorMessage)
        : errorMessage;
      onError(t("push.errors.send_failed", { message: finalMessage }));
    } finally {
      setLoading(false);
    }
  };

  // 发送链接
  const handleSendLink = async () => {
    if (selectedDevices.length === 0 || !urlParams.linkUrl) return;

    setLoading(true);
    try {
      const pushUuid = generateID();
      const response = await sendPushMessage(
        selectedDevices[0],
        urlParams.linkUrl,
        undefined,
        pushUuid,
        urlParams.title || "Link",
        undefined,
        undefined,
        selectedDevices,
        faviconUrl || undefined
      );

      if (response.code === 200) {
        onClose();
        onSuccess(urlParams.linkUrl, pushUuid);
      } else {
        onError(t("push.errors.send_failed", { message: response.message }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("common.error_unknown");
      const finalMessage = errorMessage.startsWith("utils.api.")
        ? t(errorMessage)
        : errorMessage;
      onError(t("push.errors.send_failed", { message: finalMessage }));
    } finally {
      setLoading(false);
    }
  };

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
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        <Typography variant="h6" component="div" fontWeight="bold">
          {t("push.url_dialog.title")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("push.url_dialog.info")}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <DeviceSelectV2
              devices={devices}
              selectedDevices={selectedDevices}
              onDevicesChange={onDevicesChange}
              onAddClick={onDeviceAdd}
              defaultDevice={defaultDevice}
            />
          </Box>

          <Stack spacing={2}>
            {[
              urlParams.linkUrl && {
                icon: <LinkIcon />,
                primary: t("push.url_dialog.send_link"),
                secondary: urlParams.linkText || urlParams.linkUrl,
                onClick: handleSendLink,
              },
              urlParams.url && {
                icon: <LinkIcon />,
                primary: t("push.url_dialog.send_current_page"),
                secondary: urlParams.title || urlParams.url,
                onClick: handleSendPageUrl,
              },
              urlParams.selectionText?.trim() && {
                icon: <TextFieldsIcon />,
                primary: t("push.url_dialog.send_selected_text"),
                secondary: urlParams.selectionText,
                onClick: handleSendSelectedText,
                multiline: true,
              },
            ]
              .filter(Boolean)
              .map(
                (option, index) =>
                  option && (
                    <SendOption
                      key={option.primary}
                      ref={getFirstOptionRef(index)}
                      icon={option.icon}
                      primary={option.primary}
                      secondary={option.secondary}
                      onClick={option.onClick}
                      disabled={loading || selectedDevices.length === 0}
                      multiline={option.multiline}
                    />
                  )
              )}
          </Stack>

          {loading && (
            <Box display="flex" justifyContent="center">
              <LinearProgress sx={{ width: "100%", borderRadius: 1 }} />
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button
          onClick={() => {
            onClose();
            window.close();
          }}
          color="inherit"
          sx={{ color: "text.secondary" }}
        >
          {t("common.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
