
export enum View {
    Booking = 'booking',
    AdminLogin = 'admin-login',
    AdminDashboard = 'admin-dashboard',
    CheckinLogin = 'checkin-login',
    Checkin = 'checkin',
}

export interface TeamMember {
    studentId: string;
    name: string;
}

export interface FormData {
    location: string;
    seat: string;
    timeSlot: string;
    studentId: string;
    name: string;
    date: string;
    teamMembers: TeamMember[];
}

export interface Reservation {
    date: string;
    studentId: string;
    name: string;
    location: string;
    seat: string;
    timeSlot: string;
    reservationId: string;
    timestamp: string;
    teamMembers: TeamMember[];
    teamMembersString?: string;
}

export interface CheckInData {
    studentId: string;
    name: string;
}

export interface AttendanceRecord {
    studentId: string;
    name: string;
    action: 'checkin' | 'checkout';
    timestamp: string;
    location: string;
}

export interface TimeSlot {
    id: string;
    label: string;
    time: string;
}
