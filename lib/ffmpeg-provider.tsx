"use client"
import React, { createContext, useContext, useState, ReactNode, use, useEffect } from 'react';
import { createFFmpeg, FFmpegType } from './ffmpeg-functions';

const FFmpegContext = createContext<{
    ffmpegState: FFmpegType;
    setFFmpeg: React.Dispatch<React.SetStateAction<FFmpegType>>;
} | undefined>(undefined);

export const FFmpegProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    if (typeof window === 'undefined') return <>{children}</>
    const [ffmpegState, setFFmpeg] = useState(createFFmpeg());


    return (
        <FFmpegContext.Provider value={{ ffmpegState, setFFmpeg }}>
            {children}
        </FFmpegContext.Provider>
    );
};

export const useFFmpeg = () => {
    const context = useContext(FFmpegContext);

    if (!context) {
        throw new Error('useFFmpeg must be used within a FFmpegProvider');
    }
    
    return context;
};