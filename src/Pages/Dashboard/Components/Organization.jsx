import { Space, Table, Tag, Button, Modal, message, Select, } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  getCountFromServer
} from "firebase/firestore";
import { db } from "../../../Lib/FirebaseConfig/firebase";
import { Form, Input } from "antd";
import { v4 as uuidv4 } from "uuid";
import { DB_COLLECTION, USER_Roles } from "../../../Lib/FirebaseConfig/constant";
import { department } from "../../../Store/Slices/department";

import "./style.css";
import { deepPurple } from "@mui/material/colors";

function Organization() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { userId } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState("");
  const [confirm, setConfirm] = useState(false);
  const dispatch = useDispatch();
  const ddata = useSelector((state) => state.dept);
  const edata = useSelector((state) => state.emp);
  const [form] = Form.useForm();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [epmId, setEmpId] = useState()

  const [formBtn, setFormBtn] = useState("Add Dept.");
  const [modalHeading, setModalHeading] = useState("Add Department");
  const cUser = useSelector((state) => state.cUser)
  // console.log(cUser)


  const columns = [
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (text, record) => <a onClick={() => { navigate("/Dashboard/Department", { state: record.department }) }}>{text}</a>,
    },

    {
      title: "Manager",
      key: "manager",
      dataIndex: "manager",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Employee",
      key: "employee",
      dataIndex: "employee",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            onClick={() => {
              const { id, department, manager } = record;
              showModal(id, department, manager);
            }}
          >
            <EditOutlined style={{ color: "blue", cursor: "pointer" }} />
          </Button>
          <Button
            style={{ borderColor: "red" }}
            onClick={async () => {
              setActionLoading(true);
              const { id } = record;
              try {
                await deleteDoc(doc(db, DB_COLLECTION.DEPARTMENTS, id));
                message.success("Department Successfully Deleted");
                // Remove from UI immediately
                dispatch(department(ddata.filter((dept) => dept.id !== id)));
              } catch (e) {
                // console.log(e);
                message.error("Failed to delete department");
              } finally {
                setActionLoading(false);
              }
            }}
          >
            <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
          </Button>
        </Space>
      ),
    },
  ];

  const showModal = (id, department, manager) => {
    setModalText("Update Dept.")
    setOpen(true);
    setIsEditMode(true);
    setEditingId(id);
    setModalHeading("Edit Department");
    setFormBtn("Update Dept.");

    form.setFieldsValue({
      departmentName: department,
      manager: manager,
    });
  };

  const handleCancel = () => {
    // console.log("Clicked cancel button");
    setOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const docRef = collection(db, DB_COLLECTION.DEPARTMENTS);
      const querydocSnap = await getDocs(docRef);
      if (querydocSnap.docs) {
        const deptList = querydocSnap.docs.map((doc) => ({
          key: doc.id,
          id: doc.id,
          ...doc.data(),
        }));
        dispatch(department(deptList));
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (userId) fetchData();
  else navigate("/SignIn");
  }, [userId]);

  const handleAdd = () => {
  setModalText("Add Dept.")
  setIsEditMode(false);
  setEditingId(null);
  setModalHeading("Add Department");
  setFormBtn("Add Dept.");
  setOpen(true);
  form.resetFields();
  };


  const handleChange = (_, option) => {
    setEmpId(option.key)
  }
  const onFinish = async (values) => {
    setActionLoading(true);
    try {
      const { departmentName, manager } = values;
      const q = query(
        collection(db, DB_COLLECTION.USERS),
        where("department", "==", departmentName)
      );
      const snapshot = await getCountFromServer(q);
      const count = snapshot.data().count
      if (isEditMode && editingId) {
        setModalText("Apply Changes");
        try {
          setModalText("department updating......");
          await setDoc(doc(db, DB_COLLECTION.DEPARTMENTS, editingId), {
            department: departmentName,
            manager,
            employee: count || 0,
            code: uuidv4(),
            createdBy: userId,
          });
          message.success("Department successfully updated");
          setTimeout(() => {
            setOpen(false);
            setConfirmLoading(false);
            if (userId) fetchData();
            setModalText("");
          }, 2000);
        } catch (error) {
          setModalText("there are some error retry......");
          console.error("Error updating department: ", error);
          message.error("Failed to update department");
        }
      } else {
        setModalText("ok");
        const newDept = {
          department: departmentName,
          employee: count || 0,
          manager: manager,
          code: uuidv4(),
          createdBy: userId,
        };
        try {
          setModalText("department uploading......");
          await addDoc(collection(db, DB_COLLECTION.DEPARTMENTS), newDept);
          message.success("Department successfully added");
          setTimeout(() => {
            setOpen(false);
            setConfirmLoading(false);
            if (userId) fetchData();
            setModalText("");
          }, 2000);
        } catch (error) {
          setModalText("there are some error retry......");
          console.error("Error adding department: ", error);
          message.error("Failed to add department");
        }
        setConfirm(true);
      }
      await setDoc(doc(db, DB_COLLECTION.USERS, epmId),
        {
          Role: USER_Roles.MANAGER,
          designation: departmentName + " Manager",
          department: departmentName
        },
        { merge: true }
      );
      form.resetFields();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 relative">
      {(loading || actionLoading) && (
        <div className={`fixed inset-0 ${open ? 'z-60' : 'z-50'} flex items-center justify-center bg-black/30`}>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md transition-all" />
      )}
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 text-2xl font-bold shadow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3m10-5h3a1 1 0 011 1v4m-1 4v4a1 1 0 01-1 1h-3m-10-5H4a1 1 0 01-1-1v-4m1 8h3m10 0h3m-7-4v4m0-4V7m0 4h4m-4 0H7" /></svg></span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 mb-1">Organization Dashboard</h1>
              <div className="text-gray-500 text-base">Manage departments, managers, and employees</div>
            </div>
          </div>
          <div className="flex-1" />
          <Button
            type="primary"
            className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow hover:from-indigo-700 hover:to-blue-600 border-none"
            onClick={handleAdd}
          >
            Add Department
          </Button>
        </div>
    <div style={{ marginTop:"2rem",}} className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
          <Table
            columns={columns}
            dataSource={ddata}
            pagination={{
              position: ["bottomCenter"],
              pageSize: 5,
            }}
            className="rounded-xl overflow-hidden shadow-md"
            rowClassName={() => "hover:bg-indigo-50 transition"}
            bordered
          />
        </div>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-blue-200" style={{ padding: "1rem" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-indigo-900 tracking-tight">{modalHeading}</h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold"
                  style={{ color: "red", background: "none", border: "none" }}
                >
                  ✕
                </button>
              </div>
              <Form
                layout="vertical"
                name="departmentForm"
                onFinish={onFinish}
                form={form}
              >
                <Form.Item
                  label={<span className="font-semibold text-gray-700">Department Name</span>}
                  name="departmentName"
                  rules={[{ required: true, message: "Please enter department name" }]}
                >
                  <Input placeholder="Enter Department Name" className="px-4 py-2 rounded-lg border border-gray-300 shadow" />
                </Form.Item>
                <Form.Item
                  label={<span className="font-semibold text-gray-700">Manager of Department</span>}
                  name="manager"
                  rules={[{ required: true, message: "Please enter manager name" }]}
                >
                  <Select placeholder="Select a Manager" onChange={handleChange} className="rounded-lg shadow">
                    {edata.map((items) => (
                      <Select.Option value={items.FullName} key={items.key}>{items.FullName}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={{padding:"0.5rem"}}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{padding:"0.5rem"}}
                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition"
                  >
                    {modalText}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Organization;
