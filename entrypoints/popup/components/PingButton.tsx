import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import dayjs from "dayjs";
// import { useSnackbar, SnackbarKey } from "notistack";
import NetworkPingIcon from '@mui/icons-material/NetworkPing';
// import CloseIcon from '@mui/icons-material/Close';
import { Tooltip, Alert } from "@mui/material";
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
                    `${data.message?.toUpperCase() || t("common.success")} - ${t("common.delay")}: ${latency}ms`
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
        <Tooltip title={t('device.ping')} placement="bottom-start" arrow>
            <span>
                <IconButton
                    color="info"
                    onClick={handlePing}
                    disabled={loading}
                    size="small"
                >
                    <NetworkPingIcon />
                </IconButton>
            </span>
        </Tooltip>
    );
};

export default PingButton;
