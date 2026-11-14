'use client';

import React, { useState, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProfileIconItem } from '@/constants/profileIcons';

interface ProfileSelectionDialogProps {
    visible: boolean;
    onHide: () => void;
    profileIcons: ProfileIconItem[];
    profileImage: string;
    onProfileChange: (imgUrl: string) => void;
}

type CategoryFilter = 'all' | 'gif' | 'character' | 'base' | 'special';

const ProfileSelectionDialog: React.FC<ProfileSelectionDialogProps> = ({
    visible,
    onHide,
    profileIcons,
    profileImage,
    onProfileChange
}) => {
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

    // 카테고리별 개수 계산
    const counts = useMemo(() => {
        const c = { all: profileIcons.length, gif: 0, character: 0, base: 0, special: 0 };
        for (const icon of profileIcons) {
            if (icon.category === 'gif') c.gif += 1;
            else if (icon.category === 'character' || icon.category === 'new') c.character += 1;
            else if (icon.category === 'special') c.special += 1;
            else c.base += 1;
        }
        return c;
    }, [profileIcons]);

    // 필터링된 목록
    const filteredIcons = useMemo(() => {
        if (selectedCategory === 'all') return profileIcons;
        if (selectedCategory === 'gif') return profileIcons.filter((i) => i.category === 'gif');
        if (selectedCategory === 'character') return profileIcons.filter((i) => i.category === 'character' || i.category === 'new');
        if (selectedCategory === 'base') return profileIcons.filter((i) => i.category === 'base');
        if (selectedCategory === 'special') return profileIcons.filter((i) => i.category === 'special');
        return profileIcons;
    }, [profileIcons, selectedCategory]);

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <span className="font-bold text-lg md:text-xl">프로필 아이콘 선택</span>
                    <span className="text-xs text-500 font-normal">({counts.all}개)</span>
                </div>
            }
            visible={visible}
            onHide={onHide}
            style={{ width: '92vw', maxWidth: '480px' }}
            contentStyle={{ maxHeight: '72vh', overflowY: 'auto', padding: '1rem' }}
            draggable={false}
            resizable={false}
            dismissableMask
            blockScroll
        >
            {/* 상단 카테고리 필터 탭 */}
            <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 surface-border flex-wrap">
                <Button
                    label={`전체 (${counts.all})`}
                    size="small"
                    rounded
                    outlined={selectedCategory !== 'all'}
                    severity={selectedCategory === 'all' ? undefined : 'secondary'}
                    className="p-1 px-3 text-xs font-bold"
                    onClick={() => setSelectedCategory('all')}
                />
                <Button
                    label={`GIF (${counts.gif})`}
                    size="small"
                    rounded
                    outlined={selectedCategory !== 'gif'}
                    severity={selectedCategory === 'gif' ? 'help' : 'secondary'}
                    className="p-1 px-3 text-xs font-bold"
                    onClick={() => setSelectedCategory('gif')}
                />
                <Button
                    label={`토끼비스무리 (${counts.character})`}
                    size="small"
                    rounded
                    outlined={selectedCategory !== 'character'}
                    severity={selectedCategory === 'character' ? 'danger' : 'secondary'}
                    className="p-1 px-3 text-xs font-bold"
                    onClick={() => setSelectedCategory('character')}
                />
                <Button
                    label={`기본 (${counts.base})`}
                    size="small"
                    rounded
                    outlined={selectedCategory !== 'base'}
                    severity={selectedCategory === 'base' ? 'info' : 'secondary'}
                    className="p-1 px-3 text-xs font-bold"
                    onClick={() => setSelectedCategory('base')}
                />
                {counts.special > 0 && (
                    <Button
                        label={`🏆 스페셜 (${counts.special})`}
                        size="small"
                        rounded
                        outlined={selectedCategory !== 'special'}
                        severity={selectedCategory === 'special' ? 'warning' : 'secondary'}
                        className="p-1 px-3 text-xs font-bold"
                        onClick={() => setSelectedCategory('special')}
                    />
                )}
            </div>

            {/* 프로필 그리드 목록 */}
            <div className="grid justify-content-center gap-2 md:gap-3">
                {filteredIcons.map((icon, idx) => {
                    const isSelected = profileImage === icon.value;
                    const isGif = icon.category === 'gif' || icon.value?.toLowerCase().endsWith('.gif');
                    return (
                        <div
                            key={idx}
                            className={`col-3 flex flex-column align-items-center cursor-pointer p-2 border-round hover:surface-100 transition-duration-150 transition-colors ${
                                isSelected
                                    ? 'bg-blue-50 border-2 border-blue-500 shadow-2'
                                    : 'border-1 border-transparent'
                            }`}
                            onClick={() => onProfileChange(icon.value)}
                        >
                            <div className="relative">
                                <div className="w-4rem h-4rem border-circle bg-blue-100 flex align-items-center justify-content-center overflow-hidden mb-1 shadow-1">
                                    {icon.value ? (
                                        <img
                                            src={icon.value}
                                            alt={icon.name}
                                            loading="lazy"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: isGif ? 'contain' : 'cover',
                                                imageRendering: isGif ? 'pixelated' : 'auto'
                                            }}
                                        />
                                    ) : (
                                        <i className="pi pi-user text-blue-500 text-2xl"></i>
                                    )}
                                </div>

                                {/* 현재 선택됨 체크 아이콘 */}
                                {isSelected && (
                                    <div
                                        className="absolute bg-blue-500 text-white border-circle flex align-items-center justify-content-center shadow-2"
                                        style={{
                                            bottom: '2px',
                                            right: '-2px',
                                            width: '18px',
                                            height: '18px',
                                            fontSize: '10px',
                                            zIndex: 2
                                        }}
                                    >
                                        <i className="pi pi-check" style={{ fontSize: '10px' }}></i>
                                    </div>
                                )}
                            </div>
                            <span
                                className={`text-xs mt-1 text-center white-space-nowrap overflow-hidden text-overflow-ellipsis w-full ${
                                    isSelected ? 'font-bold text-blue-600' : 'text-700'
                                }`}
                                title={icon.name}
                            >
                                {icon.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </Dialog>
    );
};

export default ProfileSelectionDialog;
