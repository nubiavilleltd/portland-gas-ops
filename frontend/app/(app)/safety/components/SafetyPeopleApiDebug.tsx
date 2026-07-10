"use client";

import { useEffect } from "react";
import api from "@/lib/api";

const departmentValues = [
  "Operations",
  "Finance",
  "HSE",
  "HR",
  "IT",
  "Logistics",
  "Executive",
  "Engineering",
  "Procurement",
  "Admin",
];

function logApiResult(label: string, result: PromiseSettledResult<unknown>) {
  if (result.status === "fulfilled") {
    console.log(`[Safety people debug] ${label}`, result.value);
    return;
  }

  console.warn(`[Safety people debug] ${label} failed`, result.reason);
}

export default function SafetyPeopleApiDebug() {
  useEffect(() => {
    async function loadPeopleApis() {
      const [departments, actors, hseActors, employees, users] = await Promise.allSettled([
        api.get("/api/safety/actors/departments").then((response) => response.data),
        api.get("/api/safety/actors").then((response) => response.data),
        api
          .get("/api/safety/actors", { params: { department: "HSE" } })
          .then((response) => response.data),
        api
          .get("/api/employees/", { params: { limit: 20 } })
          .then((response) => response.data),
        api.get("/api/users/", { params: { limit: 20 } }).then((response) => response.data),
      ]);

      console.log("[Safety people debug] department enum values", departmentValues);
      logApiResult("safety departments", departments);
      logApiResult("safety actors", actors);
      logApiResult("HSE safety actors", hseActors);
      logApiResult("employees", employees);
      logApiResult("users", users);
    }

    loadPeopleApis();
  }, []);

  return null;
}
