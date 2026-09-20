'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search, AlertCircle, CheckCircle, Key } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

export default function TenantStaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New staff form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
  });

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/tenant/staff');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load staff list');
      setStaffList(data.staff || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaff();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStaff]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/tenant/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create staff member');

      setSuccessMsg(`Staff member ${data.staff.name} (${data.staff.role}) created successfully!`);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'CASHIER' });
      fetchStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setError('');
      setSuccessMsg('');
      const res = await fetch('/api/tenant/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update staff status');

      setSuccessMsg(`Staff status updated to ${newStatus}.`);
      fetchStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalStaff = staffList.length;
  const totalCashiers = staffList.filter((s) => s.role === 'CASHIER').length;
  const totalAdmins = staffList.filter((s) => s.role === 'STORE_ADMIN' || s.role === 'STORE_OWNER').length;
  const activeCount = staffList.filter((s) => s.status === 'ACTIVE').length;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'STORE_OWNER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Store Owner</span>;
      case 'STORE_ADMIN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">Store Admin</span>;
      case 'CASHIER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Cashier</span>;
      case 'STAFF':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Staff</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Store Staff & Cashiers
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage access permissions, cashiers, and store administrators for this store.
          </p>
        </div>
        <Button
          onClick={() => {
            setError('');
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <span className="text-[11px] font-medium text-neutral-400">Total Staff</span>
          <p className="text-xl font-bold text-neutral-100 mt-1">{totalStaff}</p>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <span className="text-[11px] font-medium text-neutral-400">Active Accounts</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <span className="text-[11px] font-medium text-neutral-400">Cashiers</span>
          <p className="text-xl font-bold text-sky-400 mt-1">{totalCashiers}</p>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <span className="text-[11px] font-medium text-neutral-400">Store Management</span>
          <p className="text-xl font-bold text-purple-400 mt-1">{totalAdmins}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'CASHIER', 'STORE_ADMIN', 'STAFF'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Added Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    Loading staff members...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    No staff members found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isOwner = staff.role === 'STORE_OWNER';
                  return (
                    <tr key={staff.userId} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-neutral-300 text-xs">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-neutral-200">{staff.name}</div>
                            <div className="text-[11px] text-neutral-500 font-mono">{staff.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(staff.role)}</td>
                      <td className="py-3.5 px-4">
                        {staff.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-neutral-500 font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-600"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                        {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isOwner && (
                          <button
                            onClick={() => handleToggleStatus(staff.userId, staff.status)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                              staff.status === 'ACTIVE'
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                            }`}
                          >
                            {staff.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {isOwner && (
                          <span className="text-[10px] text-neutral-500 italic">Primary Account</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-semibold text-neutral-100 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Add New Staff Member
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Login Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@store.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Initial Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Assigned Role <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="CASHIER">CASHIER (Fast POS Billing & Customer Search)</option>
                  <option value="STORE_ADMIN">STORE ADMIN (Products, Inventory, Billing & Reports)</option>
                  <option value="STAFF">STAFF (General Store Associate)</option>
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Cashiers have full access to POS billing, but cannot alter store settings, import products, or write off damaged stock.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-neutral-700 text-neutral-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  {submitting ? 'Creating...' : 'Create Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
