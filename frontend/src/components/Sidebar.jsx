import React from 'react';
import logo from '../../public/logo.png';
import { frappe } from '../services/frappe';
import {
  LayoutDashboard,
  Sparkles,
  GitBranch,
  CheckCircle2,
  ClipboardList,
  TriangleAlert,
  Package,
  DollarSign,
  FlaskConical,
  Wrench,
  ShieldAlert,
  Microscope,
  BroomSparklesIcon,
  BarChart3,
  Headphones,
  Users,
  LogOutIcon,
  SettingsIcon
} from 'lucide-react';

/**
 * Sidebar Component
 * Navigation sidebar with brand header, nav items, and user profile footer.
 * All navigation state lives in App.jsx and is passed as props.
 */
export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentUser,
  currentUserRole,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleLogout,
  setSelectedWOId,
  showAdminSwitch = false,
  allowedPages = ['*']
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, resetSelectedWO: true },
    { id: 'dashboard-new', label: 'Dashboard New', icon: Sparkles },
    { id: 'workflow', label: 'Business Workflow', icon: GitBranch },
    { id: 'approvals', label: 'Form Approvals', icon: CheckCircle2 },
    { id: 'work-orders', label: 'Work Orders', icon: ClipboardList },
    { id: 'incidents', label: 'Incidents', icon: TriangleAlert },
    { id: 'inventory', label: 'Stock / Inventory', icon: Package },
    { id: 'sales', label: 'Sales Desk', icon: DollarSign },
    { id: 'bom', label: 'BOM Recipes', icon: FlaskConical },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'safety', label: 'Health & Safety', icon: ShieldAlert },
    { id: 'laboratory', label: 'Laboratory', icon: Microscope },
    { id: 'cleaning', label: 'Cleaning & Sanitation', icon: BroomSparklesIcon },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'support', label: 'Support Helpdesk', icon: Headphones },
    { id: 'hr', label: 'Human Resource', icon: Users },
  ];

  const visibleNavItems = (!allowedPages || allowedPages.includes('*'))
    ? navItems
    : navItems.filter(item => allowedPages.includes(item.id));

  return (
    <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand" style={{ gap: '8px', paddingBottom: '16px' }}>
        <img src={logo} alt="Island Chill Logo" style={{ height: '40px', width: 'auto' }} />
        <div>
          <div className="brand-text">Island Chill</div>
          <div className="brand-subtext">Carpenters Water Fiji</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleNavItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab(item.id);
              setMobileMenuOpen(false);
              // Reset selected WO when navigating to Dashboard
              if (item.id === 'dashboard' && setSelectedWOId) {
                setSelectedWOId(null);
              }
            }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              {item.icon && <item.icon size={18} />}
              {item.label}
            </span>
            {item.badge && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {showAdminSwitch && (
          <a className="portal-switch-button" href="/app">
            <span aria-hidden="true"><SettingsIcon style={{ width: '1rem', height: '1rem' }} /></span>
            Switch to ERPNext Admin
          </a>
        )}
        <div className="user-profile" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="avatar">{currentUser.substring(0, 2).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{currentUser}</span>
              <span className="user-role">{currentUserRole}</span>
            </div>
          </div>
          <button onClick={handleLogout} style={{ color: '#ef4444', fontSize: '14px', padding: '4px', backgroundColor: 'transparent', borderColor: 'transparent' }} title="Log Out">
            <LogOutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}
