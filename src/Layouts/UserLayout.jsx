import { Outlet } from "react-router"
import DashNav from "../Pages/Dashboard/Components/DashNav"

function UserLayout() {
  return (
    <>
    <div  className="bg-gradient-to-br from-indigo-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <DashNav/>
    <Outlet/>
    </div>
    </>
  )
}

export default UserLayout
