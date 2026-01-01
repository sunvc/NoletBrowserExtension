import React from "react";
import { Box, Stack, GlobalStyles, useTheme } from "@mui/material";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({
  children,
}: LayoutProps) {
  const theme = useTheme();
  const isOverlay =
    new URLSearchParams(window.location.search).get("mode") === "overlay" ||
    window.self !== window.top; // 兼容性增强：如果在 iframe 中，也视为 overlay 模式

  React.useEffect(() => {
    // 根据用户要求，使用 document.querySelector 设置圆角
    const container = document.querySelector(".popup-container") as HTMLElement;
    if (container) {
      container.style.borderRadius = "24px";
      container.style.overflow = "hidden";
    }
  }, []);

  return (
    <Box
      className="popup-container"
      sx={{
        width: "100%",
        height: "100vh",
        minWidth: 380,
        minHeight: 600,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "background.paper",
        borderRadius: isOverlay ? "24px" : 0, // 在 Overlay 模式下强制应用圆角
      }}
    >
      <GlobalStyles
        styles={{
          html: {
            backgroundColor: isOverlay
              ? "transparent"
              : theme.palette.background.paper,
          },
          body: {
            backgroundColor: isOverlay
              ? "transparent"
              : theme.palette.background.paper,
          },
        }}
      />
      {/* 主要内容区域：内容 */}
      <Stack
        sx={{
          height: "100%",
          flex: 1,
          minHeight: 0, // 确保Stack能够正确收缩
        }}
      >
        {/* 主内容区域 */}
        <Box
          sx={{
            flex: "1 1 0%",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0, // 确保内容区域能够正确收缩
            p: 0,
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
