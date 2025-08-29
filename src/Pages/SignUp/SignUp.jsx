import { Form, Input, Button, Select, Space, Checkbox } from "antd";
import { CNIC_REGEX, PASSWORD_REGEX, EMAIL_REGEX } from "../../Lib/regex";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../Lib/FirebaseConfig/firebase';
import { DB_COLLECTION, USER_Roles } from '../../Lib/FirebaseConfig/constant';
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import "../SignUp/SignUp.css";
import { useState } from "react";


function SignUp() {
  const [checkPass, setcheckPass] = useState()
  const navigate = useNavigate()
  const [role, setRole] = useState(USER_Roles.EMPLOYEE)
  const [form] = Form.useForm();
  const onFinish = async (values) => {
    const {
      ...userDetails
    } = values;

    const userCredential = await createUserWithEmailAndPassword(auth, userDetails.Email, userDetails.Password);
    const userId = userCredential.user.uid;
    const userDetailPayload = {
      userId,
      Role: role,
      ...userDetails,
      department: "null",
      designation: "null",
      employeeId: "null"
    }
    const collectionRef = doc(db, DB_COLLECTION.USERS, userId)
    try {
      form.resetFields();
      await setDoc(collectionRef, userDetailPayload);
      const result = await Swal.fire({
        title: "Success",
        text: "You have signedup successfully",
        icon: "success",
      });
      if (result.isConfirmed) {
        navigate("/SignIn");
      }
    } catch (error) {
      console.error("Error saving to database", error);
    }
  };

  const onChange = (e) => {
    if (e.target.checked) setRole(USER_Roles.ADMIN)
    else setRole(USER_Roles.EMPLOYEE)
  }
  return (
    <div className="signup-container">
      <h1 className="signup-title">Create Your Account</h1>
      <Form
        form={form}
        layout="vertical"
        className="signup-form"
        onFinish={onFinish}
      >

            <Form.Item
              label="Full Name"
              name="FullName"
              rules={[
                {
                  required: true,
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
                  required: true,
                  min: 3,
                  message: "Username Must be Greater than two Character",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="Email"
              rules={[
                { required: true },
                { pattern: EMAIL_REGEX, message: "please enter valid email" }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Cnic"
              name="Cnic"
              rules={[
                { required: true },
                { pattern: CNIC_REGEX, message: "Please Enter Valid Cnic Use this format xxxxx-xxxxxxx-x" }
              ]}
            >
              <Input placeholder="Cnic : xxxxx-xxxxxxx-x" maxLength={15} />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="PhoneNumber"
              rules={[{ required: true, min: 11 }]}
            >
              <Input maxLength={11} />
            </Form.Item>
            <Form.Item
              label="Gender"
              name="Gender"
              rules={[
                {
                  required: true,
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
                  required: true,
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
                  required: true,
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
              label="Password"
              name="Password"
              rules={[
                { required: true },
                { pattern: PASSWORD_REGEX, message: "Use 8 character long password Consist of Uppercase,special character & Numbers" }
              ]}
            >
              <Input.Password onBlur={(e) => { setcheckPass(e.target.value) }} />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="ConfirmPassword"
              rules={[{ required: true, pattern: checkPass, message: "password did not match" }]}
            >
              <Input.Password />
            </Form.Item>

          {/* <Form.Item>
           <Checkbox onChange={onChange}>Sign-In as Admin</Checkbox>
           </Form.Item> */}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
            <Button htmlType="reset">
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

export default SignUp;
