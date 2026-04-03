import { PrimeReactLocaleSetup } from '@/layout/context/PrimeReactLocaleSetup';
import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';
import { LoadingProvider } from '@/layout/context/loadingcontext';
import { ToastProvider } from '@/hooks/useToast';
import { ConfirmProvider } from '@/hooks/useConfirm';
import { ModalProvider } from '@/hooks/useCustomModal';
import KakaoScript from '@/components/KakaoScript';
import { GlobalLoading } from '@/layout/GlobalLoading';
import NotificationListener from '@/components/chat/NotificationListener';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import { Metadata, Viewport } from 'next';
import DynamicManifest from '@/components/DynamicManifest';

export const viewport: Viewport = {
    themeColor: '#ffffff',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
};

export const metadata: Metadata = {
    title: 'AMS',
    description: '학원 관리 시스템',
    appleWebApp: {
        capable: true,
        title: 'AMS',
        statusBarStyle: 'default'
    },
    formatDetection: {
        telephone: false
    }
};

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link id="theme-css" href={`/themes/lara-light-indigo/theme.css`} rel="stylesheet"></link>
            </head>
            <body>
                <DynamicManifest />
                <KakaoScript />
                <PrimeReactProvider>
                    <PrimeReactLocaleSetup />
                    <LayoutProvider>
                        <ToastProvider>
                            <LoadingProvider>
                                <ConfirmProvider>
                                    <ModalProvider>
                                        {children}
                                        <GlobalLoading />
                                        <PwaInstallPrompt />
                                    </ModalProvider>
                                    <NotificationListener />
                                </ConfirmProvider>
                            </LoadingProvider>
                        </ToastProvider>
                    </LayoutProvider>
                </PrimeReactProvider>
            </body>
        </html>
    );
}
