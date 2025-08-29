import { createSlice } from "@reduxjs/toolkit";

const initialState = []

const userSlice = createSlice({
  name : "dept",
  initialState,
  reducers:{
    department:(state,{payload})=> state = payload ,
    deleteDept : (state)=> state=null
  }
})

export const {department} = userSlice.actions
export const deptReducer = userSlice.reducer