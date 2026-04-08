'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { useHttp } from '@/util/axiosInstance';
import { Student } from '@/types/class';

// Define the component's props interface
interface StudentDropDownProps {
    className?: string;
    options?: Student[];
    filter?: boolean;
    showClear?: boolean;
    placeholder?: string;
    onChange: (student: Student | null) => void;
    value: string | undefined; // The selected studentId from the parent form
    disabled?: boolean;
}

const StudentDropDown = ({
    className,
    options,
    filter = true,
    showClear = true,
    placeholder = '학생을 검색하여 선택하세요',
    onChange,
    value,
    disabled = false,
    ...props
}: StudentDropDownProps) => {
    const http = useHttp();
    const [internalStudents, setInternalStudents] = useState<Student[]>([]);

    useEffect(() => {
        if (options && options.length !== 0) {
            setInternalStudents(options);
            return; // Stop here and don't fetch internally
        }

        // If no `options` are provided, fetch the full student list from the API.
        const fetchStudents = async () => {
            try {
                const response = await http.get<Student[]>('/choiMath/student/getStudentList');
                // Filter for enrolled students only, as is common in the app
                const enrolledStudents = (response.data || []).filter((s: Student) => !s.isWithdrawn);
                setInternalStudents(enrolledStudents);
            } catch (error) {
                console.error('Error fetching students in StudentDropDown:', error);
                // Optionally, you could add a toast notification here for feedback
            }
        };

        fetchStudents();
    }, [options]); // This effect runs if the `options` prop itself changes.

    // Memoize the formatted options for the dropdown to avoid re-computation on every render.
    const studentOptionsForDropdown = useMemo(() => {
        return internalStudents.map((s) => ({
            label: `${s?.name || ''} (${s.grade || 'N/A'} / ${s.school || 'N/A'})`,
            value: s.studentId
        }));
    }, [internalStudents]);

    // Handle the change event from the PrimeReact Dropdown
    const handleChange = (e: any) => {
        if (e.value) {
            // Find the full student object corresponding to the selected value
            const selectedStudent = internalStudents.find((std) => std.studentId === e.value);
            // Pass the full student object (or null if not found) to the parent's onChange callback
            onChange(selectedStudent || null);
        } else {
            // If the selection is cleared, pass null to the parent's onChange
            onChange(null);
        }
    };

    return (
        <Dropdown
            {...props}
            className={className}
            options={studentOptionsForDropdown}
            filter={filter}
            showClear={showClear}
            placeholder={placeholder}
            onChange={handleChange}
            value={value}
            disabled={disabled}
            appendTo="self" // 화면 위치 계산 안정화
            scrollHeight="250px" // 모바일 뷰포트 대응
            virtualScrollerOptions={{ itemSize: 38 }} // 성능 및 안정성 향상
            pt={{
                filterInput: { autoComplete: 'off' }
            }} // 모바일 키보드 간섭 방지
            filterPlaceholder="이름으로 검색"
            emptyFilterMessage="검색 결과가 없습니다"
        />
    );
};

export default StudentDropDown;
