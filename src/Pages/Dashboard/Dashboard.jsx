import { collection, doc, getDoc, query, where } from "firebase/firestore";
import { useLocation } from "react-router";
import { useNavigate } from "react-router";
import { db } from "../../Lib/FirebaseConfig/firebase"
import { DB_COLLECTION } from "../../Lib/FirebaseConfig/constant";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./css/style.css"
import Organization from "./Components/Organization";
import DashNav from "./Components/DashNav";
import { currentUser } from "../../Store/Slices/currentUser";


const Dashboard = () => {
  const [Data, setData] = useState()
  const [useUserData, setUserData] = useState(null)
  const abc = useSelector((state)=> state.cUser)
  // const cu = useCurrentUser()
  const { userId } = useSelector((state) => state.user)
  // const { state } = useLocation();
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const fetchData = async () => {
    const docRef = doc(db, "Users", userId);
    const docSnap = await getDoc(docRef)
    // console.log(docSnap.data())
    const cUser = docSnap.data()
    dispatch(currentUser(docSnap.data()))
    // console.log(abc)
  if((cUser.Role === "MANAGER" || cUser.Role === "HR")&& cUser.department){
    navigate("/Dashboard/Department",{ state: cUser.department })
  }else if(cUser.Role === "EMPLOYEE" ){
    navigate("/Dashboard/Employee/Profile", { state: userId })
  }else{
     navigate("/Dashboard")
  }
    // const customQuery = where("userId", "==", userId);
    // const qRef = query(docRef, customQuery);
    // console.log(qRef)
    // const querySnapshot = await getDocs(qRef);
    // console.log(querySnapshot)
    // querySnapshot.forEach((doc) => {
    //     const data = { id: doc.id, ...doc.data() };
    //     parsedData.push(data);
    //   });
    // console.log(parsedData);
    // setData(parsedData);

  }

  useEffect(() => {
    fetchData()
    if (!userId) {
      navigate("/SignIn")
    }
  }, [])


  return (
    <>
      <div style={{ display: "flex", width: "100%", height:"100vh" }} className="bg-gradient-to-br from-indigo-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* <DashNav/> */}
        <Organization />

      </div>
      {/* <Calandar/> */}
    </>
  );
};

export default Dashboard;
