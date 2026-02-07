import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
    LayoutDashboard, Users, FileText, CheckCircle, TrendingUp, BarChart2,
    AlertTriangle, Briefcase, Bell, Activity, Clock,
    Edit, Save, LogOut, ShieldAlert, X, BookOpen, Layers, Megaphone, Calendar
} from 'lucide-react';
import {
    hodTrendData, hodGradeDistribution, atRiskStudents, facultyWorkload,
    departments, subjectsByDept, getStudentsByDept, branchPerformanceData, iaSubmissionStatus,
    englishMarks, mathsMarks, departmentAlerts, resourceRequests,
    hodData, departmentStats, hodBranchComparison, facultySubjects, facultyProfiles
} from '../utils/mockData';
import styles from './HODDashboard.module.css';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
    ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import logo from '../assets/college_logo.png';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
    ArcElement, PointElement, LineElement, Filler
);

const HODDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedDept, setSelectedDept] = useState('CS');
    const [deptStudents, setDeptStudents] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isMyDept, setIsMyDept] = useState(true);

    const [editingMarks, setEditingMarks] = useState({});
    const [viewingSubject, setViewingSubject] = useState(null);

    // API State
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjectMarks, setSubjectMarks] = useState({}); // Map: { studentId: { ia1c1: val, ia1c2: val ... } }

    // Announcement State
    const [departmentAnnouncements, setDepartmentAnnouncements] = useState([]);
    const API_BASE = 'http://127.0.0.1:8083/api/marks';

    // Unified Initialization: Runs on mount and when Dept changes
    useEffect(() => {
        // Mock Login: User is "CS" HOD - MD Jaffar
        const userDept = 'CS';
        const isAuthorized = selectedDept === userDept;
        setIsMyDept(isAuthorized);

        if (isAuthorized) {
            const fetchedStudents = getStudentsByDept(selectedDept);
            setDeptStudents(fetchedStudents);
            setStudents(fetchedStudents);

            if (subjectsByDept[selectedDept]) {
                // Generate rich subject objects
                const richSubjects = subjectsByDept[selectedDept].map((name, id) => {
                    let cie1Max = 35, cie2Max = 15, totalMax = 50;

                    if (name === 'English Communication') {
                        cie1Max = 50; cie2Max = 0; totalMax = 50;
                    } else if (name === 'CAEG') {
                        cie1Max = 8; cie2Max = 22; totalMax = 30; // 30 Total
                    } else if (name === 'Python') {
                        cie1Max = 25; cie2Max = 25; totalMax = 50;
                    }

                    return {
                        id: id + 1,
                        name: name,
                        department: selectedDept,
                        cie1MaxMarks: cie1Max,
                        cie2MaxMarks: cie2Max,
                        totalMaxMarks: totalMax
                    };
                });
                setSubjects(richSubjects);
                // Ensure we select the first subject with full details
                setSelectedSubject(richSubjects[0]);
            }
        } else {
            // Clear sensitive data if unauthorized
            setDeptStudents([]);
            setStudents([]);
            setSubjects([]);
            setSelectedSubject(null);
        }
    }, [selectedDept]);

    // Generate Marks when Subject or Students change
    useEffect(() => {
        if (selectedSubject && selectedSubject.id && students.length > 0) {
            // Generate mock marks map for the selected subject
            const marksMap = {};
            students.forEach((student, index) => {
                let cie1, cie2;

                if (selectedSubject.name === 'English Communication') {
                    // Use Hardcoded marks for English
                    const val = englishMarks[index];
                    cie1 = val;
                    cie2 = 0;
                } else if (selectedSubject.name === 'Engineering Maths-II') {
                    // Use Hardcoded marks for Maths
                    const val = mathsMarks[index];
                    if (val) {
                        cie1 = val.cie1;
                        cie2 = val.cie2;
                    } else {
                        cie1 = 0; cie2 = 0;
                    }
                } else {
                    const max1 = selectedSubject.cie1MaxMarks || 35;
                    const max2 = selectedSubject.cie2MaxMarks || 15;
                    cie1 = max1 > 0 ? Math.floor(Math.random() * (max1 - 5)) + 5 : 0;
                    cie2 = max2 > 0 ? Math.floor(Math.random() * (max2 - 2)) + 2 : 0;
                }

                marksMap[student.id] = {
                    'IA1': {
                        student: { id: student.id },
                        iaType: 'IA1',
                        cie1Score: cie1,
                        cie2Score: cie2
                    }
                };
            });
            setSubjectMarks(marksMap);
        }
    }, [selectedSubject, students]);

    // Fetch HOD Announcements
    useEffect(() => {
        if (isMyDept && selectedDept === 'CS') { // Assuming HOD is only for CS in this demo
            const fetchAnnouncements = async () => {
                try {
                    // Using mock token or skipping auth for now as we don't have full auth context here similar to Faculty
                    // In real app, useAuth token
                    // Using mock data fallback if fails
                    const response = await fetch('http://127.0.0.1:8083/api/announcements/hod/announcements', {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } // simplistic
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setDepartmentAnnouncements(data);
                    } else {
                        // Fallback Mock
                        setDepartmentAnnouncements([
                            {
                                id: 1,
                                cieNumber: '1',
                                scheduledDate: '2025-03-10',
                                subject: { name: 'Python', code: '20CS31' },
                                faculty: { username: 'Wahida Banu' },
                                status: 'SCHEDULED'
                            }
                        ]);
                    }
                } catch (e) {
                    console.error("Failed to fetch announcements", e);
                }
            };
            fetchAnnouncements();
        }
    }, [isMyDept, selectedDept]);

    const menuItems = [
        { label: 'Dashboard Overview', path: '#overview', icon: <LayoutDashboard size={20} />, active: activeTab === 'overview', onClick: () => setActiveTab('overview') },
        { label: 'Dept Announcements', path: '#announcements', icon: <Megaphone size={20} />, active: activeTab === 'announcements', onClick: () => setActiveTab('announcements') },
        { label: 'IA Monitoring', path: '#monitoring', icon: <Activity size={20} />, active: activeTab === 'monitoring', onClick: () => setActiveTab('monitoring') },
        { label: 'Student Performance', path: '#performance', icon: <TrendingUp size={20} />, active: activeTab === 'performance', onClick: () => setActiveTab('performance') },
        { label: 'Faculty Management', path: '#faculty', icon: <Users size={20} />, active: activeTab === 'faculty', onClick: () => setActiveTab('faculty') },
        { label: 'IA Approval Panel', path: '#approvals', icon: <CheckCircle size={20} />, active: activeTab === 'approvals', onClick: () => setActiveTab('approvals') },
        { label: 'Update Marks', path: '#update-marks', icon: <Edit size={20} />, active: activeTab === 'update-marks', onClick: () => setActiveTab('update-marks') },
        { label: 'Lesson Plans', path: '#lesson-plans', icon: <BookOpen size={20} />, active: activeTab === 'lesson-plans', onClick: () => setActiveTab('lesson-plans') },
        { label: 'Reports & Analytics', path: '#analytics', icon: <BarChart2 size={20} />, active: activeTab === 'analytics', onClick: () => setActiveTab('analytics') },
    ];

    // Chart Data Configs
    const commonOptions = {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } },
        maintainAspectRatio: false
    };

    const doughnutOptions = {
        responsive: true,
        plugins: { legend: { position: 'right' } },
        maintainAspectRatio: false
    };

    const handleLogout = () => {
        // Mock logout
        window.location.href = '/';
    };

    const handleMarkChange = (studentId, field, value) => {
        // field is 'cie1' or 'cie2'
        let numValue = parseInt(value, 10);
        if (value === '') numValue = 0;
        else if (isNaN(numValue)) return;

        // Dynamic Clamping based on subject config
        let max = 0;
        if (field === 'cie1') max = selectedSubject?.cie1MaxMarks || 0;
        else if (field === 'cie2') max = selectedSubject?.cie2MaxMarks || 0;

        if (numValue < 0) numValue = 0;
        if (numValue > max) numValue = max;

        setEditingMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: numValue
            }
        }));
    };

    const saveMarks = async () => {
        // Mock Save
        alert("Success: Marks have been effectively updated in the local state (Mock Mode).");
        setEditingMarks({});

        // Refresh local marks map with edits
        const newMarksMap = { ...subjectMarks };
        Object.keys(editingMarks).forEach(stdId => {
            if (!newMarksMap[stdId]) newMarksMap[stdId] = { 'IA1': { student: { id: stdId } } };

            if (editingMarks[stdId].cie1 !== undefined) newMarksMap[stdId]['IA1'].cie1Score = editingMarks[stdId].cie1;
            if (editingMarks[stdId].cie2 !== undefined) newMarksMap[stdId]['IA1'].cie2Score = editingMarks[stdId].cie2;
        });
        setSubjectMarks(newMarksMap);
    };

    if (!isMyDept && activeTab !== 'overview' && activeTab !== 'analytics') {
        // Logic to prevent accessing tabs if not my dept could go here, but requirements say visual block
    }


    /* ACCESS DENIED VIEW */
    const AccessDeniedView = () => (
        <div className={styles.accessDeniedContainer}>
            <div className={styles.deniedContent}>
                <ShieldAlert size={64} className={styles.deniedIcon} />
                <h2>Restricted Access</h2>
                <p>You are not authorized to view or modify data for the <strong>{departments.find(d => d.id === selectedDept)?.name}</strong> department.</p>
                <div className={styles.warningNote}>
                    <AlertTriangle size={16} />
                    <span>This action has been logged. Please switch back to your assigned department (Computer Science).</span>
                </div>
                <button
                    className={styles.backBtn}
                    onClick={() => setSelectedDept('CS')}
                >
                    Return to My Department
                </button>
            </div>
        </div>
    );

    return (
        <div className={styles.dashboardContainer}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <img src={logo} alt="SGP Logo" style={{ maxWidth: '100%', height: 'auto', maxHeight: '60px' }} />
                </div>

                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        MJ
                    </div>
                    <div className={styles.userDetails}>
                        <h4 className={styles.userName}>MD Jaffar</h4>
                        <span className={styles.userRole}>HOD | Computer Science</span>
                    </div>
                </div>

                <nav className={styles.navMenu}>
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            className={`${styles.navItem} ${item.active ? styles.activeNav : ''}`}
                            onClick={item.onClick}
                        // Disable actionable tabs if access denied, or let the main content block handle it
                        // Requirements imply main content block
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <button className={styles.logoutButton} onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>

                {/* Header with Profile at Right (30%) */}
                <header className={styles.topHeader}>
                    <div className={styles.headerLeft}>
                        {activeTab === 'overview' ? (
                            <div>
                                <h1 className={styles.welcomeText}>Hello, MD Jaffar</h1>
                                <p className={styles.subtitle}>Head of Computer Science | HOD - ID: CS-H01</p>
                            </div>
                        ) : (
                            <h1>{menuItems.find(m => m.active)?.label}</h1>
                        )}
                    </div>

                    <div className={styles.headerRight}>
                        <div className={styles.deptSelector}>
                            <span>Department:</span>
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className={styles.deptSelect}
                            >
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                <div className={styles.scrollableContent}>

                    {/* RESTRICTED ACCESS CHECK */}
                    {!isMyDept ? (
                        <AccessDeniedView />
                    ) : (
                        <>
                            {/* ANNOUNCEMENTS TAB */}
                            {activeTab === 'announcements' && (
                                <div className={styles.announcementContainer}>
                                    <div className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <h3>Department IA Schedule</h3>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button className={styles.secondaryBtn}>
                                                    <Calendar size={16} /> Sync to Calendar
                                                </button>
                                                <button className={styles.quickBtn} style={{ background: '#fef3c7', color: '#d97706' }}>
                                                    <ShieldAlert size={16} /> Check Conflicts
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.tableWrapper}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Subject</th>
                                                        <th>CIE Round</th>
                                                        <th>Faculty</th>
                                                        <th>Scheduled Date</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {departmentAnnouncements.length > 0 ? departmentAnnouncements.map((ann, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ fontWeight: 600 }}>{ann.subject?.name}</td>
                                                            <td><span className={styles.tag}>CIE-{ann.cieNumber}</span></td>
                                                            <td>{ann.faculty?.username}</td>
                                                            <td>{ann.scheduledDate}</td>
                                                            <td>
                                                                <span className={styles.statusBadge + ' ' + styles.approved}>
                                                                    {ann.status || 'SCHEDULED'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button className={styles.secondaryBtn} onClick={() => alert('Viewing details...')}>View</button>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No announcements found.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className={styles.overviewContainer}>

                                    {/* Stats Cards */}
                                    <div className={styles.statsRow}>
                                        <div className={styles.statCard}>
                                            <div className={`${styles.iconBox} ${styles.blue}`}>
                                                <Users size={24} />
                                            </div>
                                            <div className={styles.statInfo}>
                                                <p>Total Students</p>
                                                <h3>220</h3>
                                            </div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <div className={`${styles.iconBox} ${styles.green}`}>
                                                <Briefcase size={24} />
                                            </div>
                                            <div className={styles.statInfo}>
                                                <p>Faculty Members</p>
                                                <h3>15</h3>
                                            </div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <div className={`${styles.iconBox} ${styles.purple}`}>
                                                <FileText size={24} />
                                            </div>
                                            <div className={styles.statInfo}>
                                                <p>Subjects</p>
                                                <h3>5</h3>
                                            </div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <div className={`${styles.iconBox} ${styles.orange}`}>
                                                <Activity size={24} />
                                            </div>
                                            <div className={styles.statInfo}>
                                                <p>IA Completion</p>
                                                <h3>85%</h3>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions Row */}
                                    <div className={styles.card} style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                                        <div className={styles.quickActions}>
                                            <button className={styles.quickBtn} onClick={() => alert('Broadcasting message to all faculty...')}>
                                                <Bell size={20} className={styles.textBlue} />
                                                <span>Broadcast Message</span>
                                            </button>
                                            <button className={styles.quickBtn} onClick={() => alert('Scheduling dept meeting...')}>
                                                <Clock size={20} className={styles.textPurple} />
                                                <span>Schedule Meeting</span>
                                            </button>
                                            <button className={styles.quickBtn} onClick={() => alert('Downloading monthly report...')}>
                                                <FileText size={20} className={styles.textGreen} />
                                                <span>Monthly Report</span>
                                            </button>
                                            <button className={styles.quickBtn} onClick={() => setActiveTab('update-marks')}>
                                                <Edit size={20} className={styles.textOrange} />
                                                <span>Update Marks</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Alert & Charts Row */}
                                    <div className={styles.gridTwoOne}>
                                        <div className={styles.leftColumn}>
                                            <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                                                <div className={styles.cardHeader}>
                                                    <h3>Department Performance (Avg IA Score)</h3>
                                                </div>
                                                <div className={styles.circlesContainer}>
                                                    {branchPerformanceData.labels.map((label, index) => {
                                                        const value = branchPerformanceData.datasets[0].data[index];
                                                        const data = {
                                                            labels: ['Score', 'Remaining'],
                                                            datasets: [{
                                                                data: [value, 100 - value],
                                                                backgroundColor: ['#8b5cf6', '#f3f4f6'],
                                                                borderWidth: 0,
                                                                cutout: '70%'
                                                            }]
                                                        };
                                                        return (
                                                            <div key={index} className={styles.circleItem}>
                                                                <div style={{ height: '120px', width: '120px', position: 'relative' }}>
                                                                    <Doughnut data={data} options={{ ...doughnutOptions, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                                                                    <div className={styles.circleLabel}>
                                                                        <span className={styles.circleValue}>{value}%</span>
                                                                    </div>
                                                                </div>
                                                                <p className={styles.circleName}>{label}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.rightColumn}>


                                            <div className={styles.card}>
                                                <div className={styles.cardHeader}>
                                                    <h3>Recent Alerts</h3>
                                                </div>
                                                <div className={styles.alertList}>
                                                    {departmentAlerts.map(alert => (
                                                        <div key={alert.id} className={`${styles.alertItem} ${styles[alert.type]}`}>
                                                            <AlertTriangle size={16} />
                                                            <div>
                                                                <p>{alert.message}</p>
                                                                <span>{alert.date}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* UPDATE MARKS TAB (NEW) */}
                            {activeTab === 'update-marks' && (
                                <div className={styles.updateMarksContainer}>
                                    <div className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <h3>Modify Student Marks</h3>
                                            <div className={styles.filterGroup}>
                                                <select
                                                    className={styles.deptSelect}
                                                    value={selectedSubject?.id || ''}
                                                    onChange={(e) => {
                                                        const sub = subjects.find(s => s.id === parseInt(e.target.value));
                                                        setSelectedSubject(sub);
                                                    }}
                                                >
                                                    {subjects.map(sub => (
                                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                    ))}
                                                </select>
                                                <button className={styles.saveBtn} onClick={saveMarks}>
                                                    <Save size={16} /> Save Changes
                                                </button>
                                            </div>
                                        </div>
                                        <p className={styles.helperText}>
                                            Edit marks directly in the table. Changes are tracked locally until saved.
                                            Max Marks: CIE-1 ({selectedSubject?.cie1MaxMarks}), CIE-2 ({selectedSubject?.cie2MaxMarks || 0}) - Total ({selectedSubject?.totalMaxMarks})
                                        </p>
                                        <div className={styles.tableWrapper}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Sl. No.</th>
                                                        <th>Reg No</th>
                                                        <th>Student Name</th>
                                                        <th>Sem/Sec</th>
                                                        {selectedSubject?.cie1MaxMarks > 0 && <th>CIE-1 ({selectedSubject.cie1MaxMarks})</th>}
                                                        {selectedSubject?.cie2MaxMarks > 0 && <th>CIE-2 ({selectedSubject.cie2MaxMarks})</th>}
                                                        <th>Total ({selectedSubject?.totalMaxMarks})</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {students.map((student, index) => {
                                                        const sMarks = subjectMarks[student.id] || {}; // This is a map of IA types? 
                                                        // Wait, the API returns list of IAMarks. My map logic was: marksMap[studentId][iaType].
                                                        // But here the UI seems to be for a specific IA type? 
                                                        // Actually the previous UI had columns for IA1, IA2, IA3.
                                                        // The "Real Sheet" implies a grid for *one* IA (e.g. IA-1).
                                                        // But the previous dashboard had columns for IA1, IA2, IA3.
                                                        // Mixing these is tricky. The sheet shows "IA-1" at the top.
                                                        // User said "if here i change...".
                                                        // Let's assume we are editing **IA-1** for now, or add a selector for IA Type?
                                                        // The previous UI had IA1, IA2, IA3 columns. 
                                                        // If we switch to CO1/CO2, we can't show ALL IAs at once easily (too many columns).
                                                        // I will add an "IA Selector" (IA1, IA2, IA3) and show CO1/CO2 for THAT IA.

                                                        // For now, let's hardcode IA1 or add a selector.
                                                        // I'll add a selector for IA Type above the table.

                                                        const currentIA = 'IA1'; // TODO: Make dynamic state
                                                        // Retrieve existing marks or edited marks
                                                        // editingMarks structure needs to change to: { studentId: { co1: val, co2: val } }

                                                        const iMarks = sMarks[currentIA] || {};
                                                        const editMark = editingMarks[student.id] || {};

                                                        const valCIE1 = editMark.cie1 !== undefined ? editMark.cie1 : (iMarks.cie1Score || '');
                                                        const valCIE2 = editMark.cie2 !== undefined ? editMark.cie2 : (iMarks.cie2Score || '');

                                                        // Total
                                                        const total = (Number(valCIE1) || 0) + (Number(valCIE2) || 0);

                                                        return (
                                                            <tr key={student.id}>
                                                                <td>{index + 1}</td>
                                                                <td>{student.regNo}</td>
                                                                <td>{student.name}</td>
                                                                <td>{student.sem} - {student.section}</td>

                                                                {selectedSubject?.cie1MaxMarks > 0 && (
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className={styles.markInput}
                                                                            value={valCIE1}
                                                                            onChange={(e) => handleMarkChange(student.id, 'cie1', e.target.value)}
                                                                        />
                                                                    </td>
                                                                )}

                                                                {selectedSubject?.cie2MaxMarks > 0 && (
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className={styles.markInput}
                                                                            value={valCIE2}
                                                                            onChange={(e) => handleMarkChange(student.id, 'cie2', e.target.value)}
                                                                        />
                                                                    </td>
                                                                )}

                                                                <td style={{ fontWeight: 'bold' }}>
                                                                    {Math.min(total, selectedSubject?.totalMaxMarks || 100)}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* IA MONITORING TAB */}
                            {activeTab === 'monitoring' && (
                                <div className={styles.monitoringContainer}>
                                    <div className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <h3>Subject-wise IA Submission Status</h3>
                                            <div className={styles.filterGroup}>
                                                <select className={styles.deptSelect} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                                                    <option>All Semesters</option>
                                                    <option>2nd Semester</option>
                                                    <option>4th Semester</option>
                                                </select>
                                            </div>
                                        </div>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Subject Name</th>
                                                    <th>Faculty</th>
                                                    <th>Status</th>
                                                    <th>Pending Count</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subjectsByDept[selectedDept]?.map((subName, idx) => {
                                                    // Find the Real Faculty for this subject
                                                    const subObj = facultySubjects.find(fs => fs.name === subName) || {};
                                                    const facultyId = subObj.instructorId;
                                                    const facultyObj = facultyProfiles.find(fp => fp.id === facultyId) || { name: 'Visiting Faculty', id: 'VF' };

                                                    // Mock Status Logic
                                                    const statusOptions = ['Approved', 'Submitted', 'Pending'];
                                                    const status = statusOptions[idx % 3];

                                                    return (
                                                        <tr key={idx} style={{ transition: 'background 0.2s' }}>
                                                            <td style={{ fontWeight: 500 }}>{subName}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{
                                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                                        background: '#eff6ff', color: '#3b82f6',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontWeight: 600, fontSize: '0.85rem'
                                                                    }}>
                                                                        {facultyObj.name.charAt(0)}
                                                                    </div>
                                                                    <span>{facultyObj.name}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`${styles.statusBadge} ${status === 'Approved' ? styles.approved : status === 'Submitted' ? styles.submitted : styles.pending}`}>
                                                                    {status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {status === 'Pending' ? (
                                                                    <span style={{ color: '#ef4444', fontWeight: 500 }}>12 Students</span>
                                                                ) : (
                                                                    <span style={{ color: '#94a3b8' }}>-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className={styles.secondaryBtn}
                                                                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                                                    onClick={() => setViewingSubject({ name: subName, faculty: facultyObj.name })}
                                                                >
                                                                    View
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Subject Details Modal */}
                                    {viewingSubject && (
                                        <div className={styles.modalOverlay} onClick={() => setViewingSubject(null)}>
                                            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                                                <div className={styles.modalHeader}>
                                                    <h2>{viewingSubject.name}</h2>
                                                    <button className={styles.closeBtn} onClick={() => setViewingSubject(null)}>
                                                        <X size={24} />
                                                    </button>
                                                </div>
                                                <div className={styles.modalBody}>
                                                    <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                                                        Faculty: <span style={{ color: '#111827', fontWeight: 600 }}>{viewingSubject.faculty}</span>
                                                    </p>
                                                    <div className={styles.tableWrapper}>
                                                        <table className={styles.table}>
                                                            <thead>
                                                                <tr>
                                                                    <th>Sl. No.</th>
                                                                    <th>Reg No</th>
                                                                    <th>Student Name</th>
                                                                    <th>CIE-1</th>
                                                                    <th>CIE-2</th>
                                                                    <th>CIE-3</th>
                                                                    <th>Average</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {deptStudents.map((student, index) => (
                                                                    <tr key={student.id}>
                                                                        <td>{index + 1}</td>
                                                                        <td>{student.regNo}</td>
                                                                        <td>{student.name}</td>
                                                                        <td>{student.marks.ia1}</td>
                                                                        <td>{student.marks.ia2}</td>
                                                                        <td>{student.marks.ia3}</td>
                                                                        <td style={{ fontWeight: 'bold' }}>
                                                                            {Math.round((Number(student.marks.ia1) + Number(student.marks.ia2) + Number(student.marks.ia3)) / 3)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STUDENT PERFORMANCE TAB */}
                            {activeTab === 'performance' && (
                                <div className={styles.performanceContainer}>
                                    <div className={styles.gridTwo}>
                                        <div className={styles.card}>
                                            <h3>Semester Progress</h3>
                                            <div className={styles.chartContainer}>
                                                <Line data={hodTrendData} options={commonOptions} />
                                            </div>
                                        </div>
                                        <div className={styles.card}>
                                            <h3>Grade Distribution</h3>
                                            <div className={styles.doughnutContainer}>
                                                <Doughnut data={hodGradeDistribution} options={doughnutOptions} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.card} style={{ marginTop: '1.5rem' }}>
                                        <h3>At-Risk Students (Action Required)</h3>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Reg No</th>
                                                    <th>Name</th>
                                                    <th>Attendance</th>
                                                    <th>Avg Marks</th>
                                                    <th>Issue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {atRiskStudents.map((student) => (
                                                    <tr key={student.id}>
                                                        <td>{student.rollNo}</td>
                                                        <td>{student.name}</td>
                                                        <td className={styles.textRed}>{student.attendance}%</td>
                                                        <td className={styles.textRed}>{student.avgMarks}/25</td>
                                                        <td>
                                                            <span className={styles.issueTag}>{student.issue}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* FACULTY TAB */}
                            {activeTab === 'faculty' && (
                                <div className={styles.facultyContainer}>
                                    <div className={styles.card}>
                                        <h3>Faculty Workload & Performance</h3>
                                        <div className={styles.facultyList}>
                                            {facultyWorkload.map(fac => (
                                                <div key={fac.id} className={styles.facultyItem}>
                                                    <div className={styles.facProfile}>
                                                        <div className={styles.avatarSm}>{fac.name.charAt(0)}</div>
                                                        <div>
                                                            <p className={styles.facName}>{fac.name}</p>
                                                            <small className={styles.facStatus}>{fac.status}</small>
                                                        </div>
                                                    </div>
                                                    <div className={styles.facMetrics}>
                                                        <div className={styles.metric}>
                                                            <span>Submission Punctuality</span>
                                                            <div className={styles.progressBar}>
                                                                <div style={{ width: '90%' }} className={styles.fillGreen}></div>
                                                            </div>
                                                        </div>
                                                        <div className={styles.metric}>
                                                            <span>Student Avg Performance</span>
                                                            <div className={styles.progressBar}>
                                                                <div style={{ width: '75%' }} className={styles.fillBlue}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* APPROVALS TAB */}
                            {activeTab === 'approvals' && (
                                <div className={styles.approvalsContainer}>
                                    <div className={styles.infoBanner}>
                                        <CheckCircle size={20} />
                                        <p>You have <strong>2</strong> IA Bundles pending for final approval.</p>
                                    </div>

                                    {subjectsByDept[selectedDept]?.slice(0, 2).map((sub, idx) => (
                                        <div key={idx} className={styles.approvalCard}>
                                            <div className={styles.approvalHeader}>
                                                <div>
                                                    <h4>{sub}</h4>
                                                    <span>IA-2 Marks | Faculty: {facultyWorkload[idx]?.name}</span>
                                                </div>
                                                <div className={styles.approvlActions}>
                                                    <button className={styles.rejectBtn}>Reject</button>
                                                    <button className={styles.approveBtn}>Approve & Lock</button>
                                                </div>
                                            </div>
                                            <table className={styles.miniTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Reg No</th>
                                                        <th>Student</th>
                                                        <th>Marks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {deptStudents?.slice(0, 3).map(st => (
                                                        <tr key={st.id}>
                                                            <td>{st.regNo}</td>
                                                            <td>{st.name}</td>
                                                            <td>{st.marks.ia2}/25</td>
                                                        </tr>
                                                    ))}
                                                    <tr>
                                                        <td colSpan="3" style={{ textAlign: 'center', color: '#6b7280' }}>+ {deptStudents?.length > 3 ? deptStudents.length - 3 : 0} more records</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ANALYTICS TAB */}
                            {activeTab === 'analytics' && (
                                <div className={styles.analyticsContainer}>
                                    <div className={styles.gridTwo}>
                                        <div className={styles.card}>
                                            <h3>IA Submission Status</h3>
                                            <div className={styles.doughnutContainer}>
                                                <Pie data={iaSubmissionStatus} options={doughnutOptions} />
                                            </div>
                                        </div>
                                        <div className={styles.card}>
                                            <h3>Year-on-Year Improvement</h3>
                                            <div className={styles.chartContainer}>
                                                <Line data={hodTrendData} options={commonOptions} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.card} style={{ marginTop: '1.5rem' }}>
                                        <h3>Download Reports</h3>
                                        <div className={styles.downloadOptions}>
                                            <button className={styles.downloadBtn}><FileText size={16} /> Department IA Report (PDF)</button>
                                            <button className={styles.downloadBtn}><FileText size={16} /> Consolidated Marks Sheet (Excel)</button>
                                            <button className={styles.downloadBtn}><FileText size={16} /> Low Performers List (CSV)</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LESSON PLANS TAB */}
                            {activeTab === 'lesson-plans' && (
                                <div className={styles.lessonPlansContainer}>
                                    <div className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <h3>Department Syllabus Progress</h3>
                                        </div>
                                        <div className={styles.gridContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                                            {subjectsByDept[selectedDept]?.map((subName, idx) => {
                                                const subId = idx + 1; // Assuming mapped ID roughly correlates for demo
                                                // Try to match real ID from subjects state if possible, else fallback
                                                const realSub = subjects.find(s => s.name === subName);
                                                const idToUse = realSub ? realSub.id : subId;

                                                const savedTracker = localStorage.getItem('syllabusTracker');
                                                const progress = savedTracker ? (JSON.parse(savedTracker)[idToUse] || {}) : {};

                                                const savedStructure = localStorage.getItem('syllabusStructure');
                                                const structure = savedStructure ? (JSON.parse(savedStructure)[idToUse] || []) : [];

                                                const savedCie = localStorage.getItem('cieSelector');
                                                const cieSelector = savedCie ? (JSON.parse(savedCie)[idToUse] || {}) : {};

                                                const units = structure.length > 0 ? structure : [
                                                    { id: 'u1', name: 'Unit 1: Introduction' },
                                                    { id: 'u2', name: 'Unit 2: Core Concepts' },
                                                    { id: 'u3', name: 'Unit 3: Advanced Topics' },
                                                    { id: 'u4', name: 'Unit 4: Application' },
                                                    { id: 'u5', name: 'Unit 5: Case Studies' }
                                                ];

                                                const completedCount = units.filter(u => progress[u.id]).length;
                                                const totalUnits = units.length;
                                                const percent = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

                                                return (
                                                    <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                            <div>
                                                                <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', color: '#111827' }}>{subName}</h4>
                                                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Faculty: {facultyWorkload[idx % facultyWorkload.length]?.name || 'Unknown'}</span>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: percent === 100 ? '#10b981' : '#3b82f6' }}>{percent}%</span>
                                                            </div>
                                                        </div>

                                                        <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                                                            <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.5s ease' }}></div>
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {units.slice(0, 3).map(u => (
                                                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: progress[u.id] ? '#374151' : '#9ca3af' }}>
                                                                    <div style={{
                                                                        width: '16px', height: '16px', borderRadius: '50%',
                                                                        border: '2px solid', borderColor: progress[u.id] ? '#10b981' : '#d1d5db',
                                                                        background: progress[u.id] ? '#10b981' : 'transparent',
                                                                        marginRight: '8px', display: 'grid', placeItems: 'center', flexShrink: 0
                                                                    }}>
                                                                        {progress[u.id] && <CheckCircle size={10} color="white" />}
                                                                    </div>
                                                                    <span style={{ textDecoration: progress[u.id] ? 'line-through' : 'none', marginRight: '8px' }}>{u.name}</span>
                                                                    {cieSelector[u.id] && (
                                                                        <span style={{
                                                                            fontSize: '0.7rem', fontWeight: 'bold', color: '#7c3aed',
                                                                            backgroundColor: '#f5f3ff', padding: '1px 6px', borderRadius: '4px',
                                                                            border: '1px solid #7c3aed', marginLeft: 'auto'
                                                                        }}>
                                                                            CIE
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {units.length > 3 && (
                                                                <div style={{ fontSize: '0.8rem', color: '#6b7280', paddingLeft: '24px' }}>
                                                                    + {units.length - 3} more topics
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* END LESSON PLANS TAB */}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default HODDashboard;
