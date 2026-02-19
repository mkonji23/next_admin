import { Student as StudentData } from '@/components/modals/StudentModal';

export interface Student {
    studentId?: string;
    name?: string;
    grade?: string;
    school?: string;
    description?: string;
    registDate?: string;
    updatedDate?: string | Date;
    isWithdrawn?: boolean;
}

export interface Class {
    classId: string;
    className: string;
    teacher: string;
    students: Student[];
    description: string;
    startDate?: string;
    endDate?: string;
    isClosed?: boolean;
}
