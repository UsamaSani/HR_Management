import { Space, Table, Tag, Button, message, Select, DatePicker } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

import dayjs from "dayjs";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db,auth } from "../../../Lib/FirebaseConfig/firebase";
import { Form, Input } from "antd";
import { v4 as uuidv4 } from "uuid";
import { DB_COLLECTION, USER_Roles } from "../../../Lib/FirebaseConfig/constant";

import "./style.css";
import { deepPurple } from "@mui/material/colors";
import { deleteEmployee, employee } from "../../../Store/Slices/employee";
import { CNIC_REGEX, EMAIL_REGEX, PASSWORD_REGEX } from "../../../Lib/regex";

function Department() {
  const location = useLocation()
  const { userId } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState("");
  const [confirm, setConfirm] = useState(false);
  const dispatch = useDispatch();
  const edata = useSelector((state) => state.emp);
  const ddata = useSelector((state) => state.dept);
  const [form] = Form.useForm();
  const [checkPass, setcheckPass] = useState()
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [department, setDepartment] = useState("");
  const [isRequired, setRequired] = useState(true)
  const [empId, setEmpId] = useState(null); // fixed missing state

  const [formBtn, setFormBtn] = useState("Add Dept.");
  const [modalHeading, setModalHeading] = useState("Add Employee");

  // columns (kept same)
  const columns = [
    {
      title: "Employee",
      key: "FullName",
      dataIndex: "FullName",
      render: (text, record) => <a onClick={() => { navigate("/Dashboard/Employee/Profile", { state: record.id }) }}>{text}</a>,
    },
    {
      title: "Email",
      dataIndex: "Email",
      key: "Email",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Role",
      key: "Role",
      dataIndex: "Role",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      render: (text, record) => <a>{text}</a>,
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (text, record) => <a>{text}</a>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            onClick={() => {
              showModal(record);
            }}
          >
            <EditOutlined style={{ color: "blue", cursor: "pointer" }} />
          </Button>
          <Button
            style={{ borderColor: "red" }}
            onClick={async () => {
              const { id } = record;
              try {
                // NOTE: original code deleted from DEPARTMENTS; keep same behavior.
                await deleteDoc(doc(db, DB_COLLECTION.USERS, id));
                dispatch(deleteEmployee(id))
                message.success("Successfully Deleted");
              } catch (e) {
                // console.log(e);
              }
            }}
          >
            <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
          </Button>
        </Space>
      ),
    },
  ];

  const showModal = (record) => {
    const { id, department, designation, Cnic, City, Country, Email, FullName, Gender, PhoneNumber, Role, Username, hireDate, endDate } = record;
    setModalText("Update Employee.")
    setOpen(true);
    setIsEditMode(true);
    setEditingId(id);
    setModalHeading("Edit Employee");
    setFormBtn("Update Employee.");
    setRequired(false)

    // set form values when opening modal for edit
    form.setFieldsValue({
      department,
      designation,
      Cnic,
      City,
      Country,
      Email,
      FullName,
      Gender,
      PhoneNumber,
      Role,
      Username,
      hireDate: hireDate ? dayjs(hireDate) : null,
      endDate: endDate ? dayjs(endDate) : null,
    });
  };

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
    setRequired(true);
  };

  const fetchData = async () => {
    try {
      if (!location.state) {
        console.warn("No department passed in location.state");
        return;
      }
      setDepartment(location.state);

      const q = query(
        collection(db, DB_COLLECTION.USERS),
        where("department", "==", location.state)
      );

      const querySnapshot = await getDocs(q);

      const employeeList = querySnapshot.docs.map((doc) => ({
        key: doc.id,
        id: doc.id,
        ...doc.data(),
      }));

      dispatch(employee(employeeList));
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // fetch employees once on mount and when userId or the selected department changes
  useEffect(() => {
    if (userId) fetchData();
    else navigate("/SignIn");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, location.state]);

  const handleChange = (_, option) => {
    setEmpId(option?.key || null);
  }

  const handleAdd = () => {
    setModalText("Add Dept.")
    setIsEditMode(false);
    setEditingId(null);
    setModalHeading("Add Department");
    setFormBtn("Add Dept.");
    setOpen(true);
    form.resetFields();
    setRequired(true);
    // pre-fill department field if available
    if (location.state) form.setFieldsValue({ department: location.state });
  };

  const cleanObject = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== undefined)
    );
  };
