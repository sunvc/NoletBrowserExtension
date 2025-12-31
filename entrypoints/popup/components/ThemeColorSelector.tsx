import React, { useState } from "react";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Popover,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { ThemeColor } from "../types";
import CircleIcon from "@mui/icons-material/Circle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PaletteIcon from "@mui/icons-material/Palette";
import { useAppContext } from "../contexts/AppContext";

interface ThemeColorSelectorProps {
  themeColor: ThemeColor;
  onThemeColorChange: (color: ThemeColor) => void;
}

const colors: { value: ThemeColor; color: string }[] = [
  { value: "orange", color: "#EA580C" },
  { value: "blue", color: "#2563EB" },
  { value: "green", color: "#16A34A" },
  { value: "purple", color: "#9333EA" },
];

export default function ThemeColorSelector({
  themeColor,
  onThemeColorChange,
}: ThemeColorSelectorProps) {
  const { t } = useTranslation();
  const { appSettings, updateAppSetting } = useAppContext();
  const [colorPickerAnchor, setColorPickerAnchor] =
    useState<HTMLElement | null>(null);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    updateAppSetting("customColor", newColor);
  };

  const handleCustomColorClick = (event: React.MouseEvent<HTMLElement>) => {
    if (themeColor === "custom") {
      setColorPickerAnchor(event.currentTarget);
    } else {
      onThemeColorChange("custom");
    }
  };

  const customColorValue = appSettings?.customColor || "#16A34A";

  return (
    <>
      <ToggleButtonGroup
        value={themeColor}
        exclusive
        onChange={(event, newColor) => {
          if (newColor !== null && newColor !== "custom") {
            onThemeColorChange(newColor);
          }
        }}
        aria-label="theme color"
        size="small"
        sx={{ gap: 1, border: "none", background: "transparent" }}
      >
        {colors.map((colorOption) => (
          <Tooltip
            key={colorOption.value}
            title={t(`settings.theme.${colorOption.value}`)}
          >
            <ToggleButton
              value={colorOption.value}
              aria-label={t(`settings.theme.${colorOption.value}`)}
              sx={{
                border: "none",
                borderRadius: "50% !important",
                padding: "4px",
                minWidth: "auto",
                color: colorOption.color,
                "&.Mui-selected": {
                  backgroundColor: "transparent",
                  color: colorOption.color,
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                },
                "&:hover": {
                  backgroundColor: "transparent",
                  opacity: 0.8,
                },
              }}
            >
              {themeColor === colorOption.value ? (
                <CheckCircleIcon sx={{ fontSize: 28 }} />
              ) : (
                <CircleIcon sx={{ fontSize: 28 }} />
              )}
            </ToggleButton>
          </Tooltip>
        ))}

        {/* Custom Color Option */}
        <Tooltip title={t("settings.theme.custom_color")}>
          <ToggleButton
            value="custom"
            aria-label={t("settings.theme.custom_color")}
            onClick={handleCustomColorClick}
            sx={{
              border: "none",
              borderRadius: "50% !important",
              padding: "4px",
              minWidth: "auto",
              color: customColorValue,
              "&.Mui-selected": {
                backgroundColor: "transparent",
                color: customColorValue,
                "&:hover": {
                  backgroundColor: "transparent",
                },
              },
              "&:hover": {
                backgroundColor: "transparent",
                opacity: 0.8,
              },
            }}
          >
            {themeColor === "custom" ? (
              <CheckCircleIcon sx={{ fontSize: 28 }} />
            ) : (
              <PaletteIcon sx={{ fontSize: 28 }} />
            )}
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={() => setColorPickerAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <input
            type="color"
            value={customColorValue}
            onChange={handleColorChange}
            style={{
              width: "150px",
              height: "40px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          />
        </Box>
      </Popover>
    </>
  );
}
