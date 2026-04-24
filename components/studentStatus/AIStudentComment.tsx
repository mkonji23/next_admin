'use client';

import React from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { AI_PROGRESS_MESSAGES } from '@/constants/aiComments';

interface AIStudentCommentProps {
    aiAnalyzing: boolean;
    aiProgress: number;
    aiComment: string;
}

const AIStudentComment: React.FC<AIStudentCommentProps> = ({ aiAnalyzing, aiProgress, aiComment }) => {
    return (
        <div className="grid mt-2 mb-4">
            <div className="col-12">
                <div
                    className="border-round-2xl shadow-1 p-4 flex flex-column align-items-center justify-content-center relative overflow-hidden"
                    style={{
                        minHeight: '140px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                >
                    <div className="absolute top-0 right-0 p-3" style={{ opacity: 0.1 }}>
                        <i className="pi pi-sparkles text-8xl text-white"></i>
                    </div>
                    <div className="absolute bottom-0 left-0 p-3" style={{ opacity: 0.1 }}>
                        <i className="pi pi-bolt text-7xl text-white"></i>
                    </div>

                    {aiAnalyzing ? (
                        (() => {
                            const currentMessage =
                                AI_PROGRESS_MESSAGES.find((m) => aiProgress < m.threshold)?.message ||
                                AI_PROGRESS_MESSAGES[AI_PROGRESS_MESSAGES.length - 1].message;

                            return (
                                <div className="w-full md:w-8 z-1 flex flex-column align-items-center">
                                    <span className="text-yellow-200 font-bold mb-3 text-base md:text-xl text-center">
                                        <i className="pi pi-cog pi-spin mr-2"></i>
                                        {currentMessage}
                                    </span>
                                    <ProgressBar
                                        value={aiProgress}
                                        className="w-full border-round-3xl shadow-1"
                                        style={{
                                            height: '18px',
                                            backgroundColor: 'rgba(255,255,255,0.2)'
                                        }}
                                        color="#facc15"
                                        displayValueTemplate={(val) => (
                                            <span className="text-xs text-800 font-bold">{val}%</span>
                                        )}
                                    />
                                </div>
                            );
                        })()
                    ) : (
                        <div className="flex align-items-center gap-3 z-1 w-full justify-content-center">
                            <i className="pi pi-sparkles text-3xl md:text-5xl text-yellow-300 drop-shadow-md"></i>
                            <span
                                className="text-lg md:text-2xl font-bold text-white line-height-3 text-center"
                                style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}
                            >
                                💡 AI 코치 코멘트: <br />{' '}
                                <span className="text-yellow-100">{aiComment}</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIStudentComment;
