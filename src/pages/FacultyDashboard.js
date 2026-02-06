import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FilePlus, Save, AlertCircle, Phone, FileText, CheckCircle, Search, Filter, Mail, X, Download, Clock, BarChart2, TrendingDown, Award, ClipboardList, AlertTriangle, Edit3, Calendar, UserCheck, BookOpen, Upload } from 'lucide-react';
import { facultyData, facultyProfiles, facultySubjects, studentsList, facultyClassAnalytics, labSchedule, getMenteesForFaculty } from '../utils/mockData';
import styles from './FacultyDashboard.module.css';

const FacultyDashboard = () => {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('Overview');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [marks, setMarks] = useState({}); // Map { studentId: { co1: val... } }
    const [isLocked, setIsLocked] = useState(false); // For Commit/Edit workflow
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');

    // API State
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const API_BASE = 'http://localhost:8080/api/marks';

    // Verify Faculty
    const currentFaculty = facultyProfiles.find(f => f.id === user?.id) || facultyData;

    // Filter Subjects for this Faculty
    const mySubjects = facultySubjects.filter(sub => sub.instructorId === currentFaculty.id);

    // Filter Mentees
    const myMentees = getMenteesForFaculty(currentFaculty.id);

    // Filter Defaulters (Attendance < 75%)
    const attendanceDefaulters = studentsList.filter(s => s.attendance < 75);

    React.useEffect(() => {
        // Fallback to Mock Data
        // setSubjects(facultySubjects); // Use filtered mySubjects instead
        setStudents(studentsList);    // Use imported mock data directly

        // Initialize Global Marks State
        const initialMarks = {};

        // Pre-initialize subject keys to avoid undefined errors
        const subjectIds = [1, 2, 3, 4]; // Maths, English, CAEG, Python
        subjectIds.forEach(id => {
            initialMarks[id] = {};
        });

        // Also ensure any other faculty subjects are init
        facultySubjects.forEach(sub => {
            if (!initialMarks[sub.id]) initialMarks[sub.id] = {};
        });

        studentsList.forEach((student, index) => {
            const subIds = [1, 2, 3, 4];
            subIds.forEach(id => {
                if (initialMarks[id]) {
                    // Force low marks for some students to demo "Low Performers"
                    const isLowPerformer = index % 5 === 0; // Every 5th student
                    const min = isLowPerformer ? 5 : 15;
                    const max = isLowPerformer ? 14 : 30;

                    initialMarks[id][student.id] = {
                        cie1: Math.floor(Math.random() * (max - min + 1)) + min,
                        cie2: Math.floor(Math.random() * (max - min + 1)) + min
                    };
                }
            });
        });
        setAllStudentMarks(initialMarks);

    }, []);

    // -- Global Marks State for Real-time Updates --
    const [allStudentMarks, setAllStudentMarks] = useState({}); // { subjectId: { studentId: { cie1, cie2 } } }

    // -- Enhancement State --
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // -- Attendance State --
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({}); // { subjectId-date: { studentId: 'Present'/'Absent' } }
    const [savedAttendance, setSavedAttendance] = useState(false);

    const handleAttendanceChange = (studentId, status) => {
        if (!selectedSubject) return;
        const key = `${selectedSubject.id}-${attendanceDate}`;
        setAttendanceData(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [studentId]: status
            }
        }));
        setSavedAttendance(false);
    };

    const saveAttendance = () => {
        setSavedAttendance(true);
        showToast('Attendance Saved Successfully!');
    };

    // -- Syllabus State --
    const [lessonPlanData, setLessonPlanData] = useState(() => {
        const saved = localStorage.getItem('syllabusTracker');
        return saved ? JSON.parse(saved) : {};
    });

    // -- Syllabus Configuration State --
    const [syllabusConfig, setSyllabusConfig] = useState(() => {
        const saved = localStorage.getItem('syllabusStructure');
        return saved ? JSON.parse(saved) : {};
    });

    const [cieSelector, setCieSelector] = useState(() => {
        const saved = localStorage.getItem('cieSelector');
        return saved ? JSON.parse(saved) : {};
    });

    const [newUnitName, setNewUnitName] = useState('');
    const [addingToSubject, setAddingToSubject] = useState(null); // subjectId

    const addUnit = (subjectId) => {
        if (!newUnitName.trim()) return;

        const newUnit = {
            id: `u${Date.now()}`,
            name: newUnitName
        };

        setSyllabusConfig(prev => {
            const currentUnits = prev[subjectId] || [
                { id: 'u1', name: 'Unit 1: Introduction' },
                { id: 'u2', name: 'Unit 2: Core Concepts' },
                { id: 'u3', name: 'Unit 3: Advanced Topics' },
                { id: 'u4', name: 'Unit 4: Application' },
                { id: 'u5', name: 'Unit 5: Case Studies' }
            ];

            const newState = {
                ...prev,
                [subjectId]: [...currentUnits, newUnit]
            };
            localStorage.setItem('syllabusStructure', JSON.stringify(newState));
            return newState;
        });
        setNewUnitName('');
        setAddingToSubject(null);
        showToast('New Unit Added');
    };

    const toggleUnit = (subjectId, unitId) => {
        setLessonPlanData(prev => {
            const newState = {
                ...prev,
                [subjectId]: {
                    ...prev[subjectId],
                    [unitId]: !prev[subjectId]?.[unitId]
                }
            };
            localStorage.setItem('syllabusTracker', JSON.stringify(newState));
            return newState;
        });
    };

    const toggleCieSelection = (subjectId, unitId) => {
        setCieSelector(prev => {
            const newState = {
                ...prev,
                [subjectId]: {
                    ...prev[subjectId],
                    [unitId]: !prev[subjectId]?.[unitId]
                }
            };
            localStorage.setItem('cieSelector', JSON.stringify(newState));
            return newState;
        });
    };

    const menuItems = [
        {
            label: 'Overview',
            path: '/dashboard/faculty',
            icon: <LayoutDashboard size={20} />,
            isActive: activeSection === 'Overview',
            onClick: () => { setActiveSection('Overview'); setSelectedSubject(null); }
        },
        {
            label: 'My Students',
            path: '/dashboard/faculty',
            icon: <Users size={20} />,
            isActive: activeSection === 'My Students',
            onClick: () => { setActiveSection('My Students'); setSelectedSubject(null); }
        },

        {
            label: 'Lesson Plan',
            path: '/dashboard/faculty',
            icon: <BookOpen size={20} />,
            isActive: activeSection === 'Lesson Plan',
            onClick: () => { setActiveSection('Lesson Plan'); setSelectedSubject(null); }
        },
        {
            label: 'CIE Entry',
            path: '/dashboard/faculty',
            icon: <FilePlus size={20} />,
            isActive: activeSection === 'CIE Entry',
            onClick: () => { setActiveSection('CIE Entry'); setSelectedSubject(null); }
        },
        {
            label: 'Proctoring',
            path: '/dashboard/faculty',
            icon: <ClipboardList size={20} />,
            isActive: activeSection === 'Proctoring',
            onClick: () => { setActiveSection('Proctoring'); setSelectedSubject(null); }
        },
    ];

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
        setActiveSection('CIE Entry');

        // Populate 'marks' state from 'allStudentMarks'
        const subjectMarks = allStudentMarks[subject.id] || {};
        const formattedMarks = {};

        // Ensure every student has an entry
        studentsList.forEach(student => {
            const sm = subjectMarks[student.id] || { cie1: '', cie2: '' };
            formattedMarks[student.id] = {
                'CIE1': {
                    student: { id: student.id },
                    iaType: 'CIE1',
                    cie1Score: sm.cie1,
                    cie2Score: sm.cie2
                },
                cie1: sm.cie1,
                cie2: sm.cie2
            };
        });

        setMarks(formattedMarks);
        setIsLocked(false);
    };

    const handleMarkChange = (studentId, field, value) => {
        let numValue = parseInt(value, 10);
        if (value === '' || value === 'Ab') numValue = value; // Allow empty or Ab

        let max = 0;
        if (field === 'cie1') max = selectedSubject?.cie1MaxMarks || 30;
        else if (field === 'cie2') max = selectedSubject?.cie2MaxMarks || 30;

        if (typeof numValue === 'number' && numValue < 0) numValue = 0;
        if (typeof numValue === 'number' && numValue > max) numValue = max;

        // Update Local State (for UI)
        setMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: numValue
            }
        }));

        // Update Global State (Real-time Low Performers)
        if (selectedSubject) {
            setAllStudentMarks(prev => ({
                ...prev,
                [selectedSubject.id]: {
                    ...prev[selectedSubject.id],
                    [studentId]: {
                        ...prev[selectedSubject.id]?.[studentId],
                        [field]: numValue
                    }
                }
            }));
        }
    };

    const getLowPerformers = () => {
        let lowList = [];
        // Iterate over all subjects in allStudentMarks
        Object.keys(allStudentMarks).forEach(subId => {
            const subject = facultySubjects.find(s => s.id === parseInt(subId));
            if (!subject) return;

            const studentsMarks = allStudentMarks[subId];
            Object.keys(studentsMarks).forEach(stdId => {
                const m = studentsMarks[stdId];
                // Check ANY IA < 15
                const s1 = m.cie1 === 'Ab' ? 0 : (parseInt(m.cie1) || 0);
                const s2 = m.cie2 === 'Ab' ? 0 : (parseInt(m.cie2) || 0);

                // Find lowest score
                const minScore = Math.min(s1, s2);

                if (minScore < 15) { // Threshold 15/30
                    const student = studentsList.find(s => s.id === stdId);
                    if (student) {
                        lowList.push({
                            name: student.name,
                            subject: subject.name,
                            score: minScore
                        });
                    }
                }
            });
        });

        // Sort by lowest score and take top 5
        return lowList.sort((a, b) => (a.score === 'Ab' ? 0 : a.score) - (b.score === 'Ab' ? 0 : b.score)).slice(0, 5);
    };

    const calculateAverage = (student) => {
        if (selectedSubject) {
            const sMarks = marks[student.id] || {};
            const valCIE1 = Number(sMarks.cie1 === 'Ab' ? 0 : sMarks.cie1) || 0;
            const valCIE2 = Number(sMarks.cie2 === 'Ab' ? 0 : sMarks.cie2) || 0;
            return valCIE1 + valCIE2;
        }
        return "-";
    };

    const handleSave = async () => {
        setSaving(true);
        const updates = [];

        // Mock Save Operation
        // We simulate a delay to show the "Saving..." state
        const mockSave = new Promise((resolve) => {
            setTimeout(() => {
                resolve('Success');
            }, 800);
        });

        updates.push(mockSave);

        try {
            await Promise.all(updates);
            setIsLocked(true); // Lock the form (Commit)
            showToast('Changes Committed & Locked!', 'success');
        } catch (e) {
            showToast('Error saving marks', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = () => {
        setIsLocked(false);
        showToast('Editing Enabled', 'info');
    };



    const togglePreview = () => {
        showToast('Preview Mode: Showing Final Report View', 'info');
        // In a real app, this might open a modal or new route. 
        // For now, we utilize the download report as the "final output" check
        downloadCSV();
    };

    // --- NEW FEATURE: EXPORT CSV ---
    const downloadCSV = () => {
        const headers = ['Reg No', 'Name', 'Section', 'Batch', 'CIE-1', 'CIE-2', 'CIE-3', 'Average'];
        const rows = students.map(s => {
            const sMarks = marks[s.id] || {};
            const ia1Mark = sMarks['CIE1'] || {};

            const valCIE1 = sMarks.cie1 !== undefined ? sMarks.cie1 : (ia1Mark.cie1Score != null ? ia1Mark.cie1Score : 0);
            const valCIE2 = sMarks.cie2 !== undefined ? sMarks.cie2 : (ia1Mark.cie2Score != null ? ia1Mark.cie2Score : 0);

            return [
                s.rollNo,
                s.name,
                s.section,
                s.batch,
                valCIE1,
                valCIE2,
                0, // CIE-3 placeholder
                ((Number(valCIE1) || 0) + (Number(valCIE2) || 0))
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `CIE_Marks_Export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Marks Exported to CSV', 'success');
    };

    // --- NEW FEATURE: PROFILE MODAL ---
    const openProfile = (student) => {
        setSelectedStudent(student);
        setShowProfileModal(true);
    };

    const renderStudentProfileModal = () => {
        if (!showProfileModal || !selectedStudent) return null;

        return (
            <div className={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h2>Student Profile</h2>
                        <button className={styles.closeBtn} onClick={() => setShowProfileModal(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <div className={styles.profileHeader}>
                            <div className={styles.profileAvatar}>
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div className={styles.profileInfo}>
                                <h3>{selectedStudent.name}</h3>
                                <p className={styles.profileMeta}>{selectedStudent.rollNo}</p>
                                <span className={`${styles.badge} ${styles.good}`}>
                                    {selectedStudent.sem} Sem - {selectedStudent.section} ({selectedStudent.batch})
                                </span>
                            </div>
                        </div>

                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Email Address</span>
                                <span className={styles.infoValue}>{selectedStudent.rollNo.toLowerCase()}@college.edu</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Attendance</span>
                                <div className={styles.attendanceBarContainer}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span>Current Semester</span>
                                        <span style={{ fontWeight: 'bold' }}>{selectedStudent.attendance}%</span>
                                    </div>
                                    <div className={styles.attendanceTrack}>
                                        <div className={styles.attendanceFill} style={{ width: `${selectedStudent.attendance}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Academic Standing</span>
                                <span className={styles.infoValue} style={{ color: '#059669' }}>Good Standing</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Parent Contact</span>
                                <span className={styles.infoValue}>+91 98765 43210</span>
                            </div>
                        </div>

                        <button className={styles.saveBtn} style={{ width: '100%' }} onClick={() => showToast('Full Report Downloaded')}>
                            <FileText size={18} /> Download Full Academic Report
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- NEW FEATURE: UPLOAD MODAL ---
    const renderUploadModal = () => {
        if (!showUploadModal) return null;

        return (
            <div className={styles.modalOverlay} onClick={() => setShowUploadModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h2>Bulk Upload Marks</h2>
                        <button className={styles.closeBtn} onClick={() => setShowUploadModal(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <div className={styles.uploadArea} onClick={() => {
                            showToast('File Upload Simulation Success');
                            setShowUploadModal(false);
                        }}>
                            <Upload size={48} color="#2563eb" />
                            <div>
                                <p className={styles.uploadText}>Click to upload or drag and drop</p>
                                <p className={styles.uploadSubtext}>Excel, CSV files only (Max 2MB)</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className={styles.secondaryBtn} onClick={() => setShowUploadModal(false)}>Cancel</button>
                            <button className={styles.saveBtn} disabled>Upload Pending...</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    // --- VIEW RENDERERS ---

    const renderOverview = () => (
        <>
            <div className={styles.analyticsGrid}>
                {/* CIE STATUS */}
                <div className={styles.analyticsCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className={styles.analyticsTitle}>CIE (IA) STATUS</h3>
                        <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 'bold' }}>Deadline: Nov 10, 2025</span>
                    </div>
                    <div className={styles.analyticsContent}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{mySubjects.reduce((acc, curr) => acc + curr.studentCount, 0)}</span>
                            <span className={styles.statLabel}><Users size={14} /> Total Students</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultyClassAnalytics.evaluated}</span>
                            <span className={styles.statLabel}><CheckCircle size={14} /> Evaluated</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue} style={{ color: facultyClassAnalytics.pending > 0 ? '#ef4444' : 'inherit' }}>
                                {facultyClassAnalytics.pending > 0 ? <AlertTriangle size={14} color="#ef4444" style={{ marginRight: '4px' }} /> : <Clock size={14} />}
                                {facultyClassAnalytics.pending}
                            </span>
                            <span className={styles.statLabel}>Pending</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#6b7280' }}>
                            <span>Progress</span>
                            <span>{Math.round((facultyClassAnalytics.evaluated / (facultyClassAnalytics.evaluated + facultyClassAnalytics.pending)) * 100)}%</span>
                        </div>
                        <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${(facultyClassAnalytics.evaluated / (facultyClassAnalytics.evaluated + facultyClassAnalytics.pending)) * 100}%`, height: '100%', background: '#10b981' }}></div>
                        </div>
                    </div>
                </div>

                {/* CLASS ANALYTICS */}
                <div className={styles.analyticsCard}>
                    <h3 className={styles.analyticsTitle}>CLASS ANALYTICS</h3>
                    <div className={styles.analyticsContent}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultyClassAnalytics.avgScore}%</span>
                            <span className={styles.statLabel}><BarChart2 size={14} /> Avg Score</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultyClassAnalytics.lowPerformers}</span>
                            <span className={styles.statLabel}><TrendingDown size={14} /> Low Performers</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultyClassAnalytics.topPerformers}</span>
                            <span className={styles.statLabel}><Award size={14} /> Top Performers</span>
                        </div>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingDown size={16} style={{ transform: 'rotate(180deg)' }} /> Average score improved by 5% vs IA-1
                    </p>
                </div>
            </div>

            {attendanceDefaulters.length > 0 && (
                <div className={styles.alertBanner} style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: '#ef4444', padding: '0.5rem', borderRadius: '50%', color: 'white' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1rem', fontWeight: '600' }}>Critical Attendance Alert</h3>
                        <p style={{ margin: '0.25rem 0 0', color: '#b91c1c', fontSize: '0.9rem' }}>
                            {attendanceDefaulters.length} students have less than 75% attendance. Immediate action required.
                        </p>
                    </div>
                    <button className={styles.saveBtn} style={{ backgroundColor: '#dc2626' }} onClick={() => setActiveSection('My Students')}>
                        View List
                    </button>
                </div>
            )}

            <div className={styles.mainContentGrid}>
                <div className={styles.leftColumn}>
                    <section>
                        <h2 className={styles.sectionTitle}>My Subjects</h2>
                        <div className={styles.cardsGrid}>
                            {mySubjects.length > 0 ? mySubjects.map(sub => (
                                <div key={sub.id} className={styles.subjectCard} onClick={() => handleSubjectClick(sub)}>
                                    <div className={styles.cardHeader}>
                                        <h3 className={styles.subjectName}>{sub.name}</h3>
                                        <span className={styles.termBadge}>{sub.semester} Sem</span>
                                    </div>
                                    <div className={styles.subjectFooter}>
                                        <div className={styles.cardStats}>
                                            <Users size={16} color="#6b7280" />
                                            <span>{sub.studentCount} Students</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {/* Simulate attention needed if less than 90% complete */}
                                            <span className={styles.progressBadge} style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>Needs Attention</span>
                                            <span className={styles.progressBadge}>85% Comp</span>
                                        </div>
                                    </div>
                                </div>
                            )) : <p>No subjects assigned.</p>}
                        </div>
                    </section>

                    <section>
                        <h2 className={styles.sectionTitle}>Quick Actions</h2>
                        <div className={styles.quickActionsGrid}>
                            <button className={styles.actionBtn} onClick={() => showToast('Report Generated!')} title="Download consolidated marks sheet">
                                <FileText size={18} /> Generate Report
                            </button>
                            <button className={styles.actionBtn} onClick={() => setShowUploadModal(true)} title="Upload Excel/CSV marks">
                                <Upload size={18} /> Bulk Marks Upload
                            </button>
                            <button className={styles.actionBtn} onClick={() => showToast('Calling Parent...')} title="Direct call via system">
                                <Phone size={18} /> Parent Call
                            </button>
                            <button className={styles.actionBtn} onClick={() => showToast('Downloading Attendance Sheet...')} title="Download monthly attendance">
                                <Users size={18} /> Attendance Sheet
                            </button>
                        </div>
                    </section>

                    {/* NEW: Faculty Reminders Section */}
                    <section style={{ marginTop: '2rem' }}>
                        <h2 className={styles.sectionTitle}>My Reminders</h2>
                        <div className={styles.cardsGrid} style={{ gridTemplateColumns: '1fr' }}>

                            <div className={styles.subjectCard} style={{ borderLeft: '4px solid #f59e0b', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: '#b45309' }}>Attendance Pending</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f' }}>You haven't marked attendance for <strong>Python Prog. Lab</strong> today.</p>
                                </div>
                                <button className={styles.secondaryBtn} onClick={() => { setActiveSection('Attendance'); setSelectedSubject(mySubjects[0]); }} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Mark Now</button>
                            </div>

                            <div className={styles.subjectCard} style={{ borderLeft: '4px solid #3b82f6', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: '#1e40af' }}>Syllabus Report Due</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e3a8a' }}>Monthly Lesson Plan report for Oct is pending submission.</p>
                                </div>
                                <button className={styles.secondaryBtn} onClick={() => setActiveSection('Lesson Plan')} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>View</button>
                            </div>

                            <div className={styles.subjectCard} style={{ borderLeft: '4px solid #10b981', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: '#047857' }}>Mentorship Meeting</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#064e3b' }}>Scheduled with <strong>Ravi Kumar</strong> tomorrow at 11 AM.</p>
                                </div>
                                <button className={styles.secondaryBtn} onClick={() => setActiveSection('Proctoring')} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Details</button>
                            </div>

                        </div>
                    </section>
                </div>

                <div className={styles.rightColumn}>


                    {/* LOW PERFORMERS PANEL */}
                    <div className={styles.labCard}>
                        <h2 className={styles.cardTitle} style={{ color: '#ef4444' }}>Action Required: Low Performers</h2>
                        <div className={styles.scheduleList}>
                            {getLowPerformers().length > 0 ? getLowPerformers().map((item, i) => (
                                <div key={i} className={styles.scheduleItem} style={{ borderLeft: '4px solid #ef4444', paddingLeft: '12px', alignItems: 'center' }}>
                                    <div className={styles.scheduleInfo} style={{ flex: 1 }}>
                                        <span className={styles.labName} style={{ fontSize: '1rem', marginBottom: '4px', display: 'block' }}>{item.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.subject}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className={styles.batch} style={{ color: '#ef4444', fontWeight: 'bold' }}>Lowest IA: {item.score}/30</span>
                                        </div>
                                    </div>
                                    <button className={styles.iconBtn} onClick={() => showToast(`Alert sent for ${item.name}`)} title="Call Parent">
                                        <Phone size={18} />
                                    </button>
                                </div>
                            )) : <p style={{ padding: '1rem', color: '#6b7280' }}>No low performers found.</p>}
                        </div>
                    </div>

                    <div className={styles.labCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className={styles.cardTitle} style={{ margin: 0 }}>Lab Scheduler</h2>
                            <Calendar size={18} color="#6b7280" />
                        </div>

                        {/* ALERT: Upcoming Lab */}
                        <div style={{ background: '#eff6ff', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #bfdbfe', fontSize: '0.85rem', color: '#1e40af' }}>
                            <strong>🔔 Next Lab Today:</strong> Python Prog. Lab (2:00 PM)
                        </div>

                        <div className={styles.scheduleList}>
                            {labSchedule.map(slot => (
                                <div key={slot.id} className={styles.scheduleItem}>
                                    <div className={styles.scheduleTime}>
                                        <span className={styles.day}>{slot.day}</span>
                                        <span className={styles.time}>{slot.time}</span>
                                    </div>
                                    <div className={styles.scheduleInfo}>
                                        <span className={styles.labName}>{slot.lab}</span>
                                        <span className={styles.batch}>{slot.batch}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const renderMyStudents = () => {
        // Use API students
        // Filter by subjects? Or just show all? Usually faculty wants to see kids in their classes.
        // For now showing all students but we could filter by those in 'mySubjects' classes if we had enrollment data.
        // Assuming studentsList are all students in the dept.
        const filteredStudents = students
            .filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.regNo.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));

        return (
            <div className={styles.sectionContainer}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>My Students Directory</h2>
                    <div className={styles.headerActions}>
                        <div className={styles.searchWrapper}>
                            <Search size={16} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search student..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className={styles.filterBtn}><Filter size={16} /> Filter</button>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.studentTableContainer}>
                        <table className={styles.studentTable}>
                            <thead>
                                <tr>
                                    <th>Sl No</th>
                                    <th>Reg No</th>
                                    <th>Student Name</th>
                                    <th>Semester</th>
                                    <th>Section</th>
                                    <th>Status</th>
                                    <th>Grade</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((std, index) => {
                                    // Generate mock performance data if missing
                                    const attendance = std.attendance || Math.floor(Math.random() * 20) + 80;
                                    const isRisk = attendance < 75;

                                    // Grade Logic
                                    let avgMarks = 0;
                                    if (std.marks) {
                                        const total = (std.marks.ia1 || 0) + (std.marks.ia2 || 0) + (std.marks.ia3 || 0);
                                        avgMarks = (total / 60) * 100;
                                    } else {
                                        avgMarks = Math.floor(Math.random() * 40) + 50;
                                    }

                                    let grade = 'F';
                                    let gradeColor = '#ef4444';
                                    let gradeBg = '#fee2e2';

                                    if (avgMarks >= 90) { grade = 'S'; gradeColor = '#15803d'; gradeBg = '#dcfce7'; }
                                    else if (avgMarks >= 80) { grade = 'A'; gradeColor = '#166534'; gradeBg = '#f0fdf4'; }
                                    else if (avgMarks >= 70) { grade = 'B'; gradeColor = '#0369a1'; gradeBg = '#e0f2fe'; }
                                    else if (avgMarks >= 60) { grade = 'C'; gradeColor = '#b45309'; gradeBg = '#fef3c7'; }
                                    else if (avgMarks >= 50) { grade = 'D'; gradeColor = '#b91c1c'; gradeBg = '#fee2e2'; }

                                    return (
                                        <tr key={std.id} style={{ cursor: 'pointer' }} onClick={() => openProfile(std)}>
                                            <td style={{ color: '#6b7280', fontWeight: '500', paddingLeft: '1.5rem' }}>{String(index + 1).padStart(2, '0')}</td>
                                            <td className={styles.codeText}>{std.regNo}</td>
                                            <td>
                                                <div className={styles.studentNameCell}>
                                                    <div className={styles.avatar} style={{
                                                        background: `linear-gradient(135deg, ${['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} 0%, ${['#1d4ed8', '#047857', '#b45309', '#6d28d9', '#be185d'][index % 5]} 100%)`
                                                    }}>
                                                        {std.name.charAt(0)}
                                                    </div>
                                                    {std.name}
                                                </div>
                                            </td>
                                            {/* Fix: Display 2nd Semester correctly */}
                                            <td>{std.sem === '2nd' ? '2nd Semester' : (std.semester || '2nd Semester')}</td>
                                            <td>
                                                <span className={styles.badge} style={{ background: '#f3f4f6', color: '#374151' }}>
                                                    {std.section || 'A'}
                                                </span>
                                            </td>
                                            <td>
                                                {isRisk ? (
                                                    <span className={`${styles.statusBadge} ${styles.statusRisk}`}>
                                                        <AlertTriangle size={12} /> At Risk
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.statusBadge} ${styles.statusGood}`}>
                                                        <CheckCircle size={12} /> Good Standing
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: gradeBg,
                                                    color: gradeColor,
                                                    fontWeight: '700',
                                                    fontSize: '0.9rem',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}>
                                                    {grade}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionIcons}>
                                                    <button title="View Profile" className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); openProfile(std); }}>
                                                        <Users size={16} />
                                                    </button>
                                                    <button title="Email" className={styles.iconBtn} onClick={(e) => e.stopPropagation()}>
                                                        <Mail size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderCIEEntry = () => {
        if (!selectedSubject) {
            return (
                <div className={styles.emptyState}>


                    <div className={styles.cardsGrid}>
                        {mySubjects.map(sub => (
                            <div key={sub.id} className={styles.subjectCard} onClick={() => handleSubjectClick(sub)}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.subjectName}>{sub.name}</h3>
                                    <span className={styles.termBadge} style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>{sub.semester} Sem</span>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Code: {sub.code}</span>
                                        <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
                                            <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            64 Students
                                        </span>
                                    </div>

                                    {/* Mock Progress */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#4b5563', marginBottom: '4px' }}>
                                        <span style={{ flex: 1 }}>Completion</span>
                                        <span style={{ fontWeight: '600' }}>75%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: '75%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                                    </div>
                                </div>

                                <div className={styles.subjectFooter} style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Last updated: 2 days ago</span>
                                    <button style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '6px',
                                        background: '#eff6ff',
                                        color: '#2563eb',
                                        border: 'none',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>
                                        Enter Marks →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.sectionContainer}>

                <div
                    className={styles.backLink}
                    onClick={() => setSelectedSubject(null)}
                    style={{
                        marginBottom: '1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#bae6fd'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <span style={{ marginRight: '0.5rem' }}>←</span> Back to Overview
                </div>

                {/* NEW ATTRACTIVE HEADER */}
                <div className={styles.engagingHeader}>
                    <div className={styles.headerContent}>
                        <div className={styles.headerTopRow}>
                            <div>
                                <h1 className={styles.subjectTitle}>Update Marks: {selectedSubject.name}</h1>
                                <div className={styles.subjectMeta}>
                                    <span>{selectedSubject.code}</span>
                                    <span>|</span>
                                    <span>{selectedSubject.semester} Sem</span>
                                </div>
                            </div>
                            <div className={styles.maxMarksBadge}>
                                Max Marks: CIE-1({selectedSubject.cie1MaxMarks}), CIE-2({selectedSubject.cie2MaxMarks})
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.sectionHeader}>
                    <div className={styles.headerTitleGroup}></div>

                    <div className={styles.headerActions}>
                        <div className={styles.actionButtons}>
                            <button className={styles.secondaryBtn} onClick={togglePreview} title="Preview Report">
                                <FileText size={16} /> Preview
                            </button>

                            {!isLocked ? (
                                <button className={`${styles.saveBtn} ${saving ? styles.saving : ''}`} onClick={handleSave} disabled={saving}>
                                    <Save size={16} />
                                    {saving ? 'Committing...' : 'Save Changes'}
                                </button>
                            ) : (
                                <button className={styles.secondaryBtn} onClick={handleEdit} style={{ borderColor: '#2563eb', color: '#2563eb' }}>
                                    <Edit3 size={16} /> Enable Edit
                                </button>
                            )}

                            <button className={`${styles.saveBtn}`} onClick={downloadCSV} style={{ backgroundColor: '#4b5563' }}>
                                <Download size={16} /> Download
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Sl No</th>
                                    <th>Reg No</th>
                                    <th>Student Name</th>
                                    {selectedSubject?.cie1MaxMarks > 0 && <th>CIE-1 ({selectedSubject.cie1MaxMarks})</th>}
                                    {selectedSubject?.cie2MaxMarks > 0 && <th>CIE-2 ({selectedSubject.cie2MaxMarks})</th>}
                                    <th>Total ({selectedSubject?.totalMaxMarks || 60})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => {
                                    const sMarks = marks[student.id] || {};
                                    // Mapping logic: local edits override API data
                                    const ia1Mark = sMarks['CIE1'] || {};

                                    // Check if we have a direct edit (top-level key) or fallback to API object
                                    const valCIE1 = sMarks.cie1 !== undefined ? sMarks.cie1 : (ia1Mark.cie1Score != null ? ia1Mark.cie1Score : '');
                                    const valCIE2 = sMarks.cie2 !== undefined ? sMarks.cie2 : (ia1Mark.cie2Score != null ? ia1Mark.cie2Score : '');

                                    return (
                                        <tr key={student.id}>
                                            <td>{index + 1}</td>
                                            <td>{student.regNo}</td>
                                            <td>{student.name}</td>
                                            {selectedSubject?.cie1MaxMarks > 0 && (
                                                <td>
                                                    <input
                                                        type="number"
                                                        className={styles.markInput}
                                                        value={valCIE1}
                                                        onChange={(e) => handleMarkChange(student.id, 'cie1', e.target.value)}
                                                        disabled={isLocked}
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
                                                        disabled={isLocked}
                                                    />
                                                </td>
                                            )}
                                            {/* Final Total */}
                                            <td style={{ fontWeight: 'bold' }}>{calculateAverage(student)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };



    const renderAttendance = () => {
        if (!selectedSubject) {
            return (
                <div className={styles.emptyState}>
                    <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <h2 className={styles.sectionTitle}>Mark Attendance</h2>
                        <p style={{ color: '#6b7280' }}>Select a subject to mark attendance.</p>
                    </div>
                    <div className={styles.cardsGrid}>
                        {mySubjects.map(sub => (
                            <div key={sub.id} className={styles.subjectCard} onClick={() => { setSelectedSubject(sub); setSavedAttendance(false); }}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.subjectName}>{sub.name}</h3>
                                    <span className={styles.termBadge} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem' }}>{sub.semester} Sem</span>
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                                    <UserCheck size={16} />
                                    <span>Mark Today's Attendance</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Key for storage
        const key = `${selectedSubject.id}-${attendanceDate}`;
        const currentData = attendanceData[key] || {};

        // Mock list of students
        const classStudents = studentsList;

        // Stats
        const total = classStudents.length;
        const presentCount = classStudents.filter(s => (currentData[s.id] || 'Present') === 'Present').length;
        const absentCount = total - presentCount;

        return (
            <div className={styles.sectionContainer}>
                <div className={styles.backLink} onClick={() => setSelectedSubject(null)} style={{ color: '#6b7280', marginBottom: '1rem', display: 'inline-flex', cursor: 'pointer', alignItems: 'center' }}>
                    <span style={{ marginRight: '0.5rem' }}>←</span> Back to Subject List
                </div>

                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Attendance: {selectedSubject.name}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                            <input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className={styles.searchInput}
                                style={{ width: 'auto' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                Total: <strong>{total}</strong> | Present: <strong style={{ color: '#16a34a' }}>{presentCount}</strong> | Absent: <strong style={{ color: '#dc2626' }}>{absentCount}</strong>
                            </span>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button className={styles.saveBtn} onClick={saveAttendance} disabled={savedAttendance}>
                            <Save size={16} />
                            {savedAttendance ? 'Saved' : 'Save Attendance'}
                        </button>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Sl No</th>
                                <th>Reg No</th>
                                <th>Student Name</th>
                                <th>Status</th>
                                <th style={{ width: '150px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classStudents.map((std, index) => {
                                const status = currentData[std.id] || 'Present';
                                return (
                                    <tr key={std.id} style={{ backgroundColor: status === 'Absent' ? '#fef2f2' : 'inherit' }}>
                                        <td style={{ color: '#6b7280' }}>{String(index + 1).padStart(2, '0')}</td>
                                        <td className={styles.codeText}>{std.regNo}</td>
                                        <td>
                                            <div className={styles.studentNameCell}>
                                                <div className={styles.avatar} style={{
                                                    width: '28px', height: '28px', fontSize: '0.8rem',
                                                    background: `linear-gradient(135deg, ${['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} 0%, ${['#1d4ed8', '#047857', '#b45309', '#6d28d9', '#be185d'][index % 5]} 100%)`
                                                }}>
                                                    {std.name.charAt(0)}
                                                </div>
                                                {std.name}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    style={{
                                                        padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                                        borderColor: status === 'Present' ? '#16a34a' : '#d1d5db',
                                                        backgroundColor: status === 'Present' ? '#dcfce7' : 'white',
                                                        color: status === 'Present' ? '#166534' : '#6b7280'
                                                    }}
                                                    onClick={() => handleAttendanceChange(std.id, 'Present')}
                                                >
                                                    Present
                                                </button>
                                                <button
                                                    style={{
                                                        padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                                        borderColor: status === 'Absent' ? '#dc2626' : '#d1d5db',
                                                        backgroundColor: status === 'Absent' ? '#fee2e2' : 'white',
                                                        color: status === 'Absent' ? '#991b1b' : '#6b7280'
                                                    }}
                                                    onClick={() => handleAttendanceChange(std.id, 'Absent')}
                                                >
                                                    Absent
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            {status === 'Absent' && (
                                                <button className={styles.iconBtn} style={{ color: '#dc2626' }} title="Notify Parent" onClick={() => showToast(`SMS sent to ${std.name}'s parent`)}>
                                                    <Mail size={16} /> Send SMS
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderProctoring = () => {
        // Calculate performance color
        const getPerformanceColor = (avg) => {
            if (avg < 60) return { bg: '#fee2e2', text: '#b91c1c', icon: <AlertTriangle size={14} /> }; // Red
            if (avg < 75) return { bg: '#fef3c7', text: '#b45309', icon: <AlertCircle size={14} /> }; // Yellow
            return { bg: '#dcfce7', text: '#15803d', icon: <CheckCircle size={14} /> }; // Green
        };

        return (
            <div className={styles.sectionContainer}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Mentorship / Proctoring</h2>
                    <div className={styles.headerActions}>
                        <button className={styles.filterBtn} onClick={() => showToast('Meeting Logs Downloaded')}>
                            <Download size={16} /> Export Logs
                        </button>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Student Details</th>
                                <th>Parent Contact</th>
                                <th>Attendance</th>
                                <th>Academic Standing (CIE Avg)</th>
                                <th>last Meeting</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myMentees.map(student => {
                                // Mock Average Calculation for display
                                const avgScore = student.marks ? Math.round(((student.marks.ia1 + student.marks.ia2) / 60) * 100) : Math.floor(Math.random() * 40) + 50;
                                const perf = getPerformanceColor(avgScore);

                                return (
                                    <tr key={student.id}>
                                        <td>
                                            <div className={styles.studentNameCell}>
                                                <div className={styles.avatar} style={{
                                                    width: '32px', height: '32px', fontSize: '0.85rem',
                                                    background: '#eff6ff', color: '#1d4ed8'
                                                }}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#111827' }}>{student.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{student.regNo}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{student.parentPhone}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Relationship: Father</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '60px', height: '6px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${student.attendance}%`, height: '100%', background: student.attendance < 75 ? '#dc2626' : '#10b981' }}></div>
                                                </div>
                                                <span style={{ fontWeight: '600', color: student.attendance < 75 ? '#dc2626' : '#374151' }}>
                                                    {student.attendance}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '20px',
                                                backgroundColor: perf.bg,
                                                color: perf.text,
                                                fontWeight: '600',
                                                fontSize: '0.85rem'
                                            }}>
                                                {perf.icon}
                                                {avgScore}% Avg
                                            </span>
                                        </td>
                                        <td style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                                            {student.lastMeeting}
                                        </td>
                                        <td>
                                            <div className={styles.actionIcons}>
                                                <button className={styles.iconBtn} onClick={() => showToast(`Calling Parent of ${student.name}...`)} title="Call Parent">
                                                    <Phone size={16} />
                                                </button>
                                                <button className={styles.iconBtn} onClick={() => showToast('Opened Meeting Log')} title="View Log">
                                                    <FileText size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderLessonPlan = () => {
        return (
            <div className={styles.sectionContainer}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Syllabus Tracker & Lesson Plan</h2>
                    <div className={styles.headerActions}>
                        <button className={styles.saveBtn} onClick={() => showToast('Report Sent to HOD')}>
                            <FileText size={16} /> Submit Monthly Report
                        </button>
                    </div>
                </div>

                <div className={styles.gridContainer}>
                    {mySubjects.map(sub => {
                        const progress = lessonPlanData[sub.id] || {};
                        const units = syllabusConfig[sub.id] || [
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
                            <div key={sub.id} className={styles.card} style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{sub.name}</h3>
                                        <span className={styles.termBadge} style={{ fontSize: '0.75rem' }}>{sub.semester} Sem</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: percent === 100 ? '#10b981' : '#3b82f6' }}>{percent}%</span>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Completed</p>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                                    {units.map(unit => (
                                        <div key={unit.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem', fontSize: '0.9rem' }}>
                                            <div
                                                onClick={() => toggleUnit(sub.id, unit.id)}
                                                style={{
                                                    width: '20px', height: '20px', borderRadius: '4px', border: '2px solid', marginRight: '10px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    borderColor: progress[unit.id] ? '#10b981' : '#d1d5db',
                                                    backgroundColor: progress[unit.id] ? '#10b981' : 'white'
                                                }}
                                            >
                                                {progress[unit.id] && <CheckCircle size={14} color="white" />}
                                            </div>
                                            <span style={{ color: progress[unit.id] ? '#111827' : '#6b7280', textDecoration: progress[unit.id] ? 'line-through' : 'none' }}>
                                                {unit.name}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Add Unit UI */}
                                    {addingToSubject === sub.id ? (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Enter topic name..."
                                                value={newUnitName}
                                                onChange={(e) => setNewUnitName(e.target.value)}
                                                style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => addUnit(sub.id)}
                                                style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer' }}
                                            >
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setAddingToSubject(null)}
                                                style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setAddingToSubject(sub.id)}
                                            style={{
                                                marginTop: '0.5rem',
                                                background: 'none',
                                                border: '1px dashed #9ca3af',
                                                color: '#6b7280',
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            + Add Syllabus Topic
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );

    };

    return (
        <DashboardLayout menuItems={menuItems} >
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1 className={styles.welcomeText}>Hello, {currentFaculty.name}</h1>
                        <p className={styles.subtitle}>{currentFaculty.designation} | {currentFaculty.department}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Status Indicator */}
                        <div style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            backgroundColor: facultyClassAnalytics.pending < 20 ? '#dcfce7' : '#fef3c7',
                            color: facultyClassAnalytics.pending < 20 ? '#166534' : '#92400e',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: facultyClassAnalytics.pending < 20 ? '#16a34a' : '#d97706' }}></div>
                            {facultyClassAnalytics.pending < 20 ? 'On Track' : 'Pending Evaluations'}
                        </div>
                    </div>
                </div>
            </header>

            {activeSection === 'Overview' && renderOverview()
            }
            {activeSection === 'My Students' && renderMyStudents()}
            {activeSection === 'CIE Entry' && renderCIEEntry()}
            {activeSection === 'Attendance' && renderAttendance()}
            {activeSection === 'Lesson Plan' && renderLessonPlan()}
            {activeSection === 'Proctoring' && renderProctoring()}

            {/* MODALS */}
            {renderStudentProfileModal()}
            {renderUploadModal()}

            {
                toast.show && (
                    <div className={`${styles.toast} ${toast.type === 'error' ? styles.error : ''}`}>
                        <CheckCircle size={18} />
                        {toast.message}
                    </div>
                )
            }
        </DashboardLayout >
    );
};

export default FacultyDashboard;