// Converts Dayjs -> Firestore Timestamp, removes ConfirmPassword / Password
const sanitizeForFirestoreISO = (obj) => {
  const copy = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (value === undefined) continue;
    if (key === 'ConfirmPassword') continue;
    if (key === 'Password') continue;

    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      copy[key] = value.toDate().toISOString();
      continue;
    }
    if (value instanceof Date) {
      copy[key] = value.toISOString();
      continue;
    }

    copy[key] = value;
  }
  return copy;
};


  const onFinish = async (values) => {
    setConfirmLoading(true);
    const cleanedValues = sanitizeForFirestoreISO(values);
    try {
      if (isEditMode && editingId) {
        setModalText("Employee updating......");
        await setDoc(doc(db, DB_COLLECTION.USERS, editingId), cleanedValues, {
          merge: true
        });
        message.success("Employee successfully updated");
        setTimeout(() => {
          setOpen(false);
          setConfirmLoading(false);
          if (userId) fetchData();
          setModalText("");
        }, 800);
      } else {
        setModalText("Employee uploading......");
        // const newDept = { ...values };
        try {
          // create auth user if password provided
          if (values.Email && values.Password) {
            const userCredential =  await createUserWithEmailAndPassword(auth, values.Email, values.Password);
            const uid = userCredential.user.uid
            await setDoc(doc(db, DB_COLLECTION.USERS,uid), cleanedValues);
          }
          message.success("Employee successfully added");
          setTimeout(() => {
            setOpen(false);
            setConfirmLoading(false);
            if (userId) fetchData();
            setModalText("");
          }, 800);
        } catch (error) {
          setModalText("there are some error retry......");
          console.error("Error adding Employee: ", error);
          message.error("Failed to add Employee");
        }
        setConfirm(true);
      }
    } catch (err) {
      console.error('onFinish error', err);
      message.error('Operation failed');
    } finally {
      setConfirmLoading(false);
      form.resetFields();
    }
  };

  // --- Render: wrapped in same page layout as Organization (keeps your classes) ---
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 relative">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 text-2xl font-bold shadow">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3m10-5h3a1 1 0 011 1v4m-1 4v4a1 1 0 01-1 1h-3m-10-5H4a1 1 0 01-1-1v-4m1 8h3m10 0h3m-7-4v4m0-4V7m0 4h4m-4 0H7" />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 mb-1">{department || "Department"}</h1>
              <div className="text-gray-500 text-base">Manage employees for this department</div>
            </div>
          </div>

          <div className="flex-1" />
          <Button
            type="primary"
            className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow hover:from-indigo-700 hover:to-blue-600 border-none"
            onClick={handleAdd}
            style={{ marginBottom: "0" }}
          >
            Add Employee
          </Button>
        </div>

        {/* card wrapper for table (same style as Organization) */}
        <div style={{ marginTop: "0.5rem" }} className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
          <Table
            columns={columns}
            dataSource={edata}
            pagination={{
              position: ["bottomCenter"],
              pageSize: 5,
            }}
            className="rounded-xl overflow-hidden shadow-md"
            rowClassName={() => "hover:bg-indigo-50 transition"}
            bordered
          />
        </div>

        {/* Custom glass modal (same look as Organization) */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-md" />
            <div className="w-full max-w-lg bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-blue-200" style={{ padding: "1rem", zIndex: 60 }}>
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
                className="flex flex-wrap justify-evenly align-middle items-center"
              >
                <Form.Item
                  label="Full Name"
                  name="FullName"
                  rules={[
                    { required: isRequired, min: 3, message: "Full Name Must be Greater than two Character" },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Username"
                  name="Username"
                  rules={[
                    { required: isRequired, min: 3, message: "Username Must be Greater than two Character" },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item label="Gender" name="Gender" rules={[{ required: isRequired, message: "Please Select a Gender" }]}>
                  <Select placeholder="Select Gender">
                    <Select.Option value="male">Male</Select.Option>
                    <Select.Option value="female">Female</Select.Option>
                    <Select.Option value="other">Other</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Country" name="Country" rules={[{ required: isRequired, message: "Please Select a Country" }]}>
                  <Select placeholder="Select Country">
                    <Select.Option value="Pakistan">Pakistan</Select.Option>
                    <Select.Option value="Turkey">Turkey</Select.Option>
                    <Select.Option value="Iran">Iran</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="City" name="City" rules={[{ required: isRequired, message: "Please Select a City" }]}>
                  <Select placeholder="Select City">
                    <Select.Option value="Karachi">Karachi</Select.Option>
                    <Select.Option value="Islamabad">Islamabad</Select.Option>
                    <Select.Option value="Lahore">Lahore</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Desination" name="designation" rules={[{ required: isRequired, message: "Please Select a Designation" }]}>
                  <Input />
                </Form.Item>

                <Form.Item label="Role" name="Role" rules={[{ required: isRequired, message: "Please Select a Role" }]}>
                  <Select placeholder="Select a Role">
                    {Object.keys(USER_Roles).map((items) => <Select.Option value={items} key={items}>{items}</Select.Option>)}
                  </Select>
                </Form.Item>

                <Form.Item label="Department" name="department"  rules={[{ required: isRequired, message: "Please Select a Department" }]}>
                  <Input readOnly value={department} />
                </Form.Item>

                <Form.Item label="Email" name="Email" rules={[{ required: isRequired }, { pattern: EMAIL_REGEX, message: "please enter valid email" }]}>
                  <Input />
                </Form.Item>

                <Form.Item label="Cnic" name="Cnic" rules={[{ required: isRequired }, { pattern: CNIC_REGEX, message: "Please Enter Valid Cnic Use this format xxxxx-xxxxxxx-x" }]}>
                  <Input placeholder="Cnic : xxxxx-xxxxxxx-x" maxLength={15} />
                </Form.Item>

                <Form.Item label="Phone Number" name="PhoneNumber" rules={[{ required: isRequired, min: 11 }]}>
                  <Input maxLength={11} />
                </Form.Item>

                <Form.Item label="Hire Date" name="hireDate">
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item label="End Date" name="endDate">
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item label="Password" name="Password" rules={[{ required: isRequired }, { pattern: PASSWORD_REGEX, message: "Use 8 character long password Consist of Uppercase,special character & Numbers" }]}>
                  <Input.Password onBlur={(e) => { setcheckPass(e.target.value) }} />
                </Form.Item>

                <Form.Item label="Confirm Password" name="ConfirmPassword" rules={[{ required: isRequired, pattern: checkPass, message: "password did not match" }]}>
                  <Input.Password />
                </Form.Item>

                <div className="flex justify-end gap-3 pt-2" style={{ width: "100%" }}>
                  <button type="button" onClick={handleCancel} style={{ padding: "0.5rem" }} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                  <button type="submit" style={{ padding: "0.5rem" }} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition">{modalText || formBtn}</button>
                </div>
              </Form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Department;
