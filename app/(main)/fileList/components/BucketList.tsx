'use client';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Bucket } from '@supabase/storage-js';
import { getColumns } from '@/util/columns';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Children, useEffect, useState } from 'react';
import { TreeTable } from 'primereact/treetable';
import { FileUpload } from 'primereact/fileupload';
type ClientComponentProps = {
    initialData: Bucket[];
};
interface FileData {
    id?: string;
    name: string;
    [key: string]: any;
}

interface TreeNode {
    key: string;
    data: FileData;
    children: TreeNode[] | null;
}
interface IBucketReq {
    bucket?: string;
    path?: string;
}
const BucketList = ({ initialData }: ClientComponentProps) => {
    const [selectedBucket, setSelectedBucket] = useState<any>({});
    const [selectedFolder, setSelectedFolder] = useState<any>({});
    const [selectedFolderKeys, setSelectedFolderKeys] = useState<any>('');
    const [trees, setTrees] = useState<any>([]);
    // api 호출
    const { get, post } = useHttp();
    // 컬럼 세팅
    const columns = getColumns(initialData);
    const treeColumns = getColumns(trees?.[0]?.data);

    // 버킷,파일 데이터 호출
    const fetchFiles = async (params: any) => {
        const res = await get('/app/listFiles', {
            params: {
                bucket: params?.['id'],
                path: params?.['path']
            } as IBucketReq
        });

        return res?.data;
    };

    // 트리구조
    const buildTree = async (files: FileData[], parentKey: string = '0'): Promise<TreeNode[]> => {
        const tree = [];

        for (const [index, file] of files.entries()) {
            const nodeKey = `${parentKey}-${index}`;
            let children: TreeNode[] | null = null;

            if (!file.id) {
                // id가 없으면 하위 파일 조회 후 재귀
                const childFiles = await fetchFiles({ id: selectedBucket?.id, path: file?.name }); // fetchFiles는 file 기준 하위 파일 반환
                children = await buildTree(childFiles, nodeKey);
            }

            tree.push({
                key: nodeKey,
                data: file,
                children: children
            });
        }
        return tree;
    };

    const handleRefresh = async () => {
        const data = await fetchFiles(selectedBucket);
        const tree = await buildTree(data, '0');
        setTrees(tree);
    };

    const handleSearch = async () => {
        const res = await post('/app/uploadFile', {
            bucket: selectedBucket?.id,
            folder: selectedFolder?.id ? '' : selectedFolder?.name
        });
        console.log('res', res);
    };

    useEffect(() => {
        selectedBucket && handleRefresh();
    }, [selectedBucket]);

    // bucket 헤더
    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">Buckets</span>
        </div>
    );

    // file 헤더
    const header2 = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">{selectedBucket?.name || ''}</span>
            <div className="flex flex-wrap gap-2">
                <Button icon="pi pi-refresh" rounded raised onClick={handleRefresh} />
                <Button type="button" icon="pi pi-upload" severity="success" rounded></Button>
                <Button type="button" icon="pi pi-search" severity="success" rounded onClick={handleSearch} />
            </div>
        </div>
    );

    const actionTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button type="button" icon="pi pi-pencil" severity="success" rounded></Button>
            </div>
        );
    };

    return (
        <>
            <div className="card">
                <DataTable
                    value={initialData}
                    selectionMode={'single'}
                    header={header}
                    tableStyle={{ minWidth: '50rem' }}
                    selection={selectedBucket}
                    onSelectionChange={(e) => setSelectedBucket(e.value)}
                >
                    {columns?.map((item) => (
                        <Column key={item.field} field={item.field} header={item.field} />
                    ))}
                </DataTable>
            </div>
            <div className="card">
                <TreeTable
                    selectionMode="single"
                    selectionKeys={selectedFolderKeys}
                    onSelectionChange={(e) => setSelectedFolderKeys(e.value)}
                    onRowClick={(e) => setSelectedFolder(e.node.data)}
                    value={trees}
                    header={header2}
                    tableStyle={{ minWidth: '50rem' }}
                >
                    {treeColumns?.map((item) => (
                        <Column
                            key={item?.field}
                            field={item?.field}
                            header={item?.field}
                            body={(rowData) => {
                                const value = rowData.data[item.field];
                                return typeof value === 'object' ? JSON.stringify(value) : value;
                            }}
                            expander={item?.field === 'name'}
                        />
                    ))}
                    <Column body={actionTemplate} headerClassName="w-10rem" />
                </TreeTable>
                {/* <DataTable value={files} selectionMode={'single'} header={header2} tableStyle={{ minWidth: '50rem' }}>
                    {getColumns(files)?.map((item) => (
                        <Column
                            key={String(item?.field)}
                            field={String(item?.field)}
                            header={String(item?.field)}
                            body={(rowData) => {
                                const value = rowData[item.field];
                                return typeof value === 'object' ? JSON.stringify(value) : value;
                            }}
                        />
                    ))}
                </DataTable> */}
            </div>
            <div className="col-12">
                <div className="card">
                    <h5>업로드</h5>
                    <FileUpload name="demo[]" url="/api/upload" multiple accept="image/*" maxFileSize={1000000} />
                </div>
            </div>
        </>
    );
};

export default BucketList;
