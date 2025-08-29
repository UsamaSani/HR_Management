import { useEffect, useMemo, useState, useRef } from "react";
import { auth, db } from '../../../Lib/FirebaseConfig/firebase';
import { DB_COLLECTION, TICKET_PRIORITIES } from '../../../Lib/FirebaseConfig/constant'
import { addDoc, collection, doc, setDoc, where, query, getDocs, deleteDoc, getDoc } from "firebase/firestore";
import { useSelector } from "react-redux";


const STORAGE_KEY = "task_calendar_tasks_v2"; // bumped version to avoid conflicts

const SAMPLE_USERS = [
  { id: "u1", name: "Ali Khan" },
  { id: "u2", name: "Sara Ahmed" },
  { id: "u3", name: "Omair" },
  { id: "u4", name: "Maya" },
];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function formatDateKey(date) {
  // YYYY-MM-DD
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed reading tasks from storage", e);
    return [];
  }
}
async function saveTasks(tasks) {
  try {
    //  await addDoc(collection(db, DB_COLLECTION.TICKETS), tasks);
    // console.log(tasks)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed saving tasks to storage", e);
  }
}

export default function TaskCalendar() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(startOfMonth(today));
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(formatDateKey(today));
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [queryy, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const titleRef = useRef(null);
  const [users, setUsers] = useState([]);
  const { userId } = useSelector((state) => state.user)
  const cUser = useSelector((state) => state.cUser)
  const [employee, setEmployee] = useState()
  const [userSearch, setUserSearch] = useState("");
    const [usersLoading, setUsersLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(true);
    const loading = usersLoading || tasksLoading;
    const [actionLoading, setActionLoading] = useState(false);
    const employees = useSelector((state)=> state.emp)

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    // when opening modal focus title
    if (isModalOpen) {
      setTimeout(() => titleRef.current && titleRef.current.focus(), 50);
    }
  }, [isModalOpen]);

  const monthMeta = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const startWeekDay = start.getDay(); // 0..6 (Sun..Sat)
    const totalDays = end.getDate();
    return { startWeekDay, totalDays };
  }, [viewDate]);

  const tasksByDate = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return map;
  }, [tasks]);

  function openAddModal(dateKey) {
    setEditingTask(null);
    setSelectedDate(dateKey);
    setModalOpen(true);
  }
  function openEditModal(task) {
    setEditingTask(task);
    setSelectedDate(task.date);
    setModalOpen(true);
  }

  const fetchTask = async () => {

  setTasksLoading(true);
    if ((cUser.Role === "MANAGER" || cUser.Role === "HR") && cUser.department) {
      const q = query(
        collection(db, DB_COLLECTION.TICKETS),
        where("createdBy", "==", userId)
      );

      const snapShot = await getDocs(q);
      const taskList = snapShot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setTasks(taskList)
  setTasksLoading(false);

      // console.log(users)
    } else if (cUser.Role === "EMPLOYEE") {
      const snapShot = await getDocs(collection(db, DB_COLLECTION.TICKETS))
      const taskList = snapShot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))

      const employeeTasks = taskList.filter(
        (task) =>
          Array.isArray(task.assignedUsers) &&
          task.assignedUsers.includes(userId)
      );

      // console.log("Tasks visible to this employee:", employeeTasks);

      // console.log(taskList)
      setTasks(employeeTasks)
  setTasksLoading(false);
    } else {
      const snapShot = await getDocs(collection(db, DB_COLLECTION.TICKETS))
      const taskList = snapShot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))

      // console.log(taskList)
      setTasks(taskList)
  setTasksLoading(false);
    }
  }

  const fetchEmployees = async () => {
  setUsersLoading(true);
    if ((cUser.Role === "MANAGER" || cUser.Role === "HR") && cUser.department) {
      const q = query(
        collection(db, DB_COLLECTION.USERS),
        where("department", "==", cUser.department)
      );

      const querySnapshot = await getDocs(q);

      const employeeList = querySnapshot.docs.map((doc) => ({
        key: doc.id,
        id: doc.id,
        name: doc.data().FullName +" "+ doc.data().Role
      }));
      setUsers(employeeList)
  setUsersLoading(false);

      // console.log(users)
    } else if (cUser.Role === "ADMIN") {
      const snapShot = await getDocs(collection(db, DB_COLLECTION.USERS))
      const employeeList = snapShot.docs.map((doc) => ({
        key: doc.id,
        id: doc.id,
        name: doc.data().FullName +" "+ doc.data().Role
      }));

      setUsers(employeeList)
  setUsersLoading(false);
    } else {
      const snapShot = await getDoc(doc(db, DB_COLLECTION.USERS, userId));
      const employee = {
        id: snapShot.id,
        name: snapShot.data().FullName,
      };
      setUsers([employee])
  setUsersLoading(false);
    }
  }
  useEffect(() => {
  fetchEmployees()
  fetchTask()
}, [])
useEffect(()=>{
  fetchEmployees()
  },[employees])
  const handleWorking = async (taskData) => {
    setActionLoading(true);
    try {
      await setDoc(doc(db, DB_COLLECTION.TICKETS, taskData.id), { ...taskData, createdBy: taskData.createdBy, isCompleted: "working" }, { merge: true });
      setTasks((prev) => prev.map((t) => (t.id === taskData.id ? { ...t, isCompleted: "working" } : t)));
    } finally {
      setActionLoading(false);
    }
  }
  const handleComplete = async (taskData) => {
    setActionLoading(true);
    try {
      await setDoc(doc(db, DB_COLLECTION.TICKETS, taskData.id), { ...taskData, createdBy: taskData.createdBy, isCompleted: "complete" }, { merge: true });
      setTasks((prev) => prev.map((t) => (t.id === taskData.id ? { ...t, isCompleted: "complete" } : t)));
    } finally {
      setActionLoading(false);
    }
  }
  async function handleSaveTask(taskData) {
    // console.log({ ...taskData, createdBy: userId })
    // Ensure priority is always lowercase for consistency
    const normalizedTaskData = { ...taskData, priority: (taskData.priority || '').toLowerCase() };
    setActionLoading(true);
    try {
      if (editingTask) {
        // update and reset isCompleted
        await setDoc(doc(db, DB_COLLECTION.TICKETS, editingTask.id), { ...normalizedTaskData, createdBy: editingTask.createdBy, isCompleted: "" }, { merge: true });
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...normalizedTaskData, isCompleted: "" } : t)));
        setEditingTask(null);
      } else {
        await addDoc(collection(db, DB_COLLECTION.TICKETS), { ...normalizedTaskData, createdBy: userId });
        const newTask = { id: userId, ...normalizedTaskData };
        setTasks((prev) => [newTask, ...prev]);
      }
      setModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteTask(id) {
    // console.log('delete clicked, id=', id);
    setActionLoading(true);
    try {
      if (!confirm("Delete this task?")) return;
      await deleteDoc(doc(db, DB_COLLECTION.TICKETS, id))
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setActionLoading(false);
    }
  }

  function gotoToday() {
    const d = new Date();
    setViewDate(startOfMonth(d));
    setSelectedDate(formatDateKey(d));
  }

  function changeMonth(n) {
    setViewDate((v) => addMonths(v, n));
  }

  function filteredTasksForDate(dateKey) {
    let list = tasksByDate[dateKey] || [];
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }
    if (queryy.trim()) {
      const q = queryy.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q));
    }
    // sort by time if provided
    list.sort((a, b) => (a.time || "") > (b.time || "") ? 1 : -1);
    return list;
  }

  const monthGrid = [];
  const { startWeekDay, totalDays } = monthMeta;
  // previous month's tail filler
  const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0);
  const prevMonthDays = prevMonth.getDate();
  for (let week = 0; week < 6; week++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      const cellIndex = week * 7 + d;
      const dayNumber = cellIndex - startWeekDay + 1;
      let cell = null;
      if (cellIndex < startWeekDay) {
        // filler from prev month
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, prevMonthDays - (startWeekDay - cellIndex - 1));
        cell = { date, inMonth: false };
      } else if (dayNumber > totalDays) {
        // next month filler
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, dayNumber - totalDays);
        cell = { date, inMonth: false };
      } else {
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNumber);
        cell = { date, inMonth: true };
      }
      row.push(cell);
    }
    monthGrid.push(row);
  }

  return (
    <div className="p-2 sm:p-4 w-full h-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 flex flex-col items-center justify-center relative" style={{ paddingBottom: "1rem" }}>
      {(loading || actionLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        </div>
      )}
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6" style={{ padding: "1rem" }}>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Task Calendar</h1>
            {/* <p className="text-base text-blue-600 dark:text-blue-300 font-medium mt-1">Add, edit and manage tasks by date</p> */}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => changeMonth(-1)} aria-label="Previous month" className="inline-flex items-center justify-center w-10 h-10 rounded-full border hover:cursor-pointer text-indigo-700 hover:bg-indigo-100 shadow-lg transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>

            <div className="text-center px-6">
              <div className="text-3xl font-extrabold text-indigo-800 dark:text-white tracking-wide drop-shadow mb-1">{viewDate.toLocaleString(undefined, { month: "long" })} {viewDate.getFullYear()}</div>
              <div className="text-base text-gray-600 dark:text-gray-300 italic">{new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toDateString()}</div>
            </div>

            <button onClick={() => changeMonth(1)} aria-label="Next month" className="inline-flex items-center justify-center w-10 h-10 rounded-full border hover:cursor-pointer text-indigo-700 hover:bg-indigo-100 shadow-lg transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>

            <button onClick={gotoToday} className="ml-3 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold shadow hover:from-indigo-700 hover:to-blue-600 transition-all duration-200 hover:cursor-pointer" style={{ padding: "1rem" }}>Today</button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-4 md:grid-cols-2 gap-8 w-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", flexDirection: "column" }}>
          {/* Calendar */}
          <div className="col-span-1 xl:col-span-3 lg:col-span-3 md:col-span-2" style={{ marginTop: "1rem" }} >
            <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-8 border border-blue-100">
              <div className="overflow-x-auto">
                <div className="min-w-[340px] sm:min-w-[640px]" style={{ padding: "1rem", width: "80rem", }}>
                  <div className="grid grid-cols-7 gap-2 sm:gap-4 text-base font-semibold text-center text-indigo-700 mb-4 sm:mb-6">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="py-2 uppercase tracking-wide">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-rows-6 grid-cols-7 gap-2 sm:gap-4">
                    {monthGrid.map((week, wi) => (
                      week.map((cell, ci) => {
                        const dateKey = formatDateKey(cell.date);
                        const isToday = formatDateKey(new Date()) === dateKey;
                        const selected = selectedDate === dateKey;
                        const cellTasks = tasksByDate[dateKey] || [];
                        return (
                          <button
                            key={`${wi}-${ci}`}
                            onClick={() => setSelectedDate(dateKey)}
                            onDoubleClick={cUser?.Role !== "EMPLOYEE" ? () => openAddModal(dateKey) : undefined}
                            style={{ padding: "0.75rem" }}
                            className={`relative w-full text-left rounded-2xl hover:cursor-pointer transition-all border ${cell.inMonth ? 'bg-gradient-to-br from-white via-blue-50 to-indigo-50' : 'bg-gray-50 text-gray-400'} ${selected ? 'ring-4 ring-indigo-400 bg-indigo-50 shadow-xl' : ''} ${isToday ? 'ring-2 ring-green-300 shadow' : ''} hover:shadow-2xl min-h-[70px] sm:min-h-[100px] group`} aria-pressed={selected}
                          >
                            <div className="flex items-start justify-between">
                              <div className="text-xl font-extrabold text-indigo-900 group-hover:text-indigo-700 transition drop-shadow-sm">{cell.date.getDate()}</div>
                              {cell.inMonth && (
                                <div className="text-xs text-blue-700 font-bold drop-shadow-sm">{cell.date.toLocaleString(undefined, { month: 'short' })}</div>
                              )}
                            </div>

                            <div className="mt-3 space-y-2">
                              {cellTasks.slice(0, 2).map((t) => (
                                <div key={t.id} className="text-xs truncate rounded-lg px-3 py-2 border border-blue-200 bg-blue-100 shadow-sm" title={t.title}>
                                  <div className="flex items-center justify-between gap-2" style={{ padding: "0.5rem" }}>
                                    <div className="truncate font-bold text-indigo-900">{t.title}</div>
                                    <div className="text-[12px] text-blue-700 font-bold">{t.time || ''}</div>
                                  </div>
                                </div>
                              ))}
                              {cellTasks.length > 2 && (
                                <div className="text-[12px] text-blue-700 font-bold">+{cellTasks.length - 2} more</div>
                              )}
                            </div>

                            {/* <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <span onClick={(e)=>{e.stopPropagation(); openAddModal(dateKey);}} className="cursor-pointer text-[13px] px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-200 to-blue-200 text-indigo-900 font-bold shadow hover:bg-indigo-300 transition">Add</span>
              </div> */}
                          </button>
                        );
                      })
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <aside className="col-span-1 xl:col-span-1 lg:col-span-1 md:col-span-2 w-full">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 border border-blue-100 flex flex-col gap-8 max-h-[90vh] w-full min-w-[260px]" style={{ padding: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  // flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                {/* <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:gap-4 items-stretch sm:items-center" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}> */}
                {/* <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-[1rem]" style={{marginBottom:"1rem"}}> */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <h3 className="font-extrabold text-2xl sm:text-2xl text-indigo-900 leading-tight">Tasks on {new Date(selectedDate).toDateString()}</h3>
                  {cUser?.Role !== "EMPLOYEE" ? (
                    <button onClick={() => openAddModal(selectedDate)} className="text-lg bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-6 py-3 rounded-2xl font-bold shadow hover:from-indigo-700 hover:to-blue-600 transition hover:cursor-pointer" style={{ padding: "0.5rem", marginLeft: "1rem" }}>New</button>
                  ) : null}
                </div>
                {/* </div> */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <input value={queryy} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="flex-1 min-w-0 px-5 py-4 border rounded-2xl text-lg text-gray-800 shadow" style={{ padding: "0.5rem" }} />
                  <select style={{ padding: "0.5rem", marginLeft: "1rem" }} className="flex-1 min-w-0 px-5 py-4 border rounded-2xl text-lg text-gray-800 shadow" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                {/* </div> */}
              </div>

              <div className="flex-1 overflow-auto mt-6">
                {filteredTasksForDate(selectedDate).length === 0 ? (
                  <div className="text-xl text-blue-700 font-bold leading-relaxed">
                    No tasks for this day.{" "}
                    {cUser?.Role !== "EMPLOYEE" ? "Double-click a date or press New to add." : ""}
                  </div>
                ) : (
                  <ul className="space-y-8">
                    {filteredTasksForDate(selectedDate).map((t) => (
                      <li key={t.id} style={{ padding: "1rem", marginBottom: "1rem" }} className="border rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-100 via-white to-indigo-100 shadow-xl">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
                              <div className="font-extrabold text-indigo-900 truncate text-xl sm:text-2xl leading-tight">{t.title}</div>
                             { console.log(t.priority,"===============================")}
                              <div style={{ padding: "0.5rem" }} className={`text-sm px-3 py-1 rounded-lg font-semibold shadow ${t.priority === 'high' ? 'bg-red-100 text-red-700' : t.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.priority}</div>
                              <div style={{ padding: "0.5rem" }} className={`text-sm px-3 py-1 rounded-lg font-semibold shadow ${t.isCompleted === 'complete' ? 'bg-green-100 text-green-700' : t.isCompleted === 'working' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>Status : {t.isCompleted || "pending"}</div>
                            </div>

                            <div className="text-base text-gray-600 mb-2">{t.time || 'All day'}</div>

                            {t.description && <div className="mt-2 text-lg text-gray-800 break-words leading-relaxed">{t.description}</div>}

                            {t.assignedUsers && t.assignedUsers.length > 0 && (
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                {t.assignedUsers.map((uid) => {
                                  const u = users.find((x) => x.id === uid);
                                  return (
                                    <div key={uid} style={{ padding: "0.5rem" }} className="text-[14px] px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full truncate max-w-[120px]">{u ? u.name : uid}</div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {cUser?.Role !== "EMPLOYEE" ? (
                            <div className="flex flex-row sm:flex-col items-end ml-2 gap-2 mt-4 sm:mt-0">
                              <button onClick={(e) => { e.stopPropagation(); openEditModal(t); }} type="button" className="text-sm px-3 py-2 rounded-lg  border bg-indigo-600 hover:cursor-pointer shadow" style={{ padding: "0.5rem" }}>Edit </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(t.id); }} type="button" className="text-sm px-3 py-2 rounded-lg bg-red-50 hover:cursor-pointer text-red-600 shadow" style={{ padding: "0.5rem" }}>Delete</button>
                            </div>
                          ) : (
                            <div className="flex flex-row sm:flex-col items-end ml-2 gap-2 mt-4 sm:mt-0">
                              <button type="button" className="text-sm px-3 py-2 rounded-lg bg-green-100 text-green-700 font-bold shadow hover:bg-green-200 hover:cursor-pointer" style={{ padding: "0.5rem" }} onClick={(e) => { e.stopPropagation(); handleComplete(t); }}>Complete</button>
                              <button type="button" className="text-sm px-3 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-bold shadow hover:bg-yellow-200 hover:cursor-pointer" style={{ padding: "0.5rem" }} onClick={(e) => { e.stopPropagation(); handleWorking(t); }}>Working</button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {cUser?.Role !== "EMPLOYEE" && (
                <div className="text-sm text-gray-500 mt-6">Tip: Double-click a calendar day to open the add task modal.</div>
              )}
            </div>
          </aside>
        </div>
      </div >

      {/* Modal */}
      {
        isModalOpen && (
          <TaskModal
            initialDate={selectedDate}
            initialTask={editingTask}
            onClose={() => { console.log(editingTask); setModalOpen(false); setEditingTask(null); }}
            onSave={handleSaveTask}
            titleRef={titleRef}
            users={users}
            cUser={cUser}
          />
        )
      }
    </div >
  );
}

function TaskModal({ initialDate, initialTask, onClose, onSave, titleRef, users }) {
  const [title, setTitle] = useState(initialTask ? initialTask.title : "");
  const [description, setDescription] = useState(initialTask ? initialTask.description : "");
  const [date, setDate] = useState(initialTask ? initialTask.date : initialDate);
  const [time, setTime] = useState(initialTask ? initialTask.time : "");
  const [priority, setPriority] = useState(initialTask ? (initialTask.priority ? initialTask.priority.toLowerCase() : "medium") : "medium");
  const [assignedUsers, setAssignedUsers] = useState(initialTask ? (initialTask.assignedUsers || []) : []);
  const [userSearch, setUserSearch] = useState("");
  const { cUser } = arguments[0];

  useEffect(() => {
    // keep date synced if initialDate changes
    setDate(initialTask ? initialTask.date : initialDate);
    setAssignedUsers(initialTask ? (initialTask.assignedUsers || []) : []);
  }, [initialDate, initialTask]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please provide a title");
      return;
    }
  onSave({ title: title.trim(), description: description.trim(), date, time, priority: priority.toLowerCase(), assignedUsers });
  }

  function toggleUser(id) {
    setAssignedUsers((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }


  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-gray-200" style={{ padding: "1rem" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            style={{ color: "red" }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" style={{ margin: "1rem" }}>
          {/* Title */}
          <div>
            {/* <label className="text-sm font-semibold text-gray-700">Title</label> */}
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Enter task title..."
              style={{ padding: "0.5rem" }}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {/* <label className="text-sm font-semibold text-gray-700">Date</label> */}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ padding: "0.5rem", marginTop: "1rem" }}
                className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
            <div>
              {/* <label className="text-sm font-semibold text-gray-700">Time (optional)</label> */}
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}

                style={{ padding: "0.5rem", marginTop: "1rem" }}
                className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Priority & Users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {/* <label className="text-sm font-semibold text-gray-700">Priority</label> */}
              <select
                value={priority}
                style={{ padding: "0.5rem", marginTop: "1rem" }}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                {
                  TICKET_PRIORITIES.map((i) => {
                    return <option value={i.value} key={i.value} style={{ padding: "0.5rem" }}>{i.label}</option>
                  })
                }
                {/* <option value="medium" style={{ padding: "0.5rem" }}>Medium</option>
                <option value="high" style={{ padding: "0.5rem" }}>High</option> */}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700" style={{ padding: "0.5rem", marginTop: "1rem" }}>Assign to</label>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full mb-2 px-3 py-2 border rounded-lg text-sm text-gray-800 shadow"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{padding:"0.5rem"}}
                />
                <div style={{padding:"0.5rem"}} className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                  {users
                    .filter((u) => u.id !== cUser?.id && u.Role !== "MANAGER" && u.Role !== "HR" && (!userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase())))
                    .map((u) => (
                      <label
                        style={{ padding: "0.5rem" }}
                        key={u.id}
                        className={`cursor-pointer text-sm px-3 py-1.5 rounded-full border transition ${assignedUsers.includes(u.id)
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={assignedUsers.includes(u.id)}
                          onChange={() => toggleUser(u.id)}
                          style={{ padding: "0.5rem", marginTop: "1rem" }}
                        />
                        {u.name}
                      </label>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            {/* <label className="text-sm font-semibold text-gray-700">Description</label> */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ padding: "0.5rem", marginTop: "1rem" }}
              className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Add details or notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "0.5rem", marginTop: "1rem" }}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "0.5rem", marginTop: "1rem" }}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );

}
