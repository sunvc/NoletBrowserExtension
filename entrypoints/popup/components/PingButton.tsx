import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import dayjs from "dayjs";
// import { useSnackbar, SnackbarKey } from "notistack";
import NetworkPingIcon from "@mui/icons-material/NetworkPing";
// import CloseIcon from '@mui/icons-material/Close';
import { Tooltip, Alert, SvgIcon } from "@mui/material";
import { useTranslation } from "react-i18next";

interface PingButtonProps {
  apiURL: string;
  showAlert: (severity: "success" | "error", message: string) => void;
}

const PingButton: React.FC<PingButtonProps> = ({ apiURL, showAlert }) => {
  // const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // const showAlert = (
  //     severity: "success" | "error",
  //     message: string
  // ) => {
  //     enqueueSnackbar("", {
  //         autoHideDuration: 3000,
  //         anchorOrigin: { vertical: 'top', horizontal: 'right' },
  //         content: (key: SnackbarKey) => (
  //             <Alert
  //                 severity={severity}
  //                 sx={{ width: "100%" }}
  //                 action={
  //                     <IconButton
  //                         size="small"
  //                         color="inherit"
  //                         onClick={() => closeSnackbar(key)}
  //                     >
  //                         <CloseIcon fontSize="small" />
  //                     </IconButton>
  //                 }
  //             >
  //                 {message}
  //             </Alert>
  //         ),
  //     });
  // };

  const handlePing = async () => {
    const pingURL = new URL(apiURL).origin + "/ping";
    const startTime = dayjs();
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000); // 10s 超时

    try {
      const response = await fetch(pingURL, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      const endTime = dayjs();
      const latency = endTime.diff(startTime, "millisecond");

      if (data.code?.toString().startsWith("2")) {
        showAlert(
          "success",
          `${data.message?.toUpperCase() || t("common.success")} - ${t(
            "common.delay"
          )}: ${latency}ms`
        );
      } else {
        showAlert(
          "error",
          `[${data.code}] ${data.message || t("common.failed")}`
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        showAlert("error", t("common.timeout") || "Request Timeout (10s)");
      } else {
        showAlert(
          "error",
          `${t("common.failed")} ${error.message || t("common.error_network")}`
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <Tooltip title={t("device.ping")} placement="bottom-start" arrow>
      <span>
        <IconButton
          color="info"
          onClick={handlePing}
          disabled={loading}
          size="small"
        >
          <SvgIcon viewBox="0 0 1024 1024">
            <path d="M389.504 317.696a41.6 41.6 0 0 1 0-58.88l81.728-81.728q77.824-77.76 187.84-77.76t187.776 77.76q77.824 77.824 77.824 187.84t-77.824 187.776l-81.728 81.728a41.6 41.6 0 1 1-58.88-58.752l81.792-81.792q53.44-53.44 53.44-128.96 0-75.584-53.44-129.024-53.44-53.376-128.96-53.376-75.52 0-128.96 53.376L448.32 317.696a41.6 41.6 0 0 1-58.88 0z m194.816 63.104L380.672 584.448a41.6 41.6 0 1 0 58.816 58.88l203.648-203.712a41.6 41.6 0 1 0-58.88-58.88zM317.44 448.64L235.84 530.048q-53.376 53.44-53.376 129.024 0 75.52 53.376 128.96 53.44 53.44 129.024 53.44 75.52 0 128.96-53.44L575.36 706.56a41.6 41.6 0 1 1 58.816 58.88l-81.472 81.408q-77.76 77.824-187.776 77.824-110.08 0-187.84-77.824-77.76-77.76-77.76-187.776 0-110.08 77.76-187.84L258.56 389.76a41.6 41.6 0 0 1 58.88 58.88z" />
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default PingButton;
