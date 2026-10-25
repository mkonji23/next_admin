'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface SpecialStudentPopupProps {
    visible: boolean;
    onHide: () => void;
    studentName: string | undefined;
}

const SpecialStudentPopup: React.FC<SpecialStudentPopupProps> = ({ visible, onHide, studentName }) => {
    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            showHeader={false}
            style={{ width: '90vw', maxWidth: '600px' }}
            contentStyle={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}
            dismissableMask
        >
            <div className="relative">
                <img
                    src="/images/special/hj.png"
                    alt="Welcome"
                    className="w-full h-auto block"
                    style={{ maxHeight: '80vh', objectFit: 'contain' }}
                />
                <Button
                    icon="pi pi-times"
                    className="absolute top-0 right-0 m-3 p-button-rounded p-button-secondary p-button-text bg-white-alpha-20 hover:bg-white-alpha-40 transition-duration-200"
                    onClick={onHide}
                    style={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                />
                <div
                    className="absolute bottom-0 left-0 w-full p-4 flex flex-column align-items-center"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
                >
                    <h2 className="text-white font-bold m-0 mb-2">반가워요, {studentName} 학생! 👋</h2>
                    <p className="text-white-alpha-80 m-0 text-sm">최선을 다하는 당신을 응원합니다.</p>
                </div>
            </div>
        </Dialog>
    );
};

export default SpecialStudentPopup;
