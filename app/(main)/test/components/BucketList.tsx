'use client';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Bucket } from '@supabase/storage-js';
import { getColumns } from '@/util/columns';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
type ClientComponentProps = {
    initialData: Bucket[];
};

const BucketList = ({ initialData }: ClientComponentProps) => {
    const { get } = useHttp();
    const { showToast } = useToast();
    const columns = getColumns(initialData);
    const header = <Button icon="pi pi-refresh" rounded raised />;
    const fetchData = () => {
        console.log('응?');
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: '으아아아아'
        });
        // const res = await get('/app/listBuckets');
        // console.log(res);
    };
    return (
        <div className="card">
            <DataTable value={initialData} header={header} tableStyle={{ minWidth: '50rem' }} onClick={fetchData}>
                {columns?.map((item) => (
                    <Column key={item.field} field={item.field} header={item.field} />
                ))}
            </DataTable>
        </div>
    );
};

export default BucketList;
