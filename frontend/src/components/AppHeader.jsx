import React from 'react';
import { frappe } from '../services/frappe';
import {
  Bell,
  Settings,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Headphones,
  X
} from 'lucide-react';

/**
 * AppHeader Component
 * Top header bar with welcome message, search, notification bell, and live clock.
 */
export default function AppHeader({
  currentUser,
  currentTime,
  showSearch = false,
  searchQuery,
  setSearchQuery,
  showNotifications,
  setShowNotifications,
  lowStockCount,
  inventory,
  tickets,
  setCurrentTab,
  setShowSettingsModal,
  setSettingsUrl,
  setSettingsApiKey,
  setSettingsApiSecret,
  setSyncStatusMsg
}) {
  const handleOpenSettings = () => {
    const conn = frappe.getConnectionSettings();
    setSettingsUrl(conn.url || 'https://demo.erpnext.com');
    setSettingsApiKey(conn.apiKey || '');
    setSettingsApiSecret(conn.apiSecret || '');
    setSyncStatusMsg('');
    setShowSettingsModal(true);
  };

  return (
    <header className="app-header">
      <div className="header-welcome">
        <h1>Welcome back, {currentUser.split(' ')[0]} 👋</h1>
        <p>Bottling Shop Floor Status.</p>
      </div>

      <div className="header-actions">
        {showSearch && (
          <div className="header-search">
            <svg className="header-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <input
              type="search"
              aria-label="Search work orders by ID, item code, or item name"
              placeholder="Search work orders, items..."
              className="header-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Bell size={18} />
            {lowStockCount > 0 && <span className="bell-badge">{lowStockCount}</span>}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Alerts & Messages</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="notification-body">
                {/* Low Stock Items */}
                {Object.keys(inventory).filter(key => inventory[key].qty < inventory[key].minLevel).length > 0 ? (
                  Object.keys(inventory).filter(key => inventory[key].qty < inventory[key].minLevel).map(key => (
                    <div key={key} className="notification-item warning" onClick={() => { setCurrentTab('inventory'); setShowNotifications(false); }}>
                      <span className="notification-icon" style={{ display: 'inline-flex', color: 'var(--warning, #f59e0b)' }}>
                        <AlertTriangle size={18} />
                      </span>
                      <div className="notification-info">
                        <div className="notification-title">Low Stock: {inventory[key].name}</div>
                        <div className="notification-text">Current qty is {inventory[key].qty} {inventory[key].unit} (Threshold: {inventory[key].minLevel})</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-item success">
                    <span className="notification-icon" style={{ display: 'inline-flex', color: 'var(--success, #10b981)' }}>
                      <CheckCircle2 size={18} />
                    </span>
                    <div className="notification-info">
                      <div className="notification-title">Stock Levels Normal</div>
                      <div className="notification-text">No items are running below reorder levels.</div>
                    </div>
                  </div>
                )}
                {/* Recent Support Tickets */}
                {tickets && tickets.slice(0, 2).map(tkt => (
                  <div key={tkt.name} className="notification-item info" onClick={() => { setCurrentTab('support'); setShowNotifications(false); }}>
                    <span className="notification-icon" style={{ display: 'inline-flex', color: 'var(--info, #3b82f6)' }}>
                      <Headphones size={18} />
                    </span>
                    <div className="notification-info">
                      <div className="notification-title">Support Desk: {tkt.name}</div>
                      <div className="notification-text">{tkt.subject} (Customer: {tkt.customer})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          className="notification-bell"
          onClick={handleOpenSettings}
          title="ERPNext Connection Settings"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Settings size={18} />
        </button>

        {/* Date/Time Display */}
        <div className="date-selector" title={`Time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}>
          <Calendar size={15} />
          <span>
            {currentTime.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })} {currentTime.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        </div>
      </div>
    </header>
  );
}
