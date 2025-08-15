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
type ClientComponentProps = {
    initialData: Bucket[];
};
interface FileData {
    id?: string;
    name: string;
    [key: string]: any;
}

interface TreeNode {
    key?: string;
    data?: FileData;
    children?: TreeNode[] | undefined;
}
interface IBucketReq {
    bucket?: string;
    path?: string;
}
const BucketList = ({ initialData }: ClientComponentProps) => {
    const [bucketLists, setBucketLists] = useState<Bucket[]>(initialData);
    const [selectedBucket, setSelectedBucket] = useState<any>({});
    const [trees, setTrees] = useState<TreeNode[]>();

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
            let children: TreeNode[] | undefined = undefined;

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

    const getFilePath = (treeData: TreeNode[] | undefined, fileId: string): string | null => {
        if (!treeData) return null;

        // 재귀 함수: 현재 노드에서 탐색
        const traverse = (nodes: TreeNode[], path: string): string | null => {
            for (const node of nodes) {
                const currentPath = `${path}${node.data?.name || ''}`;

                // 찾는 파일이면 경로 반환
                if (node.data?.id === fileId) {
                    return currentPath;
                }

                // children이 있으면 재귀 탐색
                if (node.children?.length) {
                    const result = traverse(node.children, currentPath + '/');
                    if (result) return result;
                }
            }
            return null; // 못 찾으면 null 반환
        };

        return traverse(treeData, '/');
    };

    const handleFetchFiles = async () => {
        const data = await fetchFiles(selectedBucket);
        const tree = await buildTree(data, '0');
        console.log('tree', tree);
        setTrees(tree);
    };

    const handleFetchBuckets = async () => {
        const res = await get('/app/listBuckets');
        setBucketLists(res?.data);
    };

    const handleDownloadFile = async (fileId: string) => {
        const params = {
            bucket: selectedBucket?.id,
            path: getFilePath(trees, fileId)
        };
        const res = await post('/app/download', params, { responseType: 'blob' });
        console.log('res.data', res.data);
        // 브라우저 다운로드
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        // path에서 파일명 추출
        const fileName = params.path?.split('/').pop() || 'downloaded_file';
        a.download = fileName; // 서버에서 보내준 파일명 사용 가능
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };
    useEffect(() => {
        selectedBucket && handleFetchFiles();
    }, [selectedBucket]);

    // bucket 헤더
    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">Buckets</span>
            <Button icon="pi pi-refresh" rounded raised onClick={handleFetchBuckets} />
        </div>
    );

    // file 헤더
    const header2 = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">Files</span>
            <Button icon="pi pi-refresh" rounded raised onClick={handleFetchFiles} />
        </div>
    );

    const actionTemplate = (fileId: string) => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    icon="pi pi-download"
                    severity="success"
                    rounded
                    onClick={() => {
                        handleDownloadFile(fileId);
                    }}
                ></Button>
            </div>
        );
    };

    return (
        <>
            <div className="card">
                <DataTable
                    value={bucketLists}
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
                <TreeTable value={trees} header={header2} tableStyle={{ minWidth: '50rem' }}>
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
                    <Column
                        body={(rowData: TreeNode) => {
                            if (rowData.data?.id) {
                                return actionTemplate(rowData.data?.id); // 기존 템플릿 호출
                            }
                            return null; // 아무것도 표시 안 함
                        }}
                        headerClassName="w-10rem"
                    />
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
        </>
    );
};

export default BucketList;
