import React, { useState, useEffect, forwardRef } from 'react';
import {
    Button,
    Stack,
    Typography,
    Snackbar,
    FormControlLabel,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Box,
    Slider,
    Tooltip,
    IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimerIcon from '@mui/icons-material/Timer';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { SlideUpTransition } from './DialogTransitions';

export default function SpeedModeSetting({ disabled, simpleLabel }: { disabled: boolean; simpleLabel?: string }) {
    const { t } = useTranslation();
    const { appSettings, updateAppSetting } = useAppContext();
    const [enableSpeedMode, setEnableSpeedMode] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [countdownTime, setCountdownTime] = useState<number>(3000);

    useEffect(() => {
        setEnableSpeedMode(appSettings?.enableSpeedMode || false);
        setCountdownTime(appSettings?.speedModeCountdown || 3000);
    }, [appSettings]);

    const handleEnableChange = (enabled: boolean) => {
        if (enabled) {
            // 启用时打开确认对话框
            setDialogOpen(true);
        } else {
            // 关闭时直接保存
            setEnableSpeedMode(false);
            updateAppSetting('enableSpeedMode', false);
        }
    };

    const handleConfirmEnable = async () => {
        try {
            setSaving(true);
            setEnableSpeedMode(true);
            await updateAppSetting('enableSpeedMode', true);
            await updateAppSetting('speedModeCountdown', countdownTime);
            setSaving(false);
            setDialogOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('settings.speed_mode.save_failed');
            setError(errorMessage);
            setSaving(false);
        }
    };

    const handleCloseDialog = () => {
        // 取消时不改变开关状态
        setDialogOpen(false);
    };

    const handleCountdownChange = (event: Event, newValue: number | number[]) => {
        setCountdownTime(newValue as number);
    };

    const handleCountdownSave = async () => {
        try {
            await updateAppSetting('speedModeCountdown', countdownTime);
        } catch (error) {
            console.error('保存倒计时配置失败:', error);
        }
    };

    return (
      <>
        {import.meta.env.BROWSER !== "safari" && (
          <FormControlLabel
            control={
              <Switch
                checked={enableSpeedMode}
                onChange={(e) => handleEnableChange(e.target.checked)}
                disabled={disabled}
              />
            }
            label={simpleLabel || t("settings.speed_mode.enable")}
            sx={{ userSelect: "none" }}
          />
        )}

        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          slots={{
            transition: SlideUpTransition,
          }}
          keepMounted
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">
                {t("settings.speed_mode.dialog_title")}
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              <Alert
                severity="warning"
                icon={<WarningAmberIcon />}
                sx={{ px: 1 }}
              >
                <Typography variant="body2">
                  {t("settings.speed_mode.warning_description")}
                </Typography>
              </Alert>

              <Box>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  fontWeight="medium"
                >
                  {t("settings.speed_mode.how_it_works_title")}
                </Typography>
                <Stack gap={1}>
                  <Typography variant="body2">
                    • {t("settings.speed_mode.feature_1")}
                  </Typography>
                  <Typography variant="body2">
                    •{" "}
                    {t("settings.speed_mode.feature_2", {
                      countdown: countdownTime / 1000,
                    })}
                  </Typography>

                  <Typography
                    variant="caption"
                    component="span"
                    color="text.secondary"
                    sx={{ pt: 1 }}
                  >
                    {t("settings.speed_mode.feature_3")}
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" alignItems="center" gap={1}>
                  <TimerIcon />
                  <Box sx={{ px: 2, flex: 1 }}>
                    <Slider
                      value={countdownTime}
                      onChange={handleCountdownChange}
                      onMouseUp={handleCountdownSave}
                      min={1000}
                      max={5000}
                      step={100}
                      marks={[
                        { value: 1000, label: "1s" },
                        { value: 3000, label: "3s" },
                        { value: 5000, label: "5s" },
                      ]}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value / 1000}s`}
                      sx={{ mt: 1 }}
                      color="warning"
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Tooltip title={t("settings.speed_mode.requirements")}>
              <IconButton size="small" sx={{ mr: "auto", ml: 1 }}>
                <InfoOutlineIcon style={{ color: "text.secondary" }} />
              </IconButton>
            </Tooltip>
            <Button onClick={handleCloseDialog}>{t("common.cancel")}</Button>
            <Button
              onClick={handleConfirmEnable}
              variant="contained"
              color="warning"
              disabled={saving}
              startIcon={<SpeedIcon />}
            >
              {saving
                ? t("common.processing")
                : t("settings.speed_mode.confirm_enable")}
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={!!error}
          autoHideDuration={3000}
          onClose={() => setError("")}
          message={error}
        />
      </>
    );
}
