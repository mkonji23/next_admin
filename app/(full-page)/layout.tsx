import { Metadata } from 'next';
import AppConfig from '../../layout/AppConfig';
import React from 'react';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

export const metadata = {
    title: 'C.C.Math',
    description: 'Think First, Solve Right',
    openGraph: {
        title: 'C.C.Math',
        description: 'Think First, Solve Right',
        url: 'https://chochomath.vercel.app',
        siteName: '출석부',
        images: [
            {
                url: 'https://chochomath.vercel.app/layout/images/bae.jpg',
                width: 1200,
                height: 630
            }
        ],
        type: 'website'
    }
};

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    return (
        <React.Fragment>
            {children}
            <AppConfig simple />
        </React.Fragment>
    );
}
