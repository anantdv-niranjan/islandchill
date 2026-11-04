import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { isLabValueField, getLabFieldDefault } from './labFieldMetadata';
import LabSignatureField from './LabSignatureField';
import IncidentMarkerSection from './IncidentMarkerSection';

const flag = value => value === true || value === 1 || value === '1';

const selectOptions = options => (Array.isArray(options) ? options : String(options || '').split(/\r?\n/))
  .map(option => typeof option === 'object' && option !== null ? { value: option.value ?? option.label, label: option.label ?? option.value } : { value: String(option).trim(), label: String(option).trim() })
  .filter(option => option.value !== undefined && option.value !== '');

function LabLinkControl({ field, value, onChange, doc, parentDoc, linkOptionsMap, employeeList, loadLinkOptions, id, disabled, required }) {
  const rawTarget = field.fieldtype === 'Dynamic Link' ? (doc?.[field.options] ?? parentDoc?.[field.options]) : field.options;
  const target = typeof rawTarget === 'string' ? rawTarget.trim() : '';
  const previousTarget = useRef(target);
  useEffect(() => {
    if (previousTarget.current !== target) {
      previousTarget.current = target;
      if (value) onChange('');
    }
  }, [target, value, onChange]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!target || !loadLinkOptions || disabled) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const records = await loadLinkOptions(target, '');
        if (!cancelled) { setResult({ target, records: records || [] }); setError(''); }
      } catch {
        if (!cancelled) setError('Unable to load options. Please reopen the form to retry.');
      }
    }, 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [target, loadLinkOptions, disabled]);
  const records = [...(linkOptionsMap?.[target] || []), ...(result?.target === target ? result.records : [])];
  const options = new Map();
  for (const record of records) {
    const name = typeof record === 'string' ? record : record?.name;
    if (name) options.set(name, typeof record === 'string' ? name : (record.employee_name || record.title || name));
  }
  if (target === 'Employee') {
    for (const employee of employeeList || []) {
      // Available Employees are a fallback only for Employee Link fields.
      if (employee.name) options.set(employee.name, `${employee.employee_name || employee.name} (${employee.name})`);
    }
  }
  if (value && !options.has(value)) options.set(value, value);
  return <div>
    <select id={id} className="form-input" aria-label={field.label || field.fieldname} value={value ?? ''} required={required} disabled={disabled || !target} onChange={event => onChange(event.target.value)}>
      <option value="">-- Select {field.label || target || 'record'} --</option>
      {[...options].map(([name, label]) => <option key={name} value={name}>{label}</option>)}
    </select>
    {error && <small role="status">{error}</small>}
  </div>;
}

