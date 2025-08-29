
import { Outlet } from 'react-router'
import { useLoginRedirect } from '../Hooks/useLoginRedirect'

function AuthLayout() {
  useLoginRedirect()
  return <Outlet/>
}

export default AuthLayout
