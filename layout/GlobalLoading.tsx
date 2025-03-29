import { ProgressBar } from 'primereact/progressbar';
import { useLoading } from './context/loadingcontext';

export const GlobalLoading = () => {
    const { loading } = useLoading();

    return (
        <div className="w-full">
            <ProgressBar mode={loading ? 'indeterminate' : 'determinate'} style={{ height: '6px' }}></ProgressBar>
        </div>
    );
};
