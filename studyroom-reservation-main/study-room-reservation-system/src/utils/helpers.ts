
import { TIME_SLOT_LIMITS } from '../../src/constants';

export const getSeatCount = (location: string): number => {
    switch (location) {
        case '스터디룸': return 0;
        case '영글터 집중학습실': return 8;
        case '영글터 자율학습실': return 25;
        case '채움터': return 9;
        default: return 0;
    }
};

export const isTimeSlotBookingAllowed = (timeSlotId: string): boolean => {
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    return currentTimeInMinutes <= (TIME_SLOT_LIMITS[timeSlotId] || 9999);
};

export const validateStudentId = (studentId: string): { isValid: boolean; message: string } => {
    if (!studentId || !/^\d{5}$/.test(studentId.trim())) {
        return { isValid: false, message: '학번은 5자리 숫자여야 합니다.' };
    }
    const num = parseInt(studentId.trim(), 10);
    if (num < 10101 || num > 31027) {
        return { isValid: false, message: '학번은 10101부터 31027까지 유효합니다.' };
    }
    return { isValid: true, message: '' };
};

export const getAvailableDates = (): { value: string; label: string }[] => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const displayDate = today.toLocaleDateString('ko-KR', {
        month: 'long', day: 'numeric', weekday: 'short'
    });
    return [{ value: dateString, label: `오늘 (${displayDate})` }];
};
