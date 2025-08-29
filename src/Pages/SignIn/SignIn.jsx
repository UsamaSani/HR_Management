import { useSelector,useDispatch } from "react-redux";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { signInWithEmailAndPassword} from "firebase/auth";
import { auth } from "../../Lib/FirebaseConfig/firebase";
import { useNavigate } from "react-router";
import "./SignIn.css"; 
import { loginUser,signoutUser } from "../../Store/Slices/user";

const { Title } = Typography;
const SignIn = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate()
  // const {userId} = useSelector((state)=>state.user)
  const dispatch = useDispatch()
  // console.log(userId)
  const onFinish = async(values) => {
    const {email,password} =values;
      try {
        const userCredential =  await signInWithEmailAndPassword(auth, email, password);
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        };
    message.success("Login successful!");
    // console.log(userData)
    dispatch(loginUser(userCredential.user.uid))
    navigate("/Dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      message.error("Invalid email or password!");
    }
  
    form.resetFields();
  };

  return (
    <div className="signin-wrapper">
      <Card className="signin-card">
        <Title level={2} className="signin-title">Welcome Back</Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="signin-form"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Enter a valid email" }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter your password" }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SignIn;
