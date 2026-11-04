import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import IncidentMarkerSection from './IncidentMarkerSection';

/**
 * DailyMaintenanceChecklistModal
 * Common modal used in both the Maintenance Tab and the Work Orders Tab
 * to fill and submit Daily Preventive Maintenance Checklists.
 */
export default function DailyMaintenanceChecklistModal({
  isOpen,
  onClose,
  template,
  workOrders = [],
  initialWorkOrder = '',
  isWorkOrderRequired = false,
  initialWeekNo = '',
  initialFromDate = '',
  initialToDate = '',
  employeeList = [],
  handleSearchEmployees,
  currentUser = '',
  onSave,
}) {
  if (!isOpen || !template) return null;

  const tasks = template.tasks || [];

  // Compute current week number & dates if not provided
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const defaultWeekNo = String(Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7));
  const defaultTodayStr = now.toISOString().slice(0, 10);

  const [workOrder, setWorkOrder] = useState(initialWorkOrder || '');
  const [weekNo, setWeekNo] = useState(initialWeekNo || defaultWeekNo);
  const [fromDate, setFromDate] = useState(initialFromDate || defaultTodayStr);
  const [toDate, setToDate] = useState(initialToDate || defaultTodayStr);

  const [checkgrid, setCheckgrid] = useState({});
  const [remarks, setRemarks] = useState({});
  const [stdTimes, setStdTimes] = useState({});
  const [overallComments, setOverallComments] = useState('');

  const [operator, setOperator] = useState('');
  const [operatorDisplay, setOperatorDisplay] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [supervisorDisplay, setSupervisorDisplay] = useState('');

  const [activeDropdown, setActiveDropdown] = useState(null); // 'operator' | 'supervisor' | null
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [isIncident, setIsIncident] = useState(false);
  const [incidentSeverity, setIncidentSeverity] = useState('Medium');
  const [incidentNote, setIncidentNote] = useState('');

  // Initialize checklist grids on template change
  useEffect(() => {
    const initialGrid = {};
    const initialRem = {};
    const initialStd = {};

    tasks.forEach((task, idx) => {
      initialGrid[idx] = false;
      initialRem[idx] = '';
      initialStd[idx] = parseInt(task.std) || 0;
    });

    setCheckgrid(initialGrid);
    setRemarks(initialRem);
    setStdTimes(initialStd);
    setWorkOrder(initialWorkOrder || '');
    setWeekNo(initialWeekNo || defaultWeekNo);
    setFromDate(initialFromDate || defaultTodayStr);
    setToDate(initialToDate || defaultTodayStr);
    setOverallComments('');
    setOperator(currentUser || '');
    setOperatorDisplay(currentUser || '');
    setSupervisor('');
    setSupervisorDisplay('');
    setValidationError('');
    setIsIncident(false);
    setIncidentSeverity('Medium');
    setIncidentNote('');
  }, [template, initialWorkOrder, initialWeekNo, initialFromDate, initialToDate]);

  const allChecked = tasks.length > 0 && tasks.every((_, idx) => !!checkgrid[idx]);
  const completedCount = Object.values(checkgrid).filter(Boolean).length;

  const handleToggleSelectAll = (checked) => {
    const updated = {};
    tasks.forEach((_, idx) => {
      updated[idx] = checked;
    });
    setCheckgrid(updated);
  };

  const extractEmployeeId = (val) => {
    if (!val) return '';
    const match = val.match(/\(([^)]+)\)/);
    return match ? match[1] : val;
  };

  const resolveEmployeeId = (val, defaultVal) => {
    const extracted = extractEmployeeId(val);
    if (!extracted) return defaultVal;
    const searchVal = extracted.toLowerCase().trim();
    const found = (employeeList || []).find(emp => {
      const empName = (emp.employee_name || emp.name || '').toLowerCase();
      const empId = (emp.name || '').toLowerCase();
      const initials = empName.split(' ').map(n => n[0]).join('');
      return empName === searchVal || empId === searchVal || initials === searchVal;
    });
    return found ? found.name : defaultVal;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (isWorkOrderRequired && !workOrder) {
      setValidationError('Work Order ID is required.');
      return;
    }
    if (workOrder) {
      const woObj = workOrders.find(w => w.id === workOrder || w.name === workOrder);
      if (woObj?.status === 'Cancelled') {
        setValidationError(`Work Order ${workOrder} is Cancelled. Maintenance checklists cannot be submitted for cancelled work orders.`);
        return;
      }
    }
    if (!operator && !operatorDisplay) {
      if (currentUser) {
        setOperator(currentUser);
        setOperatorDisplay(currentUser);
      } else {
        setValidationError('Technician / Operator is required.');
        return;
      }
    }

    const resolvedOp = resolveEmployeeId(operatorDisplay, operator || extractEmployeeId(operatorDisplay)) || operatorDisplay || currentUser;
    const resolvedSup = resolveEmployeeId(supervisorDisplay, supervisor || extractEmployeeId(supervisorDisplay)) || supervisor || '';

    const updatedTasks = tasks.map((task, tIdx) => {
      const customStd = stdTimes[tIdx] !== undefined ? stdTimes[tIdx] : (parseInt(task.std) || 0);
      return {
        ...task,
        std: customStd,
      };
    });

    const formData = {
      template,
      templateId: template.id,
      equipment: template.equipment,
      area: template.area,
      workOrder: workOrder,
      work_order: workOrder,
      name: template.name,
      weekNo: weekNo,
      fromDate: fromDate,
      toDate: toDate,
      operator: resolvedOp,
      operatorDisplay: operatorDisplay || resolvedOp,
      supervisor: resolvedSup,
      supervisorDisplay: supervisorDisplay || resolvedSup,
      workflow_state: 'Pending Verification',
      docstatus: 0,
      status: 'Pending Verification',
      checkgrid: checkgrid,
      remarks: remarks,
      stdTimes: stdTimes,
      overallComments: overallComments,
      totalChecked: completedCount,
      tasks: updatedTasks,
      is_incident: isIncident ? 1 : 0,
      incident_severity: incidentSeverity,
      incident_note: incidentNote,
    };

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
    } catch (err) {
      setValidationError(err.message || 'Failed to save maintenance checklist.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={onClose}>
      <div className="modal-panel" style={{ width: '920px', maxWidth: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Carpenters Water Fiji PTE Limited</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Preventive Maintenance Schedule</span>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content" style={{ maxHeight: '75vh', overflowY: 'auto', overflowX: 'hidden' }}>

            {validationError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', marginBottom: '12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '12px', fontWeight: 600 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Top metadata input: 2 rows of 3 columns each to prevent horizontal overflow */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Equipment</label>
                <input
                  type="text"
                  className="form-input"
                  value={template.equipment || ''}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Area</label>
                <input
                  type="text"
                  className="form-input"
                  value={template.area || ''}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px', color: isWorkOrderRequired ? 'var(--accent)' : undefined }}>
                  Work Order ID {isWorkOrderRequired && <span style={{ color: 'var(--danger)' }}>*</span>}
                </label>
                <select
                  className="form-input"
                  value={workOrder}
                  onChange={e => setWorkOrder(e.target.value)}
                  required={isWorkOrderRequired}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="">{isWorkOrderRequired ? '— Select Work Order —' : 'Select Work Order (Optional)'}</option>
                  {workOrders.filter(wo => (wo.status || '').toLowerCase() !== 'cancelled').map(wo => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} — {wo.productName || wo.product || wo.item} {wo.status ? `[${wo.status}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>WEEK NO</label>
                <input
                  type="text"
                  className="form-input"
                  value={weekNo}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>From</label>
                <input
                  type="date"
                  className="form-input"
                  value={fromDate}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>To</label>
                <input
                  type="date"
                  className="form-input"
                  value={toDate}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Checklist Grid Table */}
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)' }}>
                    <th style={{ width: '40px', padding: '6px', textAlign: 'center' }}>Sr.No</th>
                    <th style={{ minWidth: '220px', padding: '6px', textAlign: 'left' }}>Description</th>
                    <th style={{ width: '75px', padding: '6px', textAlign: 'center' }}>Std Time</th>
                    <th style={{ width: '100px', padding: '6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span>Completed</span>
                        <label style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontWeight: 'normal' }}>
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={e => handleToggleSelectAll(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>Select All</span>
                        </label>
                      </div>
                    </th>
                    <th style={{ minWidth: '150px', padding: '6px', textAlign: 'left' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, tIdx) => (
                    <tr key={task.id || tIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ textAlign: 'center', padding: '6px', fontWeight: '600' }}>{task.id || tIdx + 1}</td>
                      <td style={{ padding: '6px', fontWeight: '500' }}>{task.desc || task.description}</td>
                      <td style={{ textAlign: 'center', padding: '4px' }}>
                        <select
                          className="form-input"
                          style={{ padding: '2px 4px', fontSize: '11px', height: '26px', width: '70px', textAlign: 'center' }}
                          value={stdTimes[tIdx] !== undefined ? stdTimes[tIdx] : (parseInt(task.std) || 0)}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setStdTimes(prev => ({ ...prev, [tIdx]: val }));
                          }}
                        >
                          <option value={0}>-</option>
                          <option value={1}>1 min</option>
                          <option value={2}>2 min</option>
                          <option value={3}>3 min</option>
                          <option value={4}>4 min</option>
                          <option value={5}>5 min</option>
                          <option value={10}>10 min</option>
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                          <option value={90}>90 min</option>
                          <option value={120}>120 min</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px' }}>
                        <input
                          type="checkbox"
                          checked={!!checkgrid[tIdx]}
                          onChange={e => {
                            const checked = e.target.checked;
                            setCheckgrid(prev => ({ ...prev, [tIdx]: checked }));
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Remarks/Observations"
                          style={{ padding: '4px 8px', fontSize: '11px', height: '28px', width: '100%', boxSizing: 'border-box' }}
                          value={remarks[tIdx] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setRemarks(prev => ({ ...prev, [tIdx]: val }));
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Overall Comments */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600' }}>Overall Comments / Remarks</label>
              <textarea
                className="form-input"
                style={{ minHeight: '50px', padding: '6px', width: '100%', boxSizing: 'border-box' }}
                value={overallComments}
                onChange={e => setOverallComments(e.target.value)}
                placeholder="Enter overall comments or observations about this maintenance run..."
              />
            </div>

            {/* Signatures & Employee Autocomplete Search */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {/* Operator */}
              <div className="app-dropdown-container" style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Sign. Of the Operator <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={operatorDisplay}
                  onChange={e => {
                    const val = e.target.value;
                    setOperatorDisplay(val);
                    setOperator('');
                    if (handleSearchEmployees) handleSearchEmployees(val, 'modalOperator');
                  }}
                  onFocus={() => {
                    setActiveDropdown('operator');
                    if (handleSearchEmployees) handleSearchEmployees(operatorDisplay || '', 'modalOperator');
                  }}
                  placeholder="Search employee..."
                  required
                  autoComplete="off"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                {activeDropdown === 'operator' && employeeList.length > 0 && (
                  <div
                    className="app-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'var(--card-bg, #ffffff)',
                      border: '1px solid var(--border-color, #e5e7eb)',
                      borderRadius: '8px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      zIndex: 3000,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {employeeList.map(emp => (
                      <div
                        key={emp.name}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderBottom: '1px solid #f3f4f6',
                          color: 'var(--text-main, #374151)',
                        }}
                        onMouseDown={() => {
                          const name = emp.employee_name || emp.name;
                          setOperator(emp.name);
                          setOperatorDisplay(`${name} (${emp.name})`);
                          setActiveDropdown(null);
                        }}
                        className="employee-dropdown-item"
                      >
                        <strong>{emp.employee_name}</strong>{' '}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({emp.name})</span>
                      </div>
                    ))}
                  </div>
                )}
                {operator && (
                  <div style={{ fontSize: '10px', color: 'var(--success)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={12} />
                    <span>{operatorDisplay || operator}</span>
                  </div>
                )}
              </div>

              {/* Supervisor (Employee) */}
              <div className="app-dropdown-container" style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Sign. Of Supervisor <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(Optional / Auto-Assigned)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={supervisorDisplay}
                  onChange={e => {
                    const val = e.target.value;
                    setSupervisorDisplay(val);
                    setSupervisor('');
                    if (handleSearchEmployees) handleSearchEmployees(val, 'modalSupervisor');
                  }}
                  onFocus={() => {
                    setActiveDropdown('supervisor');
                    if (handleSearchEmployees) handleSearchEmployees(supervisorDisplay || '', 'modalSupervisor');
                  }}
                  placeholder="Select supervisor..."
                  autoComplete="off"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                {activeDropdown === 'supervisor' && employeeList.length > 0 && (
                  <div
                    className="app-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'var(--card-bg, #ffffff)',
                      border: '1px solid var(--border-color, #e5e7eb)',
                      borderRadius: '8px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      zIndex: 3000,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {employeeList.map(emp => (
                      <div
                        key={emp.name}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderBottom: '1px solid #f3f4f6',
                          color: 'var(--text-main, #374151)',
                        }}
                        onMouseDown={() => {
                          const name = emp.employee_name || emp.name;
                          setSupervisor(emp.name);
                          setSupervisorDisplay(`${name} (${emp.name})`);
                          setActiveDropdown(null);
                        }}
                        className="employee-dropdown-item"
                      >
                        <strong>{emp.employee_name}</strong>{' '}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({emp.name})</span>
                      </div>
                    ))}
                  </div>
                )}
                {supervisor && (
                  <div style={{ fontSize: '10px', color: 'var(--success)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={12} />
                    <span>{supervisorDisplay || supervisor}</span>
                  </div>
                )}
              </div>

              {/* Computed Metrics */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px', color: 'var(--accent)' }}>
                  Computed Metrics
                </label>
                <div
                  className="form-input"
                  style={{
                    backgroundColor: 'var(--bg-secondary, #f3f4f6)',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    fontWeight: '700',
                    color: 'var(--accent)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  Total Tasks Completed: {completedCount} / {tasks.length}
                </div>
              </div>
            </div>

            {/* Incident Marker Section (Full Width) */}
            <div style={{ marginTop: '14px' }}>
              <IncidentMarkerSection
                isIncident={isIncident}
                severity={incidentSeverity}
                note={incidentNote}
                onChange={(field, val) => {
                  if (field === 'is_incident') setIsIncident(Boolean(val));
                  else if (field === 'incident_severity') setIncidentSeverity(val);
                  else if (field === 'incident_note') setIncidentNote(val);
                }}
              />
            </div>

          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span
                    className="spinner"
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '6px',
                    }}
                  />
                  Saving...
                </>
              ) : (
                'Save Checklist Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
