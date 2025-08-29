import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { auth, db } from '../../../Lib/FirebaseConfig/firebase';
import { DB_COLLECTION, TICKET_PRIORITIES } from '../../../Lib/FirebaseConfig/constant'
import {
    addDoc,
    writeBatch,
    serverTimestamp,
    collection,
    doc,
    setDoc,
    where,
    query as fsQuery,
    getDocs,
    deleteDoc,
    getDoc
} from "firebase/firestore";

// --- Config ---
const STATUS_LIST = ['Present', 'Absent', 'Leave'];

export default function Attendance() {
    // employees + UI state (renamed from 'students')
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');               // was squery
    const [departmentFilter, setDepartmentFilter] = useState('All'); // was classFilter
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(6);
    const [showModal, setShowModal] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', email: '', department: '', status: 'Present' }); // roll -> email, class -> department
    const cUser = useSelector((state) => state.cUser);
    const { userId } = useSelector((state) => state.user);

    // date & attendance records
    const today = new Date().toISOString().slice(0, 10);
    const [selectedDate, setSelectedDate] = useState(today);
    const [records, setRecords] = useState({}); // { 'YYYY-MM-DD': [{ id, status, ... }, ...], ... }
    const [currentDayAttendance, setCurrentDayAttendance] = useState([]); // [{ id, status }]
    const [isDirty, setIsDirty] = useState(false);

    // --- FETCH EMPLOYEES FROM FIRESTORE ---
    // fetchEmployees runs when cUser or userId changes (or on mount)
    const fetchEmployees = async () => {
        try {
            if (!cUser) return;

            if ((cUser.Role === "MANAGER" || cUser.Role === "HR") && cUser.department) {
                // use fsQuery alias to avoid name collision with local state
                const q = fsQuery(
                    collection(db, DB_COLLECTION.USERS),
                    where("department", "==", cUser.department)
                );

                const querySnapshot = await getDocs(q);

                const employeeList = querySnapshot.docs.map((d) => ({
                    id: d.id,
                    name: (d.data().FullName || '') + " " + (d.data().Role || ''),
                    email: d.data().Email || '',
                    department: d.data().department || '',
                    role: d.data().Role
                }));

                setEmployees(employeeList);

            } else if (cUser.Role === "ADMIN") {
                const snapShot = await getDocs(collection(db, DB_COLLECTION.USERS))
                const employeeList = snapShot.docs.map((d) => ({
                    id: d.id,
                    name: (d.data().FullName || '') + " " + (d.data().Role || ''),
                    email: d.data().Email || '',
                    department: d.data().department || '',
                    role: d.data().Role
                }));
                setEmployees(employeeList);
            } else {
                // single user (non-admin/manager): fetch own user doc
                if (!userId) return;
                const userSnap = await getDoc(doc(db, DB_COLLECTION.USERS, String(userId)));
                if (userSnap && userSnap.exists()) {
                    const ud = userSnap.data();
                    const employee = {
                        id: userSnap.id,
                        name: (ud.FullName || '') + " " + (ud.Role || ''),
                        email: ud.Email || '',
                        department: ud.department || '',
                        role: d.data().Role
                    };
                    setEmployees([employee]);
                } else {
                    setEmployees([]);
                }
            }
        } catch (err) {
            console.error('fetchEmployees error', err);
        }
    };

    // fetch employees once on mount and when cUser / userId change (not on employees change)
    useEffect(() => {
        fetchEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cUser, userId]);

    // --- FETCH ATTENDANCE RECORDS FOR selectedDate ---
    // We keep records as an object mapping date -> array of records so the rest of your logic (records[dateKey]) works.
    const fetchRecords = async (dateKey = selectedDate) => {
        try {
            if (!userId || !dateKey) return;

            // meta doc (not strictly required here but kept for parity)
            const docRef = doc(db, DB_COLLECTION.ATTENDANCE, String(userId), 'Dates', String(dateKey));
            const metaSnap = await getDoc(docRef);

            // records subcollection
            const recsSnap = await getDocs(collection(db, DB_COLLECTION.ATTENDANCE, String(userId), 'Dates', String(dateKey), 'records'));

            const recordList = recsSnap.docs.map((d) => ({
                id: d.id,
                ...d.data()
            }));

            // store under the date key to match downstream usage
            setRecords(prev => ({ ...prev, [dateKey]: recordList }));
            // mark not dirty (we just loaded from server)
            setIsDirty(false);
        } catch (err) {
            console.error('fetchRecords error', err);
        }
    };

    // call fetchRecords when selectedDate or userId changes
    useEffect(() => {
        fetchRecords(selectedDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, userId]);

    // rebuild attendance for the selected date when employees/records/date change
    useEffect(() => {
        const dateKey = selectedDate;
        const dayRecords = records[dateKey] || null;
        if (dayRecords) {
            const map = new Map(dayRecords.map(r => [r.id, r.status]));
            const merged = employees.map(e => ({ id: e.id, status: map.get(e.id) || 'Absent' }));
            setCurrentDayAttendance(merged);
        } else {
            setCurrentDayAttendance(employees.map(e => ({ id: e.id, status: 'Absent' })));
        }
        setIsDirty(false);
    }, [selectedDate, employees, records]);

    // derived lists
    const departments = useMemo(() => ['All', ...Array.from(new Set(employees.map(s => s.department)))], [employees]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return employees.filter(e => {
            if (departmentFilter !== 'All' && e.department !== departmentFilter) return false;
            if (statusFilter !== 'All') {
                const rec = currentDayAttendance.find(r => r.id === e.id);
                if (!rec || rec.status !== statusFilter) return false;
            }
            if (!q) return true;
            return e.name.toLowerCase().includes(q) || String(e.email).toLowerCase().includes(q);
        });
    }, [employees, search, departmentFilter, statusFilter, currentDayAttendance]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

    // attendance helpers
    const getStatusFor = (id) => currentDayAttendance.find(r => r.id === id)?.status || 'Absent';
    const setStatusFor = (id, status) => { setCurrentDayAttendance(prev => prev.map(p => p.id === id ? { ...p, status } : p)); setIsDirty(true); };
    const toggleStatus = (id) => { const cur = getStatusFor(id); const idx = STATUS_LIST.indexOf(cur); const next = STATUS_LIST[(idx + 1) % STATUS_LIST.length]; setStatusFor(id, next); };

    // --- SAVE ATTENDANCE (safe batched writes) ---
    async function saveAttendance(dateKey, recordsArr) {
        if (!userId || !dateKey) {
            console.warn('saveAttendance missing userId or dateKey', { userId, dateKey });
            return;
        }
        try {
            const batch = writeBatch(db);
            const parentDocRef = doc(db, DB_COLLECTION.ATTENDANCE, String(userId), 'Dates', String(dateKey));

            const validRecords = Array.isArray(recordsArr) ? recordsArr.filter(r => r && (r.id)) : [];
            const presentCount = validRecords.filter(r => r.status === 'Present').length;
            const absentCount = validRecords.filter(r => r.status === 'Absent').length;
            const leaveCount = validRecords.filter(r => r.status === 'Leave').length;

            batch.set(parentDocRef, {
                date: String(dateKey),
                userId,
                presentCount,
                absentCount,
                leaveCount,
                updatedAt: serverTimestamp(),
                updatedBy: userId
            }, { merge: true });

            validRecords.forEach(r => {
                const studentIdStr = String(r.id);
                const recRef = doc(db, DB_COLLECTION.ATTENDANCE, String(userId), 'Dates', String(dateKey), 'records', studentIdStr);
                batch.set(recRef, {
                    id: studentIdStr,
                    status: r.status || 'Absent',
                    note: r.note || '',
                    updatedAt: serverTimestamp(),
                    updatedBy: userId
                }, { merge: true });
            });

            await batch.commit();
            // refresh the loaded records for that date
            await fetchRecords(dateKey);

            employees.map(async (i) => {

                if (i.role === "MANAGER" || i.role === "HR") {
                    const batch = writeBatch(db);
                    const parentDocRef = doc(db, DB_COLLECTION.ATTENDANCE, String(i.id), 'Dates', String(dateKey));

                    const validRecords = Array.isArray(recordsArr) ? recordsArr.filter(r => r && (r.id)) : [];
                    const presentCount = validRecords.filter(r => r.status === 'Present').length;
                    const absentCount = validRecords.filter(r => r.status === 'Absent').length;
                    const leaveCount = validRecords.filter(r => r.status === 'Leave').length;

                    batch.set(parentDocRef, {
                        date: String(dateKey),
                        userId: i.id,
                        presentCount,
                        absentCount,
                        leaveCount,
                        updatedAt: serverTimestamp(),
                        updatedBy: userId
                    }, { merge: true });

                    validRecords.forEach(r => {
                        const studentIdStr = String(r.id);
                        const recRef = doc(db, DB_COLLECTION.ATTENDANCE, String(i.id), 'Dates', String(dateKey), 'records', studentIdStr);
                        batch.set(recRef, {
                            id: studentIdStr,
                            status: r.status || 'Absent',
                            note: r.note || '',
                            updatedAt: serverTimestamp(),
                            updatedBy: userId
                        }, { merge: true });
                    });

                    await batch.commit();
                }

            })
            if (cUser.Role === "MANAGER" || cUser.Role === "HR") {
                const q = fsQuery(
                    collection(db, DB_COLLECTION.USERS),
                    where("Role", "==", "ADMIN")
                );

                const querySnapshot = await getDocs(q);

                const adminList = querySnapshot.docs.map((d) => ({
                    id: d.id,
                }));
                adminList.map(async (i) => {
                    const batch = writeBatch(db);
                    const parentDocRef = doc(db, DB_COLLECTION.ATTENDANCE, String(i.id), 'Dates', String(dateKey));

                    const validRecords = Array.isArray(recordsArr) ? recordsArr.filter(r => r && (r.id)) : [];
                    const presentCount = validRecords.filter(r => r.status === 'Present').length;
                    const absentCount = validRecords.filter(r => r.status === 'Absent').length;
                    const leaveCount = validRecords.filter(r => r.status === 'Leave').length;

                    batch.set(parentDocRef, {
                        date: String(dateKey),
                        userId: i.id,
                        presentCount,
                        absentCount,
                        leaveCount,
                        updatedAt: serverTimestamp(),
                        updatedBy: userId
                    }, { merge: true });

                    validRecords.forEach(r => {
                        const studentIdStr = String(r.id);
                        const recRef = doc(db, DB_COLLECTION.ATTENDANCE, String(i.id), 'Dates', String(dateKey), 'records', studentIdStr);
                        batch.set(recRef, {
                            id: studentIdStr,
                            status: r.status || 'Absent',
                            note: r.note || '',
                            updatedAt: serverTimestamp(),
                            updatedBy: userId
                        }, { merge: true });
                    });

                    await batch.commit();
                })
            }

        } catch (err) {
            console.error('saveAttendance error', err);
        }
    }

    const saveAttendanceForDate = async (dateKey) => {
        await saveAttendance(dateKey, currentDayAttendance);
        setRecords(prev => ({ ...prev, [dateKey]: currentDayAttendance }));
        setIsDirty(false);
    };

    const deleteAttendanceForDate = (dateKey) => {
        const { [dateKey]: _, ...rest } = records;
        setRecords(rest);
        if (dateKey === selectedDate) setCurrentDayAttendance(employees.map(e => ({ id: e.id, status: 'Absent' })));
        setIsDirty(false);
    };

    // employee CRUD (local only UI add/delete - you can change to persist to Firestore if desired)
    //   const addEmployee = () => {
    //     if (!newEmployee.name || !newEmployee.email) return;
    //     const newId = employees.length ? Math.max(...employees.map(s => Number(s.id))) + 1 : Date.now();
    //     const e = { ...newEmployee, id: String(newId) };
    //     setEmployees(prev => [e, ...prev]);
    //     setNewEmployee({ name: '', email: '', department: '', status: 'Present' });

    //     // add default to existing records
    //     setRecords(prev => {
    //       const copy = { ...prev };
    //       for (const d in copy) { copy[d] = [{ id: e.id, status: 'Absent' }, ...copy[d]]; }
    //       return copy;
    //     });
    //   };

    //   const deleteEmployee = (id) => {
    //     setEmployees(prev => prev.filter(s => s.id !== id));
    //     setRecords(prev => {
    //       const copy = {};
    //       for (const d in prev) { copy[d] = prev[d].filter(r => r.id !== id); }
    //       return copy;
    //     });
    //   };

    const exportCSVForDate = (dateKey) => {
        const header = ['ID', 'Name', 'Email', 'Department', 'Status'];
        const rows = employees.map(e => {
            const st = (records[dateKey] || currentDayAttendance).find(r => r.id === e.id)?.status || 'Absent';
            return [e.id, e.name, e.email, e.department, st];
        });
        const csv = [header, ...rows]
            .map(r => r.map(String).map(c => '"' + String(c).replace(/"/g, '""') + '"').join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${dateKey}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // summary
    const summary = useMemo(() => {
        const total = employees.length;
        const present = currentDayAttendance.filter(s => s.status === 'Present').length;
        const absent = currentDayAttendance.filter(s => s.status === 'Absent').length;
        const leave = currentDayAttendance.filter(s => s.status === 'Leave').length;
        return { total, present, absent, leave };
    }, [employees, currentDayAttendance]);

    const StatusPill = ({ status }) => (
        <span style={{ padding: "0.5rem" }} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow-sm
      ${status === 'Present' ? 'bg-green-100 text-green-800' : status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {status}
        </span>
    );

    // --- Render (kept your CSS/classNames exactly as provided) ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6" style={{ display: "flex", justifyContent: "center", alignContent: "center", alignItems: "center", marginTop: "2rem" }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6" style={{ marginBottom: "1rem" }}>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold font-extrabold text-indigo-600">Attendance Management</h1>
                        <p className="text-sm text-gray-500 mt-1">View and manage attendance by date. Data is saved in Firestore.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white shadow" style={{ padding: "1rem" }}>+ Add Employee</button> */}
                        <button onClick={() => exportCSVForDate(selectedDate)} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border text-gray-700 shadow hover:cursor-pointer" style={{ padding: "1rem" }}>Export CSV</button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6" style={{ margin: "1rem" }}>
                    <motion.div style={{ padding: "1rem" }} whileHover={{ y: -4 }} className="p-4 rounded-2xl bg-white shadow-sm">
                        <p className="text-xs text-gray-500">Total Employees</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                    </motion.div>
                    <motion.div style={{ padding: "1rem" }} whileHover={{ y: -4 }} className="p-4 rounded-2xl bg-white shadow-sm">
                        <p className="text-xs text-gray-500">Present</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.present}</p>
                    </motion.div>
                    <motion.div style={{ padding: "1rem" }} whileHover={{ y: -4 }} className="p-4 rounded-2xl bg-white shadow-sm">
                        <p className="text-xs text-gray-500">Absent</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.absent}</p>
                    </motion.div>
                    <motion.div style={{ padding: "1rem" }} whileHover={{ y: -4 }} className="p-4 rounded-2xl bg-white shadow-sm">
                        <p className="text-xs text-gray-500">On Leave</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.leave}</p>
                    </motion.div>
                </div>

                {/* Date picker + quick actions */}
                <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3" style={{ marginBottom: "1rem", padding: "1rem" }}>
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600">Select date</label>
                        <input type="date" style={{ padding: "1rem" }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 rounded-xl border" />
                        <button style={{ padding: "1rem" }} onClick={() => saveAttendanceForDate(selectedDate)} disabled={!isDirty} className="px-4 py-2 rounded-xl bg-green-600 text-white disabled:opacity-60 hover:cursor-pointer">Save</button>
                        <button style={{ padding: "1rem" }} onClick={() => deleteAttendanceForDate(selectedDate)} className="px-4 py-2 rounded-xl bg-red-50 hover:cursor-pointer">Delete</button>
                        <button style={{ padding: "1rem" }} onClick={() => setSelectedDate(today)} className="px-4 py-2 rounded-xl bg-gray-100 hover:cursor-pointer">Today</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">Showing attendance for <span className="font-medium text-gray-800">{selectedDate}</span></div>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ padding: "1rem", margin: "1rem" }} className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                        <div className="flex-1 flex gap-3">
                            <input style={{ padding: "1rem" }} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email..." className="flex-1 px-4 py-2 rounded-xl border focus:ring-1 outline-none" />

                            <select style={{ padding: "1rem" }} value={departmentFilter} onChange={e => { setDepartmentFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border">
                                {departments.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select style={{ padding: "1rem" }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border">
                                <option value="All">All Status</option>
                                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            <button style={{ padding: "1rem" }} onClick={() => { setCurrentDayAttendance(prev => prev.map(p => ({ ...p, status: 'Present' }))); setIsDirty(true); }} className="px-4 py-2 rounded-xl bg-green-50 text-green-700 hover:cursor-pointer">Mark All Present</button>
                        </div>

                        <div className="flex items-center gap-2" style={{ padding: "1rem" }}>
                            <p className="text-sm text-gray-500">Showing <span className="font-medium text-gray-800">{filtered.length}</span> results</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div style={{ padding: "2rem", marginBottom: "2rem", width: "70rem" }} className="bg-white rounded-2xl p-4 shadow-sm overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead >
                            <tr className="text-left text-sm text-gray-500 border-b">
                                <th className="py-3 px-2">#</th>
                                <th className="py-3 px-2">Name</th>
                                <th className="py-3 px-2" style={{ padding: "1rem" }}>Email</th>
                                <th className="py-3 px-2">Department</th>
                                <th className="py-3 px-2">Status</th>
                                <th className="py-3 px-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.length === 0 && (
                                <tr><td colSpan={6} className="py-6 text-center text-gray-500">No employees found</td></tr>
                            )}

                            {pageItems.map((s, idx) => (
                                <tr key={s.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                    <td className="py-3 px-2 w-12">{(page - 1) * pageSize + idx + 1}</td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <div className="font-medium text-gray-900">{s.name}</div>
                                                <div className="text-xs text-gray-500">{s.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2" style={{ padding: "1rem" }}>{s.email}</td>
                                    <td className="py-3 px-2">{s.department}</td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <StatusPill status={getStatusFor(s.id)} />
                                            <button onClick={() => { toggleStatus(s.id); }} className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:cursor-pointer" style={{ padding: "0.5rem" }}>Toggle</button>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setStatusFor(s.id, 'Present'); }} className="px-3 py-1 rounded-md bg-green-50 hover:cursor-pointer" style={{ padding: "0.5rem" }}>P</button>
                                            <button onClick={() => { setStatusFor(s.id, 'Absent'); }} className="px-3 py-1 rounded-md bg-red-50 hover:cursor-pointer" style={{ padding: "0.5rem" }}>A</button>
                                            <button onClick={() => { setStatusFor(s.id, 'Leave'); }} className="px-3 py-1 rounded-md bg-yellow-50 hover:cursor-pointer" style={{ padding: "0.5rem" }}>L</button>
                                            {/* <button onClick={() => deleteEmployee(s.id)} className="px-2 py-1 rounded-md bg-red-100 border text-sm hover:cursor-pointer" style={{ padding: "0.5rem" }}>Delete</button> */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="mt-4 flex items-center justify-between" style={{ marginTop: "1rem" }}>
                        <div className="text-sm text-gray-500">Page {page} of {pageCount}</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-md bg-white border hover:cursor-pointer" style={{ padding: "0.5rem" }}>Prev</button>
                            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} className="px-3 py-1 rounded-md bg-white border hover:cursor-pointer" style={{ padding: "0.5rem" }}>Next</button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Add Employee Modal (simple) */}
            {/* {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg transform transition-all duration-150">
            <h3 className="text-lg font-semibold mb-4">Add New Employee</h3>
            <div className="space-y-3">
              <input value={newEmployee.name} onChange={e => setNewEmployee(n => ({ ...n, name: e.target.value }))} placeholder="Full name" className="w-full px-4 py-2 rounded-xl border" />
              <input value={newEmployee.email} onChange={e => setNewEmployee(n => ({ ...n, email: e.target.value }))} placeholder="Email" className="w-full px-4 py-2 rounded-xl border" />
              <div className="flex gap-2">
                <select value={newEmployee.department} onChange={e => setNewEmployee(n => ({ ...n, department: e.target.value }))} className="flex-1 px-3 py-2 rounded-xl border">
                  <option>HR</option>
                  <option>Sales</option>
                  <option>IT</option>
                </select>
                <select value={newEmployee.status} onChange={e => setNewEmployee(n => ({ ...n, status: e.target.value }))} className="px-3 py-2 rounded-xl border">
                  {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-white border">Cancel</button>
              <button onClick={() => { addEmployee(); setShowModal(false); }} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Add</button>
            </div>
          </div>
        </div>
      )} */}

        </div>
    );
}
