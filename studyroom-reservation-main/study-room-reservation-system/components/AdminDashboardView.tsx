import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Reservation, AttendanceRecord } from '../types';
import { TIME_SLOTS } from '../constants';
import * as googleScriptService from '../services/googleScriptService';
import Spinner from './common/Spinner';

interface AdminDashboardViewProps {
    onLogout: () => void;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onLogout }) => {
    const [allReservations, setAllReservations] = useState<Reservation[]>([]);
    const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('reservations');
    const [enabledTimeSlots, setEnabledTimeSlots] = useState<{ [key: string]: boolean }>({
        lunch: true, period8: false, dinner: true, study1: true, study2: true
    });

    const fetchData = useCallback(async (isSilent: boolean = false) => {
        if (!isSilent) {
            setIsLoading(true);
        }
        try {
            const { reservations, attendance } = await googleScriptService.getFullData();
            const today = new Date().toISOString().split('T')[0];
            setAllReservations(reservations);
            setTodayReservations(reservations.filter(r => r.date === today));
            setAttendanceRecords(attendance);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
            if (!isSilent) {
                alert('데이터를 불러오는 데 실패했습니다.');
            }
        } finally {
            if (!isSilent) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchData(false); // Initial load

        const intervalId = setInterval(() => {
            fetchData(true); // Silent polling every 30 seconds
        }, 30000);

        return () => clearInterval(intervalId);
    }, [fetchData]);

    const mileageData = useMemo(() => {
        const studentPoints: { 
            [studentId: string]: { 
                name: string; 
                reservationCount: number; 
                attendanceCount: number; 
            } 
        } = {};
    
        allReservations.forEach(res => {
            if (!studentPoints[res.studentId]) {
                studentPoints[res.studentId] = { name: res.name, reservationCount: 0, attendanceCount: 0 };
            }
            studentPoints[res.studentId].reservationCount++;
            studentPoints[res.studentId].name = res.name;
        });
    
        attendanceRecords.forEach(att => {
            if (att.action === 'checkin') {
                if (!studentPoints[att.studentId]) {
                    studentPoints[att.studentId] = { name: att.name, reservationCount: 0, attendanceCount: 0 };
                }
                studentPoints[att.studentId].attendanceCount++;
                studentPoints[att.studentId].name = att.name;
            }
        });
    
        const sortedData = Object.entries(studentPoints).map(([studentId, data]) => ({
            studentId,
            ...data,
            totalMileage: data.reservationCount + data.attendanceCount
        }));
    
        sortedData.sort((a, b) => b.totalMileage - a.totalMileage);
    
        return sortedData;
    }, [allReservations, attendanceRecords]);

    const toggleTimeSlot = (id: string) => {
        setEnabledTimeSlots(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const checkedInUsers = attendanceRecords.filter(r => r.action === 'checkin' && !attendanceRecords.some(co => co.action === 'checkout' && co.studentId === r.studentId && new Date(co.timestamp) > new Date(r.timestamp)));
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /> <span className="ml-2">데이터 로딩 중...</span></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">📊 관리자 대시보드</h1>
                <button onClick={onLogout} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    로그아웃
                </button>
            </div>

            <div className="mb-8 p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
                <h2 className="text-xl font-bold mb-4">시간대 관리</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {TIME_SLOTS.map(slot => (
                        <button key={slot.id} onClick={() => toggleTimeSlot(slot.id)}
                            className={`p-4 rounded-lg border-2 text-center transition-all ${ enabledTimeSlots[slot.id] ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            <div className="font-medium">{slot.label}</div>
                            <div className="text-sm">{slot.time}</div>
                            <div className="text-xs mt-2">{enabledTimeSlots[slot.id] ? '활성화' : '비활성화'}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow"><p>📅 당일 예약: <span className="font-bold text-2xl">{todayReservations.length}</span></p></div>
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow"><p>✅ 총 출석: <span className="font-bold text-2xl">{attendanceRecords.length}</span></p></div>
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow"><p>👥 현재 학습중: <span className="font-bold text-2xl">{checkedInUsers.length}</span></p></div>
            </div>
            
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button onClick={() => setActiveTab('reservations')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'reservations' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    당일 예약 명단
                </button>
                <button onClick={() => setActiveTab('mileage')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'mileage' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    🏆 마일리지 현황
                </button>
            </div>

            {activeTab === 'reservations' && (
                <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
                    <h2 className="text-xl font-bold mb-4">당일 예약 명단</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600"><th className="text-left p-2">학번</th><th className="text-left p-2">이름</th><th className="text-left p-2">장소/좌석</th><th className="text-left p-2">시간대</th><th className="text-left p-2">팀원</th></tr>
                            </thead>
                            <tbody>
                                {todayReservations.map((r, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                                        <td className="p-2">{r.studentId}</td><td className="p-2">{r.name}</td><td className="p-2">{r.location} {r.seat}</td><td className="p-2">{r.timeSlot}</td><td className="p-2 text-xs">{r.teamMembersString || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'mileage' && (
                <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
                    <h2 className="text-xl font-bold mb-4">🏆 마일리지 랭킹</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                    <th className="text-left p-2">순위</th>
                                    <th className="text-left p-2">학번</th>
                                    <th className="text-left p-2">이름</th>
                                    <th className="text-center p-2">총 마일리지</th>
                                    <th className="text-center p-2">예약 횟수</th>
                                    <th className="text-center p-2">출석 횟수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mileageData.map((student, index) => (
                                    <tr key={student.studentId} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-2 font-bold text-center w-16">{index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</td>
                                        <td className="p-2">{student.studentId}</td>
                                        <td className="p-2">{student.name}</td>
                                        <td className="p-2 font-semibold text-blue-500 dark:text-blue-400 text-center">{student.totalMileage} 점</td>
                                        <td className="p-2 text-center">{student.reservationCount}</td>
                                        <td className="p-2 text-center">{student.attendanceCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardView;