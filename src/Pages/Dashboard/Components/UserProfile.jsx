import { collection,doc, getDocs,query, where } from "firebase/firestore"; 
import { useLocation,useNavigate } from "react-router";
import { Card } from "antd";
import { useEffect } from "react";
const UserProfile = () => {
      const { state } = useLocation();
      const navigate = useNavigate()
  //       const noUser = ()=>{
  //   navigate("/SignIn")
  //   console.log("ye q nhi chala")
  // }
  return (
    <>
          <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
      <Card title="User Dashboard" style={{ width: 400 }}>
        {/* {state ? (
          <>
            <p><strong>Email:</strong> {state.email}</p>
            <p><strong>User ID:</strong> {state.uid}</p>
          </>
        ) : (
          <><p>hello</p></>
          // useEffect(()=>{
          //   noUser()
          // },[])
        )} */}
      </Card>
      
    </div>
    </>
  )
}

export default UserProfile
