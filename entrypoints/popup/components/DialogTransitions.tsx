import React from 'react';
import Slide from '@mui/material/Slide';
import Grow from '@mui/material/Grow';
import { TransitionProps } from '@mui/material/transitions';

export type SlideDirection = 'up' | 'down' | 'left' | 'right';

export const GrowTransition = React.forwardRef(function GrowTransition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Grow ref={ref} {...props} />;
});

export const SlideTransition = (direction: SlideDirection = 'up') =>
    React.forwardRef(function SlideTransition(
        props: TransitionProps & {
            children: React.ReactElement<any, any>;
        },
        ref: React.Ref<unknown>,
    ) {
        return <Slide direction={direction} ref={ref} {...props} />;
    });

export const SlideUpTransition = SlideTransition('up');
export const SlideDownTransition = SlideTransition('down');
export const SlideLeftTransition = SlideTransition('left');
export const SlideRightTransition = SlideTransition('right');
