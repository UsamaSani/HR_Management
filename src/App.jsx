import { Routes , Route} from "react-router"
import Home from "./Pages/Home/Home"
import SignUp from "./Pages/SignUp/SignUp"
import SignIn from "./Pages/SignIn/SignIn"
import Dashboard from "./Pages/Dashboard/Dashboard"
import PublicLayout from "./Layouts/PublicLayout"
import UserLayout from "./Layouts/UserLayout"
import UserProfile from "./Pages/Dashboard/Components/UserProfile"
import AuthLayout from "./Layouts/AuthLayout"
import Deparment from "./Pages/Dashboard/Components/Department"
import Employee from "./Pages/Dashboard/Components/Employee"
import Profile from "./Pages/Dashboard/Components/Profile"
import TaskCalendar from "./Pages/Dashboard/Components/TaskCalandar"
import Attendance from "./Pages/Dashboard/Components/Attendance"
import { ClassNames } from "@emotion/react"

function App() {
  return (
    <>
    <Routes>
      <Route element={<PublicLayout/>}>
      <Route path="/" element={<Home/>} />
      <Route element={<AuthLayout/>}>
      <Route path="/SignUp" element={<SignUp/>} />
      <Route path="/SignIn" element={<SignIn/>} />
      </Route>
      </Route>
      
      <Route element={<UserLayout/>}>
      <Route path="/Dashboard" element={<Dashboard/>} />
      <Route path="/Dashboard/Profile" element={<UserProfile/>} />
      <Route path="/Dashboard/Department" element={<Deparment/>}/>
      <Route path="/Dashboard/Employee" element={<Employee/>}/>
      <Route path="/Dashboard/TaskCalendar" element={<TaskCalendar/>}/>
      <Route path="/Dashboard/Attendance" element={<Attendance/>}/>
      <Route path="/Dashboard/Employee/Profile" element={<Profile/>}/>
      </Route>
    </Routes>
    </>
  )
}

export default App
