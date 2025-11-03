import React, { useEffect, useRef, useState } from 'react';
import { Typography } from '@mui/material';

interface ShortcutTip {
    key?: string;
    description: string;
}

interface ShortcutTipsProps {
    tips: ShortcutTip[];
    interval?: number;
}

export default function ShortcutTips({
    tips,
    interval = 10000 // 默认10秒切换一次
}: ShortcutTipsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tips.length <= 1) return;

        const flipToNext = () => {
            setIsFlipping(true);

            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % tips.length);
            }, 250); // 动画为总时长的一半

            setTimeout(() => {
                // 重置动画状态
                setIsFlipping(false);
            }, 500); // 动画总时长
        };

        const intervalId = setInterval(flipToNext, interval);

        return () => {
            clearInterval(intervalId);
        };
    }, [tips, interval]);

    if (!tips.length) return null;

    return (
        <div
            ref={containerRef}
            style={{
                perspective: '1000px',
                height: '20px',
                overflow: 'hidden',
                marginTop: '16px',
            }}
        >
            <div
                style={{
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    transform: isFlipping ? 'rotateX(-90deg)' : 'rotateX(0deg)',
                    transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    opacity: isFlipping ? '0' : '.72',
                    transitionProperty: 'transform, opacity',
                    transitionDuration: '0.5s, 0.25s',
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94), ease-in-out',
                    filter: isFlipping ? 'brightness(0.8)' : 'brightness(1)',
                    transformOrigin: 'center center',
                }}
            >
                <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                    component="div"
                    sx={{ display: 'block' }}
                >
                    {tips[currentIndex].key ? (
                        // 快捷键 + 描述
                        <>Tips: {tips[currentIndex].key} {tips[currentIndex].description}</>
                    ) : (
                        // 纯文本内容
                        <>Tips: {tips[currentIndex].description}</>
                    )}
                </Typography>
            </div>
        </div>
    );
} 