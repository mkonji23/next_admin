'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';

interface ProfileSelectionDialogProps {
    visible: boolean;
    onHide: () => void;
    profileIcons: { name: string; value: string }[];
    profileImage: string;
    onProfileChange: (imgUrl: string) => void;
}

const ProfileSelectionDialog: React.FC<ProfileSelectionDialogProps> = ({
    visible,
    onHide,
    profileIcons,
    profileImage,
    onProfileChange
}) => {
    return (
        <Dialog
            header="프로필 아이콘 선택"
            visible={visible}
            onHide={onHide}
            style={{ width: '90vw', maxWidth: '400px' }}
            draggable={false}
            resizable={false}
            dismissableMask
        >
            <div className="grid justify-content-center gap-3 py-3">
                {profileIcons.map((icon, idx) => (
                    <div
                        key={idx}
                        className={`col-3 flex flex-column align-items-center cursor-pointer p-2 border-round hover:surface-100 transition-duration-200 ${
                            profileImage === icon.value ? 'bg-blue-50 border-1 border-blue-500' : ''
                        }`}
                        onClick={() => onProfileChange(icon.value)}
                    >
                        <div className="w-4rem h-4rem border-circle bg-blue-100 flex align-items-center justify-content-center overflow-hidden mb-2">
                            {icon.value ? (
                                <img
                                    src={icon.value}
                                    alt={icon.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <i className="pi pi-user text-blue-500 text-2xl"></i>
                            )}
                        </div>
                        <span className="text-xs text-700">{icon.name}</span>
                    </div>
                ))}
            </div>
        </Dialog>
    );
};

export default ProfileSelectionDialog;
