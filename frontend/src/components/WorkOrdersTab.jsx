import React from 'react';
import { frappe } from '../services/frappe';

export default function WorkOrdersTab({
  woLoading,
  displayedWorkOrders,
  woStatusFilter,
  onStatusFilterChange,
  selectedWOId,
  setSelectedWOId,
  currentPage,
  setCurrentPage,
  totalWOPages,
  setShowNewWODrawer,
  handleDeleteWorkOrder,
  handleCancelWorkOrder,
  WORK_ORDER_STARTABLE_STATUSES,
  WORK_ORDER_ACTIVE_STATUSES,
  JOB_CARD_STARTABLE_STATUSES,
  JOB_CARD_RUNNING_STATUSES,
  JOB_CARD_PAUSED_STATUSES,
  handleStartWorkOrder,
  isWorkOrderReadyForFinish,
  woActionLoading,
  handleFinishWorkOrder,
  handleChangeWorkOrderStatus,
  openJobCardAction,
  setOperatorName,
  currentUser,
  setOperatorRemarks,
  setActiveTimelineJC
}) {
  const conn = frappe.getConnectionSettings();
  const isLiveMode = conn.isLive && conn.connected;

  const [woStockTransactions, setWoStockTransactions] = React.useState({});
  const [loadingTransactions, setLoadingTransactions] = React.useState({});
  const [errorTransactions, setErrorTransactions] = React.useState({});
  const [expandedTransactions, setExpandedTransactions] = React.useState({});

  const loadStockTransactions = React.useCallback(async (woId) => {
    if (!woId) return;
    setLoadingTransactions(prev => ({ ...prev, [woId]: true }));
    setErrorTransactions(prev => ({ ...prev, [woId]: null }));
    try {
      const data = await frappe.getWorkOrderStockTransactions(woId);
      setWoStockTransactions(prev => ({ ...prev, [woId]: data }));
    } catch (err) {
      console.error('Failed to load stock transactions for WO:', woId, err);
      setErrorTransactions(prev => ({ ...prev, [woId]: err.message }));
    } finally {
      setLoadingTransactions(prev => ({ ...prev, [woId]: false }));
    }
  }, []);

  React.useEffect(() => {
    if (selectedWOId && !woStockTransactions[selectedWOId] && !loadingTransactions[selectedWOId]) {
      loadStockTransactions(selectedWOId);
    }
  }, [selectedWOId, loadStockTransactions, woStockTransactions, loadingTransactions]);

  return (
              <div className="wo-tab-container">
            <div className="wo-tab-header">
              <div className="tab-title-desc">
                <h2>Production Work Orders & Execution</h2>
                <p>Manage scheduling, job card statuses, and bottling operations checklist.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {isLiveMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Status:</label>
                    <select
                      value={woStatusFilter || 'All'}
                      onChange={(e) => onStatusFilterChange(e.target.value)}
                      className="form-input"
                      style={{ padding: '6px 12px', width: '170px', margin: 0, fontSize: '12px', height: '36px' }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Not Started">Not Started</option>
                      <option value="In Process">In Process</option>
                      <option value="Stock Reserved">Stock Reserved</option>
                      <option value="Stock Partially Reserved">Stock Partially Reserved</option>
                      <option value="Completed">Completed</option>
                      <option value="Stopped">Stopped</option>
                      <option value="Closed">Closed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
                <button className="primary-btn" onClick={() => setShowNewWODrawer(true)}>
                  Create Work Order
                </button>
              </div>
            </div>

            <div className="wo-grid">
              {woLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading Work Orders from ERPNext...
                </div>
              ) : displayedWorkOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No Work Orders found.
                </div>
              ) : (
                displayedWorkOrders.map(wo => {
                  const isSelected = selectedWOId === wo.id;
                  let pct = 0;
                  if (wo.status === 'Completed') {
                    pct = 100;
                  } else if (wo.jobCards && wo.jobCards.length > 0) {
                    const completed = wo.jobCards.filter(jc => jc.status === 'Completed').length;
                    pct = (completed / wo.jobCards.length) * 100;
                  }

                  return (
                    <div key={wo.id} className="wo-card-container">
                      <div className="wo-card-header">
                        <div className="wo-card-title-block">
                          <div className="wo-card-icon">🏭</div>
                          <div className="wo-card-id-block">
                            <h3>{wo.id}</h3>
                            <p>{wo.productName || wo.product}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`badge badge-${wo.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {wo.status}
                          </span>
                          {WORK_ORDER_STARTABLE_STATUSES.includes(wo.status) && (
                            <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleStartWorkOrder(wo.id)}>
                              Start Run
                            </button>
                          )}
                          {isWorkOrderReadyForFinish(wo) && (
                            <button
                              className="primary-btn"
                              style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                              disabled={woActionLoading}
                              onClick={() => handleFinishWorkOrder(wo)}
                            >
                              Finish WO
                            </button>
                          )}
                          {wo.status === 'Stopped' && (
                            <button
                              className="secondary-btn"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              disabled={woActionLoading}
                              onClick={() => handleChangeWorkOrderStatus(wo, 'Resumed')}
                            >
                              Re-open
                            </button>
                          )}
                          {!['Closed', 'Completed', 'Stopped', 'Cancelled'].includes(wo.status) && (
                            <button
                              className="secondary-btn"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              disabled={woActionLoading}
                              onClick={() => handleChangeWorkOrderStatus(wo, 'Stopped')}
                            >
                              Stop
                            </button>
                          )}
                          {wo.status !== 'Closed' && !['Draft', 'Cancelled'].includes(wo.status) && (
                            <button
                              className="secondary-btn"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              disabled={woActionLoading}
                              onClick={() => handleChangeWorkOrderStatus(wo, 'Closed')}
                            >
                              Close
                            </button>
                          )}
                          <button
                            className="secondary-btn"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => setSelectedWOId(isSelected ? null : wo.id)}
                          >
                            {isSelected ? 'Collapse' : 'Show Operations'}
                          </button>
                          {wo.status !== 'Cancelled' && (
                            <button
                              className="secondary-btn"
                              title="Cancel Work Order"
                              style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                              onClick={() => handleCancelWorkOrder(wo.id)}
                            >
                              🚫 Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="wo-metadata-grid">
                        <div className="metadata-item">
                          <span className="metadata-label">Filling Line</span>
                          <span className="metadata-value">{wo.lineNo}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Batch Size</span>
                          <span className="metadata-value">{Number(wo.quantity).toFixed(2)} Box</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Produced Qty</span>
                          <span className="metadata-value">{Number(wo.produced || 0).toFixed(2)} Box</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Planned Start</span>
                          <span className="metadata-value">{wo.plannedStart}</span>
                        </div>
                      </div>

                      <div className="wo-progress-section">
                        <div className="progress-info">
                          <span>Work Order Progress Status</span>
                          <span>{pct.toFixed(2)}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="job-cards-section">
                          <h4 className="section-subtitle">Operational Job Cards ({wo.jobCards ? wo.jobCards.length : 0})</h4>

                          {(!wo.jobCards || wo.jobCards.length === 0) ? (
                            <p className="text-muted" style={{ fontSize: '13px', padding: '10px 0' }}>
                              No Job Cards found for this Work Order. If this is a new WO, click <strong>"Start Run"</strong> to issue materials and auto-generate job cards from the BOM operations. If the BOM has no operations defined, no job cards will be created in ERPNext.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {wo.jobCards.map((jc, index) => (
                                <div key={jc.id} className="jc-item-row" style={{ gridTemplateColumns: '50px 1.8fr 1fr 1fr 2.2fr' }}>
                                  <div className="jc-index">{(index + 1).toString().padStart(2, '0')}</div>
                                  <div className="jc-op-details">
                                    <h4>{jc.operation}</h4>
                                    <p>{jc.station} {jc.status !== 'Completed' && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({jc.status})</span>}</p>
                                    {(() => {
                                      let start = jc.actualStartTime || '';
                                      let end = jc.actualEndTime || '';
                                      if (jc.remarksList) {
                                        for (let i = jc.remarksList.length - 1; i >= 0; i--) {
                                          const log = jc.remarksList[i];
                                          if (log.actualStartTime && !start) start = log.actualStartTime;
                                          if (log.actualEndTime && !end) end = log.actualEndTime;
                                        }
                                      }
                                      if (start || end) {
                                        return (
                                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            {start && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><strong>Start:</strong> {start.replace('T', ' ')}</span>}
                                            {end && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><strong>End:</strong> {end.replace('T', ' ')}</span>}
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>

                                  <div className="jc-operator-log text-muted">
                                    {jc.operator ? (
                                      <span>👤 {jc.operator}</span>
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </div>

                                  <div className="jc-status-badge">
                                    <span className={`badge badge-${jc.status.toLowerCase().replace(' ', '-')}`}>
                                      {jc.status}
                                    </span>
                                  </div>

                                  {/* Dynamic actions block matching work order.png */}
                                  <div className="jc-actions" style={{ gap: '4px' }}>
                                    {/* Action: Start */}
                                    {/* {jc.status === 'Not Started' && wo.status === 'In Progress' && ( */}
                                    {JOB_CARD_STARTABLE_STATUSES.includes(jc.status) && (WORK_ORDER_ACTIVE_STATUSES.includes(wo.status) || wo.materialTransferred) && (
                                      <button
                                        className="action-btn-small start"
                                        onClick={() => openJobCardAction(wo, jc, 'start')}
                                      >
                                        ▶ Start
                                      </button>
                                    )}

                                    {/* Actions: Pause, Finish */}
                                    {JOB_CARD_RUNNING_STATUSES.includes(jc.status) && (WORK_ORDER_ACTIVE_STATUSES.includes(wo.status) || wo.materialTransferred) && (
                                      <>
                                        <button
                                          className="action-btn-small"
                                          style={{ backgroundColor: 'var(--warning)', color: '#111' }}
                                          onClick={() => openJobCardAction(wo, jc, 'pause')}
                                        >
                                          ⏸ Pause
                                        </button>
                                        <button
                                          className="action-btn-small complete"
                                          onClick={() => openJobCardAction(wo, jc, 'finish')}
                                        >
                                          ✓ Finish
                                        </button>
                                      </>
                                    )}

                                    {/* Actions: Resume, Finish, Add Remarks */}
                                    {JOB_CARD_PAUSED_STATUSES.includes(jc.status) && (WORK_ORDER_ACTIVE_STATUSES.includes(wo.status) || wo.materialTransferred) && (
                                      <>
                                        <button
                                          className="action-btn-small start"
                                          onClick={() => openJobCardAction(wo, jc, 'resume')}
                                        >
                                          ▶ Resume
                                        </button>
                                        <button
                                          className="action-btn-small complete"
                                          onClick={() => openJobCardAction(wo, jc, 'finish')}
                                        >
                                          ✓ Finish
                                        </button>
                                      </>
                                    )}

                                    {/* Done Indicator */}
                                    {jc.status === 'Completed' && (
                                      <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '12px', marginRight: '6px' }}>✓ Done</span>
                                    )}

                                    {/* Action: Remarks (Unified entrypoint for viewing history and adding new remarks) */}
                                    <button
                                      className="action-btn-small remarks"
                                      style={{ padding: '6px 8px' }}
                                      onClick={() => {
                                        setOperatorName(jc.operator || currentUser || '');
                                        setOperatorRemarks('');
                                        setActiveTimelineJC({ woId: wo.id, jcId: jc.id, operation: jc.operation });
                                      }}
                                    >
                                      💬 Remarks
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Stock Transactions Section */}
                          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h4 className="section-subtitle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📦 Stock Transactions</span>
                                {woStockTransactions[wo.id] && (
                                  <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '12px' }}>
                                    {woStockTransactions[wo.id].length}
                                  </span>
                                )}
                              </h4>
                              <button
                                className="secondary-btn"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                                onClick={() => loadStockTransactions(wo.id)}
                                disabled={loadingTransactions[wo.id]}
                              >
                                {loadingTransactions[wo.id] ? 'Refreshing...' : '🔄 Refresh Transactions'}
                              </button>
                            </div>

                            {loadingTransactions[wo.id] && (
                              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                Loading stock transactions...
                              </div>
                            )}

                            {errorTransactions[wo.id] && (
                              <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Error loading stock transactions: {errorTransactions[wo.id]}</span>
                                <button className="primary-btn" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => loadStockTransactions(wo.id)}>
                                  Retry
                                </button>
                              </div>
                            )}

                            {!loadingTransactions[wo.id] && !errorTransactions[wo.id] && (!woStockTransactions[wo.id] || woStockTransactions[wo.id].length === 0) && (
                              <p className="text-muted" style={{ fontSize: '13px', padding: '10px 0' }}>
                                No stock transactions recorded for this Work Order. Click <strong>"Start Run"</strong> to transfer materials to WIP or <strong>"Finish WO"</strong> upon manufacturing completion.
                              </p>
                            )}

                            {!loadingTransactions[wo.id] && woStockTransactions[wo.id] && woStockTransactions[wo.id].length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {woStockTransactions[wo.id].map(entry => {
                                  const isTxExpanded = !!expandedTransactions[entry.name];
                                  return (
                                    <div
                                      key={entry.name}
                                      style={{
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      <div
                                        style={{
                                          padding: '10px 14px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          cursor: 'pointer',
                                          backgroundColor: isTxExpanded ? 'rgba(245, 158, 11, 0.04)' : 'transparent'
                                        }}
                                        onClick={() => setExpandedTransactions(prev => ({ ...prev, [entry.name]: !prev[entry.name] }))}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <span style={{ fontSize: '11px', transform: isTxExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s', color: 'var(--text-muted)' }}>▶</span>
                                          <div>
                                            <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{entry.name}</strong>
                                            <span style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                              {entry.stock_entry_type}
                                            </span>
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {entry.posting_date} {entry.posting_time}
                                          </span>
                                          <span
                                            className="badge"
                                            style={{
                                              backgroundColor: entry.docstatus === 1 ? 'rgba(16, 185, 129, 0.15)' : entry.docstatus === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                              color: entry.docstatus === 1 ? 'var(--success)' : entry.docstatus === 0 ? 'var(--warning)' : 'var(--danger)',
                                              fontSize: '10px',
                                              padding: '2px 8px',
                                              borderRadius: '4px'
                                            }}
                                          >
                                            {entry.status || (entry.docstatus === 1 ? 'Submitted' : entry.docstatus === 0 ? 'Draft' : 'Cancelled')}
                                          </span>
                                        </div>
                                      </div>

                                      {isTxExpanded && (
                                        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-content)', fontSize: '12px' }}>
                                          <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                            {entry.from_warehouse && (
                                              <span><strong>Source:</strong> {entry.from_warehouse}</span>
                                            )}
                                            {entry.to_warehouse && (
                                              <span><strong>Target:</strong> {entry.to_warehouse}</span>
                                            )}
                                            {entry.total_outgoing_value > 0 && (
                                              <span><strong>Outgoing Value:</strong> ${Number(entry.total_outgoing_value).toFixed(2)}</span>
                                            )}
                                            {entry.total_incoming_value > 0 && (
                                              <span><strong>Incoming Value:</strong> ${Number(entry.total_incoming_value).toFixed(2)}</span>
                                            )}
                                          </div>

                                          {entry.items && entry.items.length > 0 ? (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px' }}>
                                              <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
                                                  <th style={{ padding: '6px 8px' }}>Item</th>
                                                  <th style={{ padding: '6px 8px' }}>Qty</th>
                                                  <th style={{ padding: '6px 8px' }}>UOM</th>
                                                  <th style={{ padding: '6px 8px' }}>From</th>
                                                  <th style={{ padding: '6px 8px' }}>To</th>
                                                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Rate / Amount</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {entry.items.map(item => (
                                                  <tr key={item.name || item.item_code} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '6px 8px' }}>
                                                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.item_code}</div>
                                                      {item.item_name && item.item_name !== item.item_code && (
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.item_name}</div>
                                                      )}
                                                    </td>
                                                    <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{Number(item.qty || item.transfer_qty || 0).toFixed(2)}</td>
                                                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{item.uom || item.stock_uom}</td>
                                                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)', fontSize: '11px' }}>{item.s_warehouse || '-'}</td>
                                                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)', fontSize: '11px' }}>{item.t_warehouse || '-'}</td>
                                                    <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                                      {item.basic_rate ? `$${Number(item.basic_rate).toFixed(2)}` : ''}
                                                      {item.amount ? ` ($${Number(item.amount).toFixed(2)})` : ''}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          ) : (
                                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No item details recorded in this entry.</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
              <button
                className="secondary-btn"
                disabled={currentPage === 1 || woLoading}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                ◀ Previous
              </button>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                Page {currentPage} of {totalWOPages}
              </span>
              <button
                className="secondary-btn"
                disabled={currentPage === totalWOPages || woLoading}
                onClick={() => setCurrentPage(prev => Math.min(totalWOPages, prev + 1))}
              >
                Next ▶
              </button>
            </div>
          </div>
  );
}