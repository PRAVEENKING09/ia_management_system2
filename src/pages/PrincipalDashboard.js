import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import styles from './PrincipalDashboard.module.css';
import {
    LayoutDashboard, Users, GraduationCap, FileText, TrendingUp,
    ShieldCheck, Calendar, BarChart2, Search, Award
} from 'lucide-react';
import {
    principalStats, hodSubmissionStatus,
    academicTrends, deptRankings, attendanceCorrelation, collegeStats,
    heatmapData, studentsList, departments, getStudentsByDept
} from '../utils/mockData';
import {
    Line, Scatter, Doughnut
} from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { X } from 'lucide-react';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, ArcElement
);

/* Sub-Components extracted for performance */

const StudentSentinel = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (val.length > 1) {
            const matches = studentsList.filter(s =>
                s.name.toLowerCase().includes(val.toLowerCase()) ||
                s.regNo.toLowerCase().includes(val.toLowerCase())
            ).slice(0, 5);
            setResults(matches);
            setShowResults(true);
        } else {
            setShowResults(false);
        }
    };

    return (
        <div className={styles.sentinelContainer}>
            <div style={{ position: 'relative' }}>
                <Search className={styles.searchIcon} size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                    type="text"
                    className={styles.searchBarInput}
                    placeholder="Search Student..."
                    value={query}
                    onChange={handleSearch}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                />
            </div>
            {showResults && results.length > 0 && (
                <div className={styles.searchResultDropdown}>
                    {results.map(student => (
                        <div key={student.id} className={styles.resultItem} onClick={() => alert(`Opening Profile: ${student.name}`)}>
                            <div className={styles.resultAvatar}>{student.name.charAt(0)}</div>
                            <div className={styles.resultInfo}>
                                <h4>{student.name}</h4>
                                <p>{student.regNo} | {student.department}</p>
                            </div>
                            <span className={styles.riskBadge}>View</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const DirectorySection = ({ selectedDept, deptStudents, handleDeptClick, setSelectedDept, setSelectedStudentProfile }) => {
    if (!selectedDept) {
        return (
            <div className={styles.sectionVisible}>
                <h3 className={styles.chartTitle} style={{ marginBottom: '1.5rem' }}>Select Department</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {departments.map(dept => (
                        <div
                            key={dept.id}
                            className={styles.glassCard}
                            onClick={() => handleDeptClick(dept)}
                            style={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                borderLeft: `4px solid ${dept.id === 'CS' ? '#3b82f6' : dept.id === 'ME' ? '#f59e0b' : '#10b981'}`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '1.2rem', color: '#1e293b', margin: 0 }}>{dept.name}</h4>
                                <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{dept.id}</span>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                <p>HOD: {dept.hod}</p>
                                <p>Total Students: {120}</p>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <span style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>View Students →</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.sectionVisible}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                <button
                    onClick={() => setSelectedDept(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
                >← Back</button>
                <div>
                    <h3 className={styles.chartTitle} style={{ marginBottom: 0 }}>{selectedDept.name} Students</h3>
                    <p style={{ color: '#64748b', margin: 0 }}>Total Records: {deptStudents.length}</p>
                </div>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Roll No</th>
                            <th>Name</th>
                            <th>Sem</th>
                            <th>Section</th>
                            <th>Attendance</th>
                            <th>IA Performance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deptStudents.map(student => (
                            <tr key={student.id} onClick={() => setSelectedStudentProfile(student)} style={{ cursor: 'pointer' }}>
                                <td>{student.rollNo}</td>
                                <td style={{ fontWeight: 600 }}>{student.name}</td>
                                <td>{student.sem}</td>
                                <td>{student.section}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem',
                                        background: student.attendance >= 75 ? '#dcfce7' : '#fee2e2',
                                        color: student.attendance >= 75 ? '#166534' : '#991b1b'
                                    }}>
                                        {student.attendance}%
                                    </span>
                                </td>
                                <td>
                                    <div style={{ width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(student.marks.ia1 + student.marks.ia2) / 40 * 100}%`,
                                            height: '100%',
                                            background: '#3b82f6'
                                        }}></div>
                                    </div>
                                </td>
                                <td>
                                    <button className={styles.secondaryBtn} onClick={(e) => { e.stopPropagation(); setSelectedStudentProfile(student); }}>
                                        View Profile
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StudentProfileModal = ({ selectedStudentProfile, setSelectedStudentProfile, selectedDept }) => {
    if (!selectedStudentProfile) return null;
    const s = selectedStudentProfile;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedStudentProfile(null)}>
            <div style={{
                background: 'white', borderRadius: '16px', width: '90%', maxWidth: '600px',
                padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setSelectedStudentProfile(null)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <X size={24} color="#64748b" />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', background: '#e0f2fe', color: '#0369a1',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 'bold', margin: '0 auto 1rem'
                    }}>
                        {s.name.charAt(0)}
                    </div>
                    <h2 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>{s.name}</h2>
                    <p style={{ margin: 0, color: '#64748b' }}>{s.rollNo} | {selectedDept?.name} | {s.sem} Sem</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className={styles.glassCard} style={{ padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.9rem' }}>Academic Performance</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>IA-1</span>
                            <span>{s.marks.ia1}/20</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>IA-2</span>
                            <span>{s.marks.ia2}/20</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                            <span>Total</span>
                            <span>{s.marks.ia1 + s.marks.ia2}/40</span>
                        </div>
                    </div>
                    <div className={styles.glassCard} style={{ padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.9rem' }}>Attendance & Behavior</h4>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span>Attendance</span>
                                <span style={{ fontWeight: 'bold', color: s.attendance < 75 ? '#dc2626' : '#16a34a' }}>{s.attendance}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                                <div style={{ width: `${s.attendance}%`, height: '100%', background: s.attendance < 75 ? '#dc2626' : '#16a34a', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                        <div>
                            <span style={{ padding: '4px 8px', background: '#f0f9ff', color: '#0284c7', borderRadius: '4px', fontSize: '0.8rem' }}>Good Conduct</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={styles.primaryBtn} onClick={() => alert('Report Generated')}>Download Report Card</button>
                    <button className={styles.secondaryBtn} onClick={() => alert('Contacting Parents...')}>Contact Parent</button>
                </div>
            </div>
        </div>
    );
};

const ActionCenter = () => (
    <div className={styles.glassCard} style={{ marginTop: '2rem' }}>
        <h3 className={styles.chartTitle} style={{ marginBottom: '1rem' }}>Principal Action Center</h3>
        <div className={styles.quickActionsGrid}>
            <button className={styles.actionBtn} onClick={() => alert('Approval Request Sent to HODs')}>
                <ShieldCheck size={20} color="#2563eb" />
                <span>Approve Pending IAs</span>
            </button>
            <button className={styles.actionBtn} onClick={() => alert('Report Generated & Downloaded as PDF')}>
                <FileText size={20} color="#059669" />
                <span>Download Monthly Report</span>
            </button>
            <button className={styles.actionBtn} onClick={() => alert('Circular Broadcasted to All Faculty')}>
                <Users size={20} color="#7c3aed" />
                <span>Broadcast Circular</span>
            </button>
            <button className={styles.actionBtn} onClick={() => alert('Meeting Scheduled with HODs')}>
                <Calendar size={20} color="#ca8a04" />
                <span>Schedule HOD Meeting</span>
            </button>
        </div>
    </div>
);

const ComplianceSection = () => (
    <div className={styles.tableCard}>
        <h3 className={styles.chartTitle}>HOD IA Submission Status</h3>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Department</th>
                    <th>HOD Name</th>
                    <th>Status</th>
                    <th>Punctuality</th>
                </tr>
            </thead>
            <tbody>
                {hodSubmissionStatus.map((item) => (
                    <tr key={item.id}>
                        <td>{item.dept}</td>
                        <td>{item.hod}</td>
                        <td>
                            <span className={`${styles.statusBadge} ${item.status === 'Approved' ? styles.statusApproved : item.status === 'Submitted' ? styles.statusSubmitted : styles.statusPending}`}>
                                {item.status}
                            </span>
                        </td>
                        <td>
                            <span style={{ color: item.punctuality === 'Delayed' ? '#ef4444' : '#16a34a', fontWeight: 600 }}>
                                {item.punctuality}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const OverviewSection = ({ barData }) => (
    <>
        <div className={styles.metricsGrid}>
            <div className={styles.glassCard}>
                <div className={styles.cardIcon} style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <Users size={24} />
                </div>
                <div>
                    <p className={styles.cardLabel}>Total Students</p>
                    <p className={styles.cardValue}>{principalStats.totalStudents}</p>
                </div>
            </div>
            <div className={styles.glassCard}>
                <div className={styles.cardIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
                    <GraduationCap size={24} />
                </div>
                <div>
                    <p className={styles.cardLabel}>Placement Rate</p>
                    <p className={styles.cardValue}>{principalStats.placementRate}%</p>
                </div>
            </div>
            <div className={styles.glassCard}>
                <div className={styles.cardIcon} style={{ background: '#fef9c3', color: '#ca8a04' }}>
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className={styles.cardLabel}>Avg Attendance</p>
                    <p className={styles.cardValue}>{principalStats.avgAttendance}%</p>
                </div>
            </div>
            <div className={styles.glassCard}>
                <div className={styles.cardIcon} style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <p className={styles.cardLabel}>Pending Approvals</p>
                    <p className={styles.cardValue} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        3 <span className={`${styles.indicator} ${styles.redLight}`}></span>
                    </p>
                </div>
            </div>
        </div>

        <div className={styles.glassCard} style={{ marginTop: '2rem', padding: '1.5rem' }}>
            <h3 className={styles.chartTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                Department-wise Academic Performance
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'center', padding: '1rem 0' }}>
                {collegeStats.branches.map((dept, index) => {
                    const score = collegeStats.branchPerformance[index];
                    const color = barData.datasets[0].backgroundColor[index];
                    const chartData = {
                        labels: ['Score', 'Remaining'],
                        datasets: [{
                            data: [score, 100 - score],
                            backgroundColor: [color, '#f1f5f9'],
                            borderWidth: 0,
                            cutout: '78%',
                            borderRadius: 30,
                        }]
                    };
                    return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
                            <div style={{ height: '120px', width: '120px', position: 'relative' }}>
                                <Doughnut
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                        animation: { duration: 1500, easing: 'easeOutQuart' }
                                    }}
                                />
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                                }}>
                                    <span style={{ fontWeight: '800', fontSize: '1.5rem', color: '#1e293b', lineHeight: 1 }}>{score}%</span>
                                </div>
                            </div>
                            <span style={{ marginTop: '1rem', fontWeight: 600, fontSize: '0.95rem', color: '#64748b', textAlign: 'center' }}>{dept}</span>
                        </div>
                    );
                })}
            </div>
        </div>

        <ActionCenter />
    </>
);

const PrincipalDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // Directory State
    const [selectedDept, setSelectedDept] = useState(null);
    const [deptStudents, setDeptStudents] = useState([]);
    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

    const menuItems = [
        {
            label: 'Dashboard Overview',
            path: '/dashboard/principal',
            icon: <LayoutDashboard size={20} />,
            isActive: activeTab === 'overview',
            onClick: () => setActiveTab('overview')
        },

        {
            label: 'IA Compliance Monitor',
            path: '/dashboard/principal/compliance',
            icon: <ShieldCheck size={20} />,
            isActive: activeTab === 'compliance',
            onClick: () => setActiveTab('compliance')
        },

        {
            label: 'Student Directory',
            path: '/dashboard/principal/directory',
            icon: <Users size={20} />,
            isActive: activeTab === 'directory',
            onClick: () => { setActiveTab('directory'); setSelectedDept(null); }
        },
    ];

    /* Chart Configs and Helper Logic */
    // ... (Use existing chart configs)
    const barData = {
        labels: collegeStats.branches,
        datasets: [{
            label: 'Avg IA Performance (%)',
            data: collegeStats.branchPerformance,
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            borderRadius: 6
        }]
    };

    const scatterData = {
        datasets: [{
            label: 'Attendance vs IA Marks',
            data: attendanceCorrelation,
            backgroundColor: 'rgba(99, 102, 241, 0.6)',
        }]
    };

    const handleDeptClick = (dept) => {
        setSelectedDept(dept);
        const students = getStudentsByDept(dept.id);
        setDeptStudents(students);
    };

    return (
        <DashboardLayout menuItems={menuItems}>
            <div style={{ padding: '0' }}>
                <header className={styles.header}>
                    <div className={styles.welcomeText}>
                        <h1>Hello, Dr. Gowri Shankar</h1>
                        <p>Principal | Sanjay Gandhi Polytechnic</p>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.secondaryBtn}
                            onClick={() => alert("Downloading Full Institute Report...")}
                            style={{ padding: '0.5rem', marginRight: '0.5rem', border: 'none', background: '#ecfdf5', color: '#059669', borderRadius: '8px', cursor: 'pointer' }}
                            title="Download Full Report"
                        >
                            <FileText size={20} />
                        </button>
                        <StudentSentinel />
                        <select className={styles.yearSelector}>
                            <option>Academic Year 2025-26</option>
                            <option>Academic Year 2024-25</option>
                        </select>
                    </div>
                </header>

                {/* Dynamic Content */}
                <div className={styles.sectionVisible}>
                    {activeTab === 'overview' && <OverviewSection barData={barData} />}

                    {activeTab === 'compliance' && <ComplianceSection />}

                    {activeTab === 'directory' && <DirectorySection
                        selectedDept={selectedDept}
                        deptStudents={deptStudents}
                        handleDeptClick={handleDeptClick}
                        setSelectedDept={setSelectedDept}
                        setSelectedStudentProfile={setSelectedStudentProfile}
                    />}
                </div>
            </div>

            <StudentProfileModal
                selectedStudentProfile={selectedStudentProfile}
                setSelectedStudentProfile={setSelectedStudentProfile}
                selectedDept={selectedDept}
            />
        </DashboardLayout >
    );
};

export default PrincipalDashboard;
