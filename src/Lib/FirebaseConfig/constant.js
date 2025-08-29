export const DB_COLLECTION = {
    USERS : "Users",
    TICKETS : "Tickets",
    DEPARTMENTS : "Departments",
    ATTENDANCE:"Attendance"

}

export const USER_Roles = {
  ADMIN: "ADMIN",
  MANAGER:"MANAGER",
  CEO:"CEO",
  EMPLOYEE: "EMPLOYEE",
  HR:"HR",
  SUBSCRIBER:"SUBSCRIBER"
};

export const TICKET_PRIORITIES = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const TICKET_STATUSES = [
  { label: "Pending", value: "Pending" },
  { label: "In-Progress", value: "In-Progress" },
  { label: "Completed", value: "Completed" },
  { label: "Rejected", value: "Rejected" },
];