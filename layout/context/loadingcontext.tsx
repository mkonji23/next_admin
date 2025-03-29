import React, { useState, createContext, useContext } from 'react';
import { ChildContainerProps } from '@/types';
import { LoadingContextProps } from '@/types/layout';

const LoadingContext = createContext({} as LoadingContextProps);

export const LoadingProvider = ({ children }: ChildContainerProps) => {
    const [loading, setLoading] = useState(false);

    const value = {
        loading,
        setLoading
    };

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export const useLoading = () => useContext(LoadingContext);
