import { createSlice } from "@reduxjs/toolkit";

const initialState = []

const userSlice = createSlice({
  name : "employee",
  initialState,
  reducers:{
    employee:(state,{payload})=> state = payload ,
   deleteEmployee: (state, action) => {
  const idToDelete = action.payload;
  return state.filter(emp => emp.id !== idToDelete);
}
  }
})

export const {employee,deleteEmployee} = userSlice.actions
export const employeeReducer = userSlice.reducer