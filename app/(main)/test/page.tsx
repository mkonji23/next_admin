import { supabaseAdmin } from '@/lib/supabaseClient';
import BucketList from './components/BucketList';

const testPage = async () => {
    const fetchData = async () => {
        const { data } = await supabaseAdmin.storage.listBuckets();
        return data;
    };

    const data = await fetchData();

    return <BucketList initialData={data ?? []} />;
};

export default testPage;
