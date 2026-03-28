import { useEffect } from 'react';

export const useLightboxHistory = (open: boolean, setOpen: (open: boolean) => void) => {
    useEffect(() => {
        const handlePopState = () => {
            if (open) {
                setOpen(false);
            }
        };

        if (open) {
            // Push state when lightbox opens
            window.history.pushState({ lightbox: 'open' }, '', null);
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [open, setOpen]);

    const handleClose = () => {
        setOpen(false);
        // If the state is still present, the user closed via UI, so we pop the state manually
        if (window.history.state && window.history.state.lightbox === 'open') {
            window.history.back();
        }
    };

    return { handleClose };
};
