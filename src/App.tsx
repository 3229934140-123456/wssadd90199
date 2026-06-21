import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Members from "@/pages/Members";
import Recharge from "@/pages/Recharge";
import Consume from "@/pages/Consume";
import Refund from "@/pages/Refund";
import Settings from "@/pages/Settings";
import AuditLog from "@/pages/AuditLog";
import StoreSettlement from "@/pages/StoreSettlement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/recharge" element={<Recharge />} />
          <Route path="/consume" element={<Consume />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/settlement" element={<StoreSettlement />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
