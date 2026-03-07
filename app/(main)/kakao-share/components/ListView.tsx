'use client';

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ShareItem } from '../types';

interface ListViewProps {
    shares: ShareItem[];
    onRowSelect: (id: string) => void;
    onNewPost: () => void;
    onShare: (item: ShareItem) => void;
}

const ListView = ({ shares, onRowSelect, onNewPost, onShare }: ListViewProps) => {
    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-4">
                <h5>공유 게시판 목록</h5>
                <Button label="글쓰기" icon="pi pi-pencil" onClick={onNewPost} />
            </div>
            <DataTable
                value={shares}
                selectionMode="single"
                onRowSelect={(e) => onRowSelect(e.data._id)}
                responsiveLayout="scroll"
                emptyMessage="등록된 게시글이 없습니다."
            >
                <Column field="actualTitle" header="제목" sortable />
                <Column field="shareTitle" header="공유 제목" sortable />
                <Column
                    field="createdDate"
                    header="등록일"
                    body={(rowData) => rowData.createdDate?.split('T')[0]}
                    sortable
                />
                <Column
                    header="공유"
                    body={(rowData: ShareItem) => (
                        <Button
                            icon="pi pi-share-alt"
                            className="p-button-rounded p-button-warning p-button-text"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare(rowData);
                            }}
                        />
                    )}
                />
            </DataTable>
        </div>
    );
};

export default ListView;
