import { Space, Table, Tag, Button, Modal, message, Select, DatePicker } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {deleteEmployee} from "../../../Store/Slices/employee"
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  getCountFromServer,
} from "firebase/firestore";
import { db,auth } from "../../../Lib/FirebaseConfig/firebase";
import { Form, Input } from "antd";
import { v4 as uuidv4 } from "uuid";
import { DB_COLLECTION } from "../../../Lib/FirebaseConfig/constant";
import { USER_Roles } from "../../../Lib/FirebaseConfig/constant";
import { department } from "../../../Store/Slices/department";

import "./style.css";
import { deepPurple } from "@mui/material/colors";
import { employee } from "../../../Store/Slices/employee";
import { CNIC_REGEX, EMAIL_REGEX, PASSWORD_REGEX } from "../../../Lib/regex";

function Employee() {
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isRequired, setRequired] = useState(true)
  const [checkPass, setcheckPass] = useState()
  const [formBtn, setFormBtn] = useState("Add Dept.");
  const [modalHeading, setModalHeading] = useState("Add Department");
  const [deptId, setDeptId] = useState()

  // loading spinner state (if you want to show global loading similar to org component)
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false); // for modal actions

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
              // console.log(record);
              showModal(record);
            }}
            type="default"
          >
            <EditOutlined style={{ color: "blue", cursor: "pointer" }} />
          </Button>
          <Button
            style={{ borderColor: "red" }}
            onClick={async () => {
              const { id } = record;
              try {
                setActionLoading(true)
                await deleteDoc(doc(db, DB_COLLECTION.USERS, id));
                dispatch(deleteEmployee(id))
                setActionLoading(false)
                message.success("Employee Successfully Deleted");
              } catch (e) {
                // console.log(e);
                message.error("Failed to delete employee");
              }
            }}
            danger
          >
            <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
          </Button>
        </Space>
      ),
    },
  ];

  const showModal = (record) => {
    const { id, department, designation, Cnic, City, Country, Email, FullName, Gender, PhoneNumber, Role, Username ,hireDate,endDate} = record;
    setModalText("Update Employee.")
    setOpen(true);
    setIsEditMode(true);
    setEditingId(id);
    setModalHeading("Edit Employee");
    setFormBtn("Update Employee.");
    setRequired(false)

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
    // console.log("Clicked cancel button");
    setOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const docRef = collection(db, DB_COLLECTION.USERS);
      const querydocSnap = await getDocs(docRef);
      if (querydocSnap.docs) {
        const deptList = querydocSnap.docs.map((doc) => ({
          key: doc.id,
          id: doc.id,
          ...doc.data(),
        }));
        dispatch(employee(deptList));
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

// const deleteUserById = async (uid) => {
//   const auth = getAuth();
//   const user = auth.currentUser;

//   if (!user) {
//     console.error("No user signed in");
//     return;
//   }

//   const functions = getFunctions();
//   const deleteUser = httpsCallable(functions, 'deleteUserById');

//   try {
//     const result = await deleteUser({ uid });
//     console.log(result.data.message);
//   } catch (error) {
//     console.error("Error deleting user:", error.message);
//   }
// };

  useEffect(() => {
    if (userId) fetchData();
    else navigate("/SignIn");
  }, [userId]);

  const handleAdd = () => {
    setModalText("Add Employee.")
    setIsEditMode(false);
    setEditingId(null);
    setModalHeading("Add Employee");
    setFormBtn("Add Employee.");
    setOpen(true);
    setRequired(true)
    form.resetFields();
  };
  const handleChange = (_, option) => {
    setDeptId(option.key)
  }

  const onFinish = async (values) => {

    // console.log(values);
    const cleanObject = (obj) => {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined)
      );
    };

    if (isEditMode && editingId) {
      setModalText("Apply Changes");
      try {
        setModalText("Employee updating......");
        const cleanedValues = cleanObject({
          ...values,
          hireDate: values.hireDate ? values.hireDate.format("YYYY-MM-DD") : undefined,
          endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined,
        });
setActionLoading(true)
await setDoc(doc(db, DB_COLLECTION.USERS, editingId), cleanedValues, {
  merge: true
});

setActionLoading(false)
        message.success("Employee successfully updated");
        setTimeout(() => {
          setOpen(false);
          setConfirmLoading(false);
          if (userId) fetchData();
          setModalText("");
        }, 2000);


      } catch (error) {
        setModalText("there are some error retry......");
        console.error("Error updating Employee: ", error);
        message.error("Failed to update department");
      }
      setActionLoading(false)
    } else {
      setModalText("ok");
      const newEmp = {
        ...values,
        hireDate: values.hireDate ? values.hireDate.format("YYYY-MM-DD") : undefined,
        endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined,
      };
      // console.log(newDept)

      try {
        setModalText("Employee uploading......");
        setActionLoading(true)
         const  userCredential = await createUserWithEmailAndPassword(auth, values.Email, values.Password);
         const empId = userCredential.user.uid;
        //  console.log(empId,"==============")
         await setDoc(doc(db, DB_COLLECTION.USERS,empId), newEmp);
         setActionLoading(false)
         message.success("Employee successfully added");
         setTimeout(() => {
           setOpen(false);
           setConfirmLoading(false);
          if (userId) fetchData();
          setModalText("");
        }, 2000);
      } catch (error) {
        setActionLoading(false)
        setModalText("there are some error retry......");
        console.error("Error adding Empoloyee: ", error);
        message.error("Failed to add Employee");
      }
      setConfirm(true);
    }
    const q = query(
      collection(db, DB_COLLECTION.USERS),
      where("department", "==", values.department)
    );

    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count || 0
    await setDoc(doc(db, DB_COLLECTION.DEPARTMENTS, deptId),
      { employee: count, },
      { merge: true }
  )
      setActionLoading(false);
      form.resetFields();
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 relative">
      {/* Optional global loading spinner overlay (matches Organization styling) */}
  {(loading || actionLoading) && (
        <div  className={`fixed inset-0 ${open ? 'z-60' : 'z-50'} flex items-center justify-center bg-black/30`}>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto">
        {/* Header / Hero */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 text-2xl font-bold shadow">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 10-8 0v1H5a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2h-3V7z" />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 mb-1">Employees</h1>
              <div className="text-gray-500 text-base">Manage employee accounts and profiles</div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Primary CTA (styled to match Organization) */}
          <button
            onClick={handleAdd}
            className="hover:cursor-pointer bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow hover:from-indigo-700 hover:to-blue-600 border-none"
            type="button"
            style={{padding:"1rem"}}
          >
            Add Employee
          </button>
        </div>

        {/* Table Container Card */}
        <div style={{marginTop:"3rem"}} className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
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

        {/* Modal - kept internal structure as-is, added blur to backdrop via maskStyle */}
        <Modal
          title={modalHeading}
          open={open}
          onOk={() => form.submit()}
          confirmLoading={confirmLoading}
          onCancel={handleCancel}
          okText={modalText}
          // className="z-40"
          maskStyle={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.35)' }}
        >
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
                {
                  required: isRequired,
                  min: 3,
                  message: "Full Name Must be Greater than two Character",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Username"
              name="Username"
              rules={[
                {
                  required: isRequired,
                  min: 3,
                  message: "Username Must be Greater than two Character",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Gender"
              name="Gender"
              rules={[
                {
                  required: isRequired,
                  message: "Please Select a Gender",
                },
              ]}
            >
              <Select placeholder="Select Gender">
                <Select.Option value="male">Male</Select.Option>
                <Select.Option value="female">Female</Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Country"
              name="Country"
              rules={[
                {
                  required: isRequired,
                  message: "Please Select a Country",
                },
              ]}
            >
              <Select placeholder="Select Country">
                <Select.Option value="Pakistan">Pakistan</Select.Option>
                <Select.Option value="Turkey">Turkey</Select.Option>
                <Select.Option value="Iran">Iran</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="City"
              name="City"
              rules={[
                {
                  required: isRequired,
                  message: "Please Select a City",
                },
              ]}
            >
              <Select placeholder="Select City">
                <Select.Option value="Karachi">Karachi</Select.Option>
                <Select.Option value="Islamabad">Islamabad</Select.Option>
                <Select.Option value="Lahore">Lahore</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Desination"
              name="designation"
              rules={[
                {
                  required: isRequired,
                  message: "Please Select a Designation",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Role"
              name="Role"
              rules={[
                {
                  required: isRequired,
                  message: "Please Select a Role",
                },
              ]}
            >
              <Select placeholder="Select a Role">
                {
                  Object.keys(USER_Roles).map((items) => {
                    return <Select.Option value={items} key={items}>{items}</Select.Option>
                  })
                }
              </Select>
            </Form.Item>

            <Form.Item
              label="Department"
              name="department"
              rules={[
                {
                  required: isRequired,
                  message: "Please Select a Department",
                },
              ]}
            >
              <Select placeholder="Select a Department" onChange={handleChange}>
                {ddata.map((items) => {
                  return <Select.Option value={items.department} key={items.key}>{items.department}</Select.Option>
                })}
              </Select>
            </Form.Item>


            <Form.Item
              label="Email"
              name="Email"
              rules={[
                { required: isRequired },
                { pattern: EMAIL_REGEX, message: "please enter valid email" }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Cnic"
              name="Cnic"
              rules={[
                { required: isRequired },
                { pattern: CNIC_REGEX, message: "Please Enter Valid Cnic Use this format xxxxx-xxxxxxx-x" }
              ]}
            >
              <Input placeholder="Cnic : xxxxx-xxxxxxx-x" maxLength={15} />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="PhoneNumber"
              rules={[{ required: isRequired, min: 11 }]}
            >
              <Input maxLength={11} />
            </Form.Item>
            <Form.Item
              label="Hire Date"
              name="hireDate"
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              label="End Date"
              name="endDate"
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              label="Password"
              name="Password"
              rules={[
                { required: isRequired },
                { pattern: PASSWORD_REGEX, message: "Use 8 character long password Consist of Uppercase,special character & Numbers" }
              ]}
            >
              <Input.Password onBlur={(e) => { setcheckPass(e.target.value) }} />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="ConfirmPassword"
              rules={[{ required: isRequired, pattern: checkPass, message: "password did not match" }]}
            >
              <Input.Password />
            </Form.Item>

            {/* modal actions are handled by Modal props (onOk triggers form.submit) */}
          </Form>
        </Modal>
      </div>
    </div>
  );
}
export default Employee;
