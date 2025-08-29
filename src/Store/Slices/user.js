import { createSlice } from "@reduxjs/toolkit";

const initialState = {userId:null}

const userSlice = createSlice({
  name : "user",
  initialState,
  reducers:{
    loginUser:(state,{payload})=>{
      state.userId = payload
    },
    signoutUser:(state)=>{
      state.userId = null
    },
  }
})

export const {loginUser,signoutUser} = userSlice.actions
export const userReducer = userSlice.reducer