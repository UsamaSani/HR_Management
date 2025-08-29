import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  message,
  Spin,
} from "antd";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../Lib/FirebaseConfig/firebase";
import { DB_COLLECTION, USER_Roles } from "../../../Lib/FirebaseConfig/constant";
import { useSelector } from "react-redux";
import { CNIC_REGEX, EMAIL_REGEX, PASSWORD_REGEX } from "../../../Lib/regex";
import dayjs from "dayjs";
import { useLocation } from "react-router";

const { Option } = Select;

const Profile = () => {
  const [form] = Form.useForm();
  const { userId } = useSelector((state) => state.user);
  const departments = useSelector((state) => state.dept);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const location = useLocation()
  const empId = location.state
  // Fetch user from Firestore
  useEffect(() => {
    const fetchUser = async () => {
      // if (!userId) return;
      const id = empId || userId
      try {
        const userRef = doc(db, DB_COLLECTION.USERS, id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          // Format date fields if needed
          if (data.hireDate) data.hireDate = dayjs(data.hireDate);
          if (data.endDate) data.endDate = dayjs(data.endDate);

          form.setFieldsValue(data);
        } else {
          message.error("User not found.");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        message.error("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, form]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const userRef = doc(db, DB_COLLECTION.USERS, userId);
      await setDoc(userRef,
        {
          ...values,
          hireDate: values.hireDate ? values.hireDate.format("YYYY-MM-DD") : undefined,
          endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined,
        }
      );
      message.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Spin tip="Loading profile..." size="large" />
    </div>
  );

  return (
    <div style={{  margin: "4rem", padding: "3rem" }} className="flex justify-center align-middle items-center shadow-2xl rounded-3xl p-7" >
      {/* <Card title="User Profile" bordered={false} style={{ borderRadius: 10 }} > */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ text: "white" }}
        disabled={loading || saving}
      >
        <Row gutter={16}>
          {/* Full Name */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Full Name</span>}
              name="FullName"
              rules={[{ required: true, min: 3, message: "Enter a valid name" }]}
            >
              <Input/>
            </Form.Item>
          </Col>

          {/* Username */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Username</span>}
              name="Username"
              rules={[{ required: true, min: 3, message: "Enter a valid username" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          {/* Email */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Email</span>}
              name="Email"
              rules={[
                { required: true },
                { pattern: EMAIL_REGEX, message: "Enter a valid email" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>

          {/* Phone Number */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Phone Number</span>}
              name="PhoneNumber"
              rules={[{ required: true, min: 11, message: "Enter valid phone" }]}
            >
              <Input maxLength={11} />
            </Form.Item>
          </Col>

          {/* CNIC */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>CNIC</span>}
              name="Cnic"
              rules={[
                { required: true },
                { pattern: CNIC_REGEX, message: "Format: xxxxx-xxxxxxx-x" },
              ]}
            >
              <Input placeholder="xxxxx-xxxxxxx-x" maxLength={15} />
            </Form.Item>
          </Col>

          {/* Gender */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Gender</span>}
              name="Gender"
              rules={[{ required: true, message: "Please select gender" }]}
            >
              <Select placeholder="Select Gender">
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Country */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Country</span>}
              name="Country"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select Country">
                <Option value="Pakistan">Pakistan</Option>
                <Option value="Turkey">Turkey</Option>
                <Option value="Iran">Iran</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* City */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>City</span>}
              name="City"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select City">
                <Option value="Karachi">Karachi</Option>
                <Option value="Lahore">Lahore</Option>
                <Option value="Islamabad">Islamabad</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Role */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Role</span>}
              name="Role"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select Role">
                {Object.keys(USER_Roles).map((role) => (
                  <Option key={role} value={role}>{role}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Department */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Department</span>}
              name="department"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select Department">
                {departments.map((item) => (
                  <Option key={item.key} value={item.department}>
                    {item.department}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Designation */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Designation</span>}
              name="designation"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          {/* Hire Date */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Hire Date</span>}
              name="hireDate"
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>

          {/* End Date */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>End Date</span>}
              name="endDate"
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>

          {/* Password */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Password</span>}
              name="Password"
              rules={[
                { required: true },
                { pattern: PASSWORD_REGEX, message: "8+ characters, 1 uppercase, 1 number, 1 symbol" },
              ]}
            >
              <Input.Password />
            </Form.Item>
          </Col>

          {/* Confirm Password */}
          <Col span={12}>
            <Form.Item
              label={<span style={{ color: 'white', fontWeight: 600 }}>Confirm Password</span>}
              name="ConfirmPassword"
              dependencies={["Password"]}
              rules={[
                { required: true, message: "Please confirm password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("Password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject("Passwords do not match!");
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ textAlign: "center" }}>
          <Button
            type="primary"
            htmlType="submit"
            style={{ padding: "6px 30px", borderRadius: 6, fontWeight: "bold" }}
            loading={saving}
            disabled={loading || saving}
          >
            Save Profile
          </Button>
        </Form.Item>
      </Form>
      {/* </Card> */}
    </div>
  );
};

export default Profile;