export function LabFieldControl({ field, value, onChange, doc = {}, parentDoc = {}, linkOptionsMap = {}, employeeList = [], loadLinkOptions, disabled = false }) {
  const id = useId();
  const readOnly = disabled || flag(field.read_only);
  const required = flag(field.reqd) && !readOnly;
  useEffect(() => {
    if (value === undefined && field.default !== undefined && field.default !== null && field.default !== '') {
      // Keep the displayed default and submitted state in agreement.
      onChange(getLabFieldDefault(field));
    }
  }, [value, field, onChange]);
  if (!isLabValueField(field)) return null;
  const type = field.fieldtype;
  const props = { id, className: 'form-input', 'aria-label': field.label || field.fieldname, disabled: readOnly, required, value: value ?? '', onChange: event => onChange(event.target.value) };
  if (type === 'Link' || type === 'Dynamic Link') return <LabLinkControl {...{ field, value, onChange, doc, parentDoc, linkOptionsMap, employeeList, loadLinkOptions, id, required }} disabled={readOnly} />;
  if (type === 'Select') return <select {...props}><option value="">-- Select {field.label || 'option'} --</option>{selectOptions(field.options).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  if (type === 'Check') return <input {...props} type="checkbox" value="1" checked={flag(value)} onChange={event => onChange(event.target.checked ? 1 : 0)} />;
  if (['Text', 'Small Text', 'Long Text', 'Text Editor', 'Markdown Editor', 'Code', 'JSON'].includes(type)) return <textarea {...props} rows={type === 'Small Text' ? 2 : 4} style={{ resize: 'vertical' }} />;
  if (['Int', 'Float', 'Currency', 'Percent', 'Duration', 'Rating'].includes(type)) return <input {...props} type="number" step={type === 'Int' ? '1' : 'any'} />;
  if (type === 'Date') return <input {...props} type="date" />;
  if (type === 'Time') return <input {...props} type="time" step="1" />;
  if (type === 'Datetime' || type === 'Date Time') return <input {...props} type="datetime-local" value={String(value ?? '').replace(' ', 'T')} step="1" />;
  if (type === 'Signature') return <LabSignatureField {...{ value, onChange, required, id }} disabled={readOnly} label={field.label || 'Signature'} />;
  if (type === 'Heading') return <h4>{field.label}</h4>;
  if (type === 'HTML') return <div style={{ whiteSpace: 'pre-wrap' }}>{field.options || value}</div>;
  if (type === 'Image') return value ? <img src={value} alt={field.label || ''} style={{ maxWidth: '100%' }} /> : null;
  return <input {...props} type={type === 'Password' ? 'password' : type === 'Color' ? 'color' : field.options === 'Email' ? 'email' : field.options === 'URL' ? 'url' : 'text'} />;
}

export function evalDependsOn(dependsOn, doc) {
  if (!dependsOn) return true;
  if (typeof dependsOn === 'string' && dependsOn.startsWith('eval:')) {
    try {
      const code = dependsOn.slice(5);
      const fn = new Function('doc', `return Boolean(${code});`);
      return fn(doc || {});
    } catch {
      return true;
    }
  }
  return Boolean(doc?.[dependsOn]);
}

export function isCreateOmittedField(field) {
  if (!field) return false;
  if (field.fieldtype === 'Signature') return true;
  const name = (field.fieldname || '').toLowerCase();
  const label = (field.label || '').toLowerCase();
  if ([
    'signature', 'operator_signature', 'analyst_signature', 'supervisor_signature',
    'sign', 'signed', 'sign_of_supervisor', 'sign_of_the_operator',
    'verified_by', 'verified_by_supervisor', 'verifyed_by',
    'approved_by', 'approved_by_manager', 'supervisor_name',
    'approval_date', 'approval_time', 'verified_date', 'verified_time',
    'approval_notes', 'rejection_reason', 'linked_incident'
  ].includes(name)) return true;
  if (label.includes('signature') || label.includes('sign of supervisor') || label.includes('sign. of supervisor') || label.includes('sign. of the supervisor') || label.includes('verified by (supervisor)')) return true;
  return false;
}

const INCIDENT_FIELDNAMES = new Set(['is_incident', 'incident_severity', 'incident_note', 'linked_incident']);

export function ensureIncidentFields(fields = []) {
  if (!fields || !Array.isArray(fields) || fields.length === 0) return [];

  // Remove existing incident fields from wherever they are positioned so we can cleanly place them in an incident section
  const regularFields = fields.filter(f => !INCIDENT_FIELDNAMES.has(f.fieldname) && f.fieldname !== 'incident_section');

  return [
    ...regularFields,
    {
      idx: regularFields.length + 1,
      fieldname: 'incident_section',
      label: 'Operational Incident & Deviation',
      fieldtype: 'Section Break'
    },
    {
      idx: regularFields.length + 2,
      fieldname: 'is_incident',
      label: 'Flag as Operational Incident / Deviation',
      fieldtype: 'Check',
      default: 0
    },
    {
      idx: regularFields.length + 3,
      fieldname: 'incident_severity',
      label: 'Incident Severity',
      fieldtype: 'Select',
      options: 'Critical\nHigh\nMedium\nLow',
      default: 'Medium',
      depends_on: 'eval:doc.is_incident == 1'
    },
    {
      idx: regularFields.length + 4,
      fieldname: 'incident_note',
      label: 'Incident / Deviation Note',
      fieldtype: 'Small Text',
      depends_on: 'eval:doc.is_incident == 1'
    }
  ];
}

export function LabMetadataFields({ fields = [], formData = {}, onChange, renderTable, linkOptionsMap, employeeList, loadLinkOptions, isCreateMode = false }) {
  const effectiveFields = isCreateMode ? ensureIncidentFields(fields) : fields;
  const sections = [];
  let section;
  let column;
  let hiddenTab = false;
  const startSection = field => {
    section = { field, columns: [[]], hidden: hiddenTab || flag(field?.hidden) };
    column = section.columns[0];
    sections.push(section);
  };
  startSection(null);
  for (const field of effectiveFields) {
    if (isCreateMode && isCreateOmittedField(field)) continue;
    if (field.fieldtype === 'Tab Break') { hiddenTab = flag(field.hidden); startSection(field); }
    else if (field.fieldtype === 'Section Break' || field.fieldtype === 'Fold') startSection(field);
    else if (field.fieldtype === 'Column Break') { column = []; section.columns.push(column); }
    else if (isLabValueField(field)) column.push(field);
  }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {sections.filter(section => !section.hidden && (
      section.field?.fieldtype === 'Tab Break' ||
      section.field?.fieldname === 'incident_section' ||
      (section.field?.label || '').toLowerCase().includes('incident') ||
      section.columns.some(column => column.length)
    )).map((section, index) => {
      const isIncidentSec = section.field?.fieldname === 'incident_section' || (section.field?.label || '').toLowerCase().includes('incident');
      const isIncidentActive = Boolean(formData.is_incident);

      if (isIncidentSec) {
        return (
          <div key={section.field?.fieldname || index} style={{ width: '100%', boxSizing: 'border-box' }}>
            <IncidentMarkerSection
              isIncident={isIncidentActive}
              severity={formData.incident_severity || 'Medium'}
              note={formData.incident_note || ''}
              linkedIncident={formData.linked_incident || ''}
              onChange={(field, val) => {
                onChange(field, val);
              }}
            />
          </div>
        );
      }

      return (
        <section
          key={section.field?.fieldname || index}
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: 14,
            transition: 'all 0.2s ease'
          }}
        >
          {section.field?.label && (
            <h4 style={{
              color: 'var(--accent)',
              margin: '0 0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {section.field.label}
            </h4>
          )}
          {section.field?.description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px' }}>{section.field.description}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
            {section.columns.map((column, columnIndex) => (
              <div
                className="lab-field-column"
                key={columnIndex}
                style={{
                  minWidth: 0,
                  display: 'grid',
                  alignContent: 'start',
                  gridTemplateColumns: section.columns.length === 1 ? 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' : '1fr',
                  gap: 14
                }}
              >
                {column
                  .filter(field => !field.depends_on || evalDependsOn(field.depends_on, formData))
                  .map(field => ['Table', 'Table MultiSelect'].includes(field.fieldtype) ? (
                    <div key={field.fieldname} style={{ gridColumn: '1 / -1', minWidth: 0 }}>
                      {renderTable(field)}
                    </div>
                  ) : (
                    <div
                      key={field.fieldname}
                      style={{
                        minWidth: 0,
                        gridColumn: ['Text', 'Small Text', 'Long Text', 'Text Editor', 'Markdown Editor', 'Code', 'JSON', 'HTML'].includes(field.fieldtype) ? '1 / -1' : undefined
                      }}
                    >
                      {!['HTML', 'Heading', 'Check'].includes(field.fieldtype) && (
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                          {field.label || field.fieldname}{flag(field.reqd) && ' *'}
                        </label>
                      )}
                      {field.fieldtype === 'Check' ? (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-main, #374151)' }}>
                          <LabFieldControl
                            {...{ field, linkOptionsMap, employeeList, loadLinkOptions }}
                            doc={formData}
                            value={formData[field.fieldname]}
                            onChange={value => onChange(field.fieldname, value)}
                          />
                          <span>{field.label || field.fieldname}{flag(field.reqd) && ' *'}</span>
                        </label>
                      ) : (
                        <LabFieldControl
                          {...{ field, linkOptionsMap, employeeList, loadLinkOptions }}
                          doc={formData}
                          value={formData[field.fieldname]}
                          onChange={value => onChange(field.fieldname, value)}
                        />
                      )}
                      {field.description && <small style={{ color: 'var(--text-muted)' }}>{field.description}</small>}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </section>
      );
    })}
  </div>;
}

// Child-table section breaks become grouped column headings, never editable cells.
export function LabTableSections({ fields, visibleFields, leadingColumns = 0 }) {
  const visible = new Set(visibleFields.map(field => field.fieldname));
  const groups = [];
  let group = { label: '', count: 0 };
  groups.push(group);
  for (const field of fields) {
    if (['Section Break', 'Tab Break', 'Fold'].includes(field.fieldtype)) {
      group = { label: field.label || '', count: 0 };
      groups.push(group);
    } else if (visible.has(field.fieldname)) group.count++;
  }
  if (!groups.some(group => group.label && group.count)) return null;
  return <tr>
    {leadingColumns > 0 && <th colSpan={leadingColumns} />}
    {groups.filter(group => group.count).map((group, index) => <th key={index} colSpan={group.count} scope="colgroup" style={{ textAlign: 'left', color: 'var(--accent)' }}>{group.label}</th>)}
    <th />
  </tr>;
}
