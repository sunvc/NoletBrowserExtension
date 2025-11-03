import React, { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_light';

export interface LottiePlayerProps {
    src?: string;
    animationData?: any;
    autoplay?: boolean;
    loop?: boolean;
    speed?: number;
    direction?: 1 | -1;
    style?: React.CSSProperties;
    className?: string;
    onComplete?: () => void;
    onLoopComplete?: () => void;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

export interface LottiePlayerRef {
    play: () => void;
    pause: () => void;
    stop: () => void;
    setSpeed: (speed: number) => void;
    setDirection: (direction: 1 | -1) => void;
    goToAndStop: (value: number, isFrame?: boolean) => void;
    goToAndPlay: (value: number, isFrame?: boolean) => void;
    playSegments: (segments: [number, number] | [number, number][], forceFlag?: boolean) => void;
    destroy: () => void;
    getDuration: (inFrames?: boolean) => number;
    getCurrentTime: (inFrames?: boolean) => number;
    getTotalFrames: () => number;
    getAnimationItem: () => AnimationItem | null;
}

const LottiePlayer = forwardRef<LottiePlayerRef, LottiePlayerProps>(
    (
        {
            src,
            animationData,
            autoplay = false,
            loop = false,
            speed = 1,
            direction = 1,
            style,
            className,
            onComplete,
            onLoopComplete,
            onLoad,
            onError,
        },
        ref
    ) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const animationRef = useRef<AnimationItem | null>(null);
        const isLoadingRef = useRef(false); // 防止重复加载
        const isMountedRef = useRef(true); // 追踪组件是否已挂载

        // 清理动画实例的函数
        const cleanupAnimation = useCallback(() => {
            if (animationRef.current) {
                try {
                    animationRef.current.destroy();
                } catch (error) {
                    console.warn('清理动画实例时出错:', error);
                }
                animationRef.current = null;
            }
            // 清空容器内容
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        }, []);

        // 暴露方法给父组件
        useImperativeHandle(ref, () => ({
            play: () => {
                animationRef.current?.play();
            },
            pause: () => {
                animationRef.current?.pause();
            },
            stop: () => {
                animationRef.current?.stop();
            },
            setSpeed: (newSpeed: number) => {
                animationRef.current?.setSpeed(newSpeed);
            },
            setDirection: (newDirection: 1 | -1) => {
                animationRef.current?.setDirection(newDirection);
            },
            goToAndStop: (value: number, isFrame = false) => {
                animationRef.current?.goToAndStop(value, isFrame);
            },
            goToAndPlay: (value: number, isFrame = false) => {
                animationRef.current?.goToAndPlay(value, isFrame);
            },
            playSegments: (segments: [number, number] | [number, number][], forceFlag = false) => {
                animationRef.current?.playSegments(segments as any, forceFlag);
            },
            destroy: () => {
                cleanupAnimation();
            },
            getDuration: (inFrames = false) => {
                if (!animationRef.current) return 0;
                return inFrames
                    ? animationRef.current.totalFrames
                    : animationRef.current.totalFrames / animationRef.current.frameRate;
            },
            getCurrentTime: (inFrames = false) => {
                if (!animationRef.current) return 0;
                return inFrames
                    ? animationRef.current.currentFrame
                    : animationRef.current.currentFrame / animationRef.current.frameRate;
            },
            getTotalFrames: () => {
                return animationRef.current?.totalFrames || 0;
            },
            getAnimationItem: () => {
                return animationRef.current;
            },
        }), [cleanupAnimation]);

        // 加载动画数据
        const loadAnimation = useCallback(async () => {
            if (!containerRef.current || isLoadingRef.current || !isMountedRef.current) return;

            try {
                isLoadingRef.current = true; // 设置加载标志

                // 清理之前的动画
                cleanupAnimation();

                let data = animationData;

                // 如果提供的是 URL，则从网络加载
                if (src && !animationData) {
                    const response = await fetch(src);
                    if (!response.ok) {
                        throw new Error(`加载动画失败: ${response.status} ${response.statusText}`);
                    }
                    data = await response.json();
                }

                if (!data) {
                    throw new Error('未提供动画数据或 URL');
                }

                // 再次检查容器是否还存在以及组件是否还挂载
                if (!containerRef.current || !isMountedRef.current) {
                    return;
                }

                // 创建 lottie 动画实例
                const animation = lottie.loadAnimation({
                    container: containerRef.current,
                    renderer: 'svg', // lottie_light 仅支持 svg 渲染器
                    loop,
                    autoplay,
                    animationData: data,
                });

                // 只有在组件仍然挂载时才设置动画实例
                if (isMountedRef.current) {
                    animationRef.current = animation;

                    // 设置初始属性
                    animation.setSpeed(speed);
                    animation.setDirection(direction);

                    // 绑定事件监听器
                    animation.addEventListener('complete', () => {
                        onComplete?.();
                    });

                    animation.addEventListener('loopComplete', () => {
                        onLoopComplete?.();
                    });

                    animation.addEventListener('DOMLoaded', () => {
                        onLoad?.();
                    });

                    animation.addEventListener('data_ready', () => {
                        onLoad?.();
                    });

                    onLoad?.();
                } else {
                    // 如果组件已经卸载，立即清理动画
                    animation.destroy();
                }

            } catch (error) {
                console.error('Lottie 动画加载错误:', error);
                onError?.(error instanceof Error ? error : new Error('未知错误'));
            } finally {
                isLoadingRef.current = false; // 重置加载标志
            }
        }, [src, animationData, loop, autoplay, speed, direction, cleanupAnimation, onComplete, onLoopComplete, onLoad, onError]);

        // 监听属性变化
        useEffect(() => {
            if (animationRef.current) {
                animationRef.current.setSpeed(speed);
            }
        }, [speed]);

        useEffect(() => {
            if (animationRef.current) {
                animationRef.current.setDirection(direction);
            }
        }, [direction]);

        useEffect(() => {
            if (animationRef.current) {
                if (loop) {
                    animationRef.current.loop = true;
                } else {
                    animationRef.current.loop = false;
                }
            }
        }, [loop]);

        // 单独处理 autoplay 变化
        useEffect(() => {
            if (animationRef.current) {
                if (autoplay) {
                    animationRef.current.play();
                } else {
                    animationRef.current.pause();
                }
            }
        }, [autoplay]);

        // 初始化和清理
        useEffect(() => {
            isMountedRef.current = true;
            loadAnimation();

            // 清理函数
            return () => {
                isMountedRef.current = false;
                cleanupAnimation();
            };
        }, [loadAnimation, cleanupAnimation]);

        return (
            <div
                ref={containerRef}
                className={className}
                style={{
                    width: '100%',
                    height: '100%',
                    ...style,
                }}
            />
        );
    }
);

LottiePlayer.displayName = 'LottiePlayer';

export default LottiePlayer; 