import { Outlet } from "react-router"
import Navbar from "../Components/Navbar"
import Footer from "../Components/Footer"
import { useLoginRedirect } from "../Hooks/useLoginRedirect"

const PublicLayout = () => {

useLoginRedirect()
  return (
    <>
      <Navbar/>
      <Outlet/>
      <Footer/>
    </>
  )
}

export default PublicLayout
