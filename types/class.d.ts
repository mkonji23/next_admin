export interface Student {
    userId: string;
    userName: string;
}

export interface Class {
    classId: string;
    className: string;
    teacher: string;
    students: Student[];
    description: string;
}
