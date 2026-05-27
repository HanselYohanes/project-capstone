import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

// ─── Static sample data ──────────────────────────────────────────────────────
const RECENT_ROWS = [
  { id: 'V-8821', entity: 'Indomaret Point', district: 'Cilandak', rule: '< 400m from Pasar', ruleColor: 'bg-error', statusLabel: 'Critical', statusClass: 'bg-error-container text-error outline-error/20' },
  { id: 'V-8820', entity: 'Alfamart Express', district: 'Tebet', rule: '< 400m from Pasar', ruleColor: 'bg-error', statusLabel: 'Critical', statusClass: 'bg-error-container text-error outline-error/20' },
  { id: 'V-8819', entity: 'Lawson', district: 'Kebayoran Baru', rule: '< 100m from Minimarket', ruleColor: 'bg-tertiary', statusLabel: 'Warning', statusClass: 'bg-tertiary-container/30 text-tertiary outline-tertiary/20' },
  { id: 'V-8818', entity: 'FamilyMart', district: 'Setiabudi', rule: 'Zone Capacity Exceeded', ruleColor: 'bg-tertiary', statusLabel: 'Warning', statusClass: 'bg-tertiary-container/30 text-tertiary outline-tertiary/20' },
  { id: 'V-8817', entity: 'Circle K', district: 'Pancoran', rule: 'Resolved Post-Audit', ruleColor: 'bg-[#10B981]', statusLabel: 'Resolved', statusClass: 'bg-secondary-container text-on-surface outline-outline-variant/30' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const ViolationsTable = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Track which row's dropdown is open (null = none)
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleDropdown = (id) =>
    setOpenDropdown(prev => (prev === id ? null : id));

  return (
    <div className="bg-surface-container-high/70 backdrop-blur-md outline outline-1 outline-outline-variant/20 rounded-xl overflow-hidden">

      <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
        <h2 className="font-headline font-bold text-lg">Recent Violations</h2>
        <button
          onClick={() => navigate("/violations")}
          className="text-xs text-primary hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-md outline outline-1 outline-outline-variant/30 flex items-center gap-1"
        >
          View All
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </button>
      </div>

      <div className="overflow-x-auto" ref={dropdownRef}>
        <table className="w-full text-left border-collapse">

          <thead>
            <tr className="text-xs text-on-surface-variant uppercase tracking-wider bg-surface-container-lowest/50">
              <th className="px-6 py-4 font-medium">ID</th>
              <th className="px-6 py-4 font-medium">Entity Name</th>
              <th className="px-6 py-4 font-medium">District</th>
              <th className="px-6 py-4 font-medium">Proximity Rule</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>

          <tbody className="text-sm divide-y divide-outline-variant/10">
            {RECENT_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-number text-on-surface-variant">#{row.id}</td>
                <td className="px-6 py-4 font-medium text-on-surface">{row.entity}</td>
                <td className="px-6 py-4 text-on-surface-variant">{row.district}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${row.ruleColor}`} />
                    <span className="font-number">{row.rule}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium outline outline-1 ${row.statusClass}`}>
                    {row.statusLabel}
                  </span>
                </td>

                {/* ── Action cell with dropdown ── */}
                <td className="px-6 py-4 text-right relative">
                  <button
                    onClick={() => toggleDropdown(row.id)}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>

                  {openDropdown === row.id && (
                    <div className="absolute right-4 top-full mt-1 z-50 min-w-[160px] bg-surface-container rounded-lg shadow-xl border border-outline-variant/20 py-1 text-left">

                      {/* View Details — visible to ALL users */}
                      <button
                        onClick={() => { navigate('/violations'); setOpenDropdown(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-white/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px] text-on-surface-variant">open_in_new</span>
                        View Details
                      </button>

                      {/* Edit & Delete — Admin only */}
                      {user?.isAdmin && (
                        <>
                          <div className="my-1 border-t border-outline-variant/15" />
                          <button
                            onClick={() => { alert(`Edit: #${row.id}`); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                            Edit
                          </button>
                          <button
                            onClick={() => { alert(`Hapus: #${row.id}`); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                            Delete
                          </button>
                        </>
                      )}

                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default ViolationsTable;