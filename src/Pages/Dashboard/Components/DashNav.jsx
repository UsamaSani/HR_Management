import React, { useState } from 'react'
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  Box,
  Toolbar,
  AppBar,
  IconButton,
  Typography
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import { Link, useLocation, useNavigate } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import { signOut } from 'firebase/auth'
import { auth } from '../../../Lib/FirebaseConfig/firebase'
import { message } from 'antd'
import { signoutUser } from '../../../Store/Slices/user'
import { TeamOutlined,CheckOutlined, CalendarOutlined, BankOutlined } from '@ant-design/icons'

const drawerWidth = 240
const collapsedWidth = 64

const DashNav = ({ children }) => {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const cUser = useSelector((state)=> state.cUser)
  const toggleDrawer = () => {
    setOpen(!open)
  }
const userId = useSelector((state)=> state.user)
const navigate = useNavigate()
const dispatch = useDispatch()
  const logout = async()=>{
    try{
      await signOut(auth)
      message.success("SignOut Successfuly")
      dispatch(signoutUser())
      navigate("/SignIn")
    }catch(e){
      // console.log("signout Error = " , e)
    }
  }

  let menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/Dashboard' },
    { text: 'Profile', icon: <PersonIcon />, path: '/Dashboard/Employee/Profile' },
    { text: 'Employee', icon: <TeamOutlined />, path: '/Dashboard/Employee' },
    { text: 'Task', icon: <CheckOutlined />, path: '/Dashboard/TaskCalendar' },
    { text: 'Department', icon: <BankOutlined />, path: '/Dashboard/Department' },
    { text: 'Attendance', icon: <CalendarOutlined />, path: '/Dashboard/Attendance' },
    { text: 'Logout', icon: <LogoutIcon />, func: logout }
  ]
  if((cUser.Role === "MANAGER" || cUser.Role === "HR")&& cUser.department){
    menuItems = [
      { text: 'Profile', icon: <PersonIcon />, path: '/Dashboard/Employee/Profile' },
      { text: 'Department', icon: <BankOutlined />, path: '/Dashboard/Department' },
      { text: 'Attendance', icon: <CalendarOutlined />, path: '/Dashboard/Attendance' },
      { text: 'Task', icon: <CheckOutlined />, path: '/Dashboard/TaskCalendar' },
      { text: 'Logout', icon: <LogoutIcon />, func: logout }
    ]
  }else if(cUser.Role === "EMPLOYEE" ){
    menuItems = [
      { text: 'Profile', icon: <PersonIcon />, path: '/Dashboard/Employee/Profile' },
      { text: 'Task', icon: <CheckOutlined />, path: '/Dashboard/TaskCalendar' },
      { text: 'Logout', icon: <LogoutIcon />, func: logout }
    ]
  }
  return (
    <div style={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1976d2',
            color: '#fff',
            transition: 'width 0.3s ease-in-out'
          }
        }}
      >
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

        <Toolbar />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Tooltip
                title={open ? '' : item.text}
                placement="right"
                key={item.text}
                arrow
                onClick={()=>{
                  // console.log(item.text)
                  if(item.text == "Logout"){
                  const f= item.func
                  f()
                }}}
              >
                <ListItemButton
                  // button
                  component={Link}
                  to={item.path}
                  sx={{
                    backgroundColor: isActive ? '#1565c0' : 'transparent',
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    },
                    justifyContent: open ? 'initial' : 'center',
                    px: open ? 2 : 1
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: 'white',
                      minWidth: 0,
                      mr: open ? 2 : 'auto',
                      justifyContent: 'center'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && <ListItemText primary={item.text} />}
                </ListItemButton>
              </Tooltip>
            )
          })}
        </List>
      </Drawer>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '0' }}>
        {children}
      </main>
    </div>
  )
}

export default DashNav
