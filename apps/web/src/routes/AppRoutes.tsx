import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { MyProfilePage } from '../pages/MyProfilePage';
import { UsersPage } from '../pages/UsersPage';
import { DepartmentsPage } from '../pages/DepartmentsPage';
import { DesignationsPage } from '../pages/DesignationsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect to dashboard (ProtectedRoute redirects to /login if not authed) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public Only Authentication Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* ── Protected Routes: any authenticated user ─────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/profile" element={<MyProfilePage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/designations" element={<DesignationsPage />} />
      </Route>

      {/* ── Users / Employee Directory ────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              'SUPER_ADMIN',
              'ADMIN',
              'HR_MANAGER',
              'HR_EXECUTIVE',
              'RECRUITER',
              'MANAGER',
              'TEAM_LEAD',
            ]}
          />
        }
      >
        <Route path="/users" element={<UsersPage />} />
      </Route>

      {/* ── Super Admin ───────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route path="/super-admin/dashboard" element={<DashboardPage />} />
      </Route>

      {/* ── Admin ─────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
        <Route path="/admin/dashboard" element={<DashboardPage />} />
      </Route>

      {/* ── HR Routes ─────────────────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE', 'RECRUITER']}
          />
        }
      >
        <Route path="/hr/dashboard" element={<DashboardPage />} />
        <Route path="/hr/employees" element={<DashboardPage />} />
        <Route path="/hr/attendance" element={<DashboardPage />} />
        <Route path="/hr/leave" element={<DashboardPage />} />
      </Route>

      {/* ── Recruiter only ────────────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'RECRUITER']} />
        }
      >
        <Route path="/hr/recruitment" element={<DashboardPage />} />
        <Route path="/hr/candidates" element={<DashboardPage />} />
      </Route>

      {/* ── Finance Routes ────────────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'FINANCE_EXECUTIVE']}
          />
        }
      >
        <Route path="/finance/dashboard" element={<DashboardPage />} />
        <Route path="/finance/payroll" element={<DashboardPage />} />
        <Route path="/finance/expenses" element={<DashboardPage />} />
      </Route>

      {/* ── Manager Routes ────────────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />
        }
      >
        <Route path="/manager/team" element={<DashboardPage />} />
        <Route path="/manager/leave-approvals" element={<DashboardPage />} />
        <Route path="/manager/kpi" element={<DashboardPage />} />
      </Route>

      {/* ── Team Lead Routes ──────────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEAM_LEAD']} />
        }
      >
        <Route path="/team-lead/tasks" element={<DashboardPage />} />
      </Route>

      {/* ── Employee Routes (all designations: SENIOR/JUNIOR/ASSOCIATE/TRAINEE) */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEAM_LEAD', 'EMPLOYEE',
            ]}
          />
        }
      >
        <Route path="/employee/dashboard" element={<DashboardPage />} />
        <Route path="/employee/leave" element={<DashboardPage />} />
        <Route path="/employee/payslip" element={<DashboardPage />} />
        <Route path="/employee/profile" element={<DashboardPage />} />
        <Route path="/employee/timesheet" element={<DashboardPage />} />
      </Route>

      {/* ── Unauthorized ──────────────────────────────────────────────────── */}
      <Route path="/unauthorized" element={<NotFoundPage />} />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

