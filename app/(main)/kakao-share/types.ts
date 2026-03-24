export interface ShareImage {
    url: string;
    fileId?: string;
    isDelete?: boolean;
}

export interface ShareItem {
    _id?: string;
    classId?: string;
    className?: string;
    publicUrl?: string;
    shareTitle?: string;
    shareContent?: string;
    actualTitle?: string;
    actualContent?: string;
    shareImageUrls?: ShareImage[];
    studentId?: string;
    studentName?: string;
    telNo?: string;
    pTelNo?: string;
    createdDate?: string;
    updatedDate?: string;
}
