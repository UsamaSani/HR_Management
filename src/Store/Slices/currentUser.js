import { createSlice } from "@reduxjs/toolkit";

const initialState = []

const userSlice = createSlice({
  name : "currentUser",
  initialState,
  reducers:{
    currentUser:(state,{payload})=> state = payload ,
    // deleteDe : (state)=> state=null
  }
})

export const {currentUser} = userSlice.actions
export const currentUserReducer = userSlice.reducer