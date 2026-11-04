# Copyright (c) 2026, Island Chill and contributors
# For license information, please see license.txt

import frappe
from frappe import _
import json


INCIDENT_STATUS_MAP = {
    "open": "Open",
    "acknowledged": "Acknowledged",
    "pending": "Pending",
    "resolved": "Resolved",
    "closed": "Closed"
}


# ==========================================
# Whitelisted Frontend API Endpoints
# ==========================================

@frappe.whitelist()
def get_incidents(status=None, line=None, limit=100, **kwargs):
    """Fetch plant incidents for the frontend Incidents tab."""
    filters = {}
    if status and status.lower() not in ('all', ''):
        filters["status"] = status.capitalize() if status.lower() != 'acknowledged' else 'Acknowledged'
    if line and line.lower() != 'all':
        filters["production_line"] = line

    try:
        incidents = frappe.get_all(
            "Plant Incident",
            filters=filters,
            fields=[
                "name", "incident_title", "category", "severity", "status",
                "investigation_status", "production_line", "work_order",
                "production_item", "batch_no",
                "reported_time", "reported_by", "downtime_minutes", "units_rejected",
                "detection_type", "source_doctype", "source_name", "description",
                "root_cause_analysis", "corrective_action", "resolved_by", "resolution_date"
            ],
            order_by="creation desc",
            limit=int(limit)
        )
        return incidents
    except Exception as e:
        frappe.log_error(f"Error fetching incidents: {e}", "get_incidents")
        return []


@frappe.whitelist()
def create_incident(data=None, **kwargs):
    """Create a Plant Incident from the frontend modal (Direct Entry)."""
    if data is None:
        data = kwargs or frappe.form_dict or {}
    elif isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            data = {"description": data}

    # Clean and validate link references to prevent LinkValidationError on direct entry
    work_order = data.get("work_order") or data.get("workOrder")
    if work_order and not frappe.db.exists("Work Order", work_order):
        work_order = None

    production_item = data.get("production_item") or data.get("productionItem")
    if production_item and not frappe.db.exists("Item", production_item):
        production_item = None

    batch_no = data.get("batch_no") or data.get("batchNo")
    if batch_no and not frappe.db.exists("Batch", batch_no):
        batch_no = None

    reported_by = data.get("reported_by") or data.get("reportedBy")
    if not (reported_by and frappe.db.exists("User", reported_by)):
        reported_by = frappe.session.user

    resolved_by = data.get("resolved_by") or data.get("resolvedBy")
    if resolved_by and not frappe.db.exists("User", resolved_by):
        resolved_by = None

    source_doctype = data.get("source_doctype") or data.get("sourceDoctype")
    source_name = data.get("source_name") or data.get("sourceName")
    if source_doctype and not frappe.db.exists("DocType", source_doctype):
        source_doctype = None
        source_name = None
    elif source_doctype and source_name and not frappe.db.exists(source_doctype, source_name):
        source_name = None

    # Deduplicate: if an open/acknowledged incident already exists for this source document, return it
    if source_doctype and source_name:
        existing = frappe.get_all(
            "Plant Incident",
            filters={
                "source_doctype": source_doctype,
                "source_name": source_name,
                "status": ["in", ["Open", "Acknowledged", "Pending"]]
            },
            fields=["name"],
            limit=1
        )
        if existing:
            return frappe.get_doc("Plant Incident", existing[0]["name"]).as_dict()

    raw_status = str(data.get("status") or "Open").strip().lower()
    incident_status = INCIDENT_STATUS_MAP.get(raw_status, "Open")

    raw_description = data.get("description", "Incident reported")
    source_remarks = (
        data.get("overall_remarks")
        or data.get("overall_comments")
        or data.get("overallComments")
        or data.get("remarks")
        or data.get("comments")
        or ""
    )
    if not isinstance(source_remarks, str):
        source_remarks = str(source_remarks).strip() if source_remarks else ""
    else:
        source_remarks = source_remarks.strip()

    final_description = raw_description or ""
    if source_remarks:
        remarks_tag = f"Remarks: {source_remarks}"
        if remarks_tag.lower() not in final_description.lower():
            final_description = f"{final_description}\n\n{remarks_tag}" if final_description else remarks_tag

    incident = frappe.get_doc({
        "doctype": "Plant Incident",
        "incident_title": data.get("incident_title") or data.get("title") or f"{data.get('category', 'Incident')} on {data.get('line') or 'Floor'}",
        "category": data.get("category", "Equipment Fault"),
        "severity": data.get("severity", "Medium").capitalize() if data.get("severity") else "Medium",
        "status": incident_status,
        "investigation_status": data.get("investigationStatus") or data.get("investigation_status") or "Pending",
        "production_line": data.get("line") or data.get("production_line") or "FL1",
        "work_order": work_order,
        "production_item": production_item,
        "batch_no": batch_no,
        "description": final_description,
        "downtime_minutes": int(data.get("downtime_minutes") or data.get("downtimeMinutes") or 0),
        "units_rejected": int(data.get("units_rejected") or data.get("unitsRejected") or 0),
        "detection_type": data.get("detection_type") or data.get("detectionType") or "Direct Entry",
        "source_doctype": source_doctype,
        "source_name": source_name,
        "root_cause_analysis": data.get("rootCause") or data.get("root_cause_analysis"),
        "corrective_action": data.get("correctiveAction") or data.get("corrective_action"),
        "reported_time": data.get("reported_time") or frappe.utils.now_datetime(),
        "reported_by": reported_by,
        "resolved_by": resolved_by,
        "resolution_date": data.get("resolution_date") or data.get("resolutionDate"),
    })
    incident.insert(ignore_permissions=True)
    return incident.as_dict()


@frappe.whitelist()
def update_incident_investigation(incident_id=None, status=None, investigation_status=None,
                                   root_cause=None, corrective_action=None,
                                   downtime_minutes=None, units_rejected=None,
                                   resolved_by=None, resolution_date=None, **kwargs):
    """Update RCA, CAPA, and status for an ongoing incident."""
    target_id = incident_id or kwargs.get("name") or kwargs.get("id") or frappe.form_dict.get("incident_id")
    if not target_id:
        frappe.throw(_("Incident ID is required"))

    doc = frappe.get_doc("Plant Incident", target_id)

    if status:
        stat_lower = str(status).strip().lower()
        doc.status = INCIDENT_STATUS_MAP.get(stat_lower, status.title())
    if investigation_status:
        doc.investigation_status = investigation_status
    if root_cause is not None:
        doc.root_cause_analysis = root_cause
    if corrective_action is not None:
        doc.corrective_action = corrective_action
    if downtime_minutes is not None:
        doc.downtime_minutes = int(downtime_minutes)
    if units_rejected is not None:
        doc.units_rejected = int(units_rejected)
    if resolved_by:
        doc.resolved_by = resolved_by
    if resolution_date:
        doc.resolution_date = resolution_date

    if doc.status == "Resolved" and not doc.resolution_date:
        doc.resolution_date = frappe.utils.today()
        if not doc.resolved_by:
            doc.resolved_by = frappe.session.user

    doc.save(ignore_permissions=True)
    return doc.as_dict()


# ==========================================
# Automated Threshold & Out-of-Spec Rules
# Called via hooks.py doc_events
# ==========================================

def _has_field(doctype, fieldname):
    """Check if a DocType has a given field (accounts for bench migrate timing)."""
    try:
        return frappe.get_meta(doctype).has_field(fieldname)
    except Exception:
        return False


def _check_manual_flag(doc, method=None):
    """If is_incident = 1, create a Manual Flag incident from any source form."""
    is_inc = doc.get("is_incident")
    if not is_inc or str(is_inc) in ("0", "false", "False", "None"):
        return None

    # Avoid creating duplicate if linked_incident is already set
    if doc.get("linked_incident"):
        return doc.get("linked_incident")

    raw_sev = doc.get("incident_severity") or "Medium"
    severity = raw_sev.capitalize() if raw_sev else "Medium"
    if severity not in ("Critical", "High", "Medium", "Low"):
        severity = "Medium"

    note = doc.get("incident_note") or f"Manual deviation flag on {doc.doctype} {doc.name}"

    equip_doctypes = {
        "Balance Check or Callibration", "Autoclave Record", "Silver Photometer Log",
        "Silver Photometer Log and Calibration"
    }
    cleaning_doctypes = {
        "Cleaning of Toilets", "Cleaning of Dining Room", "Factory Floor", "Cleaning of Lab and Office",
        "Toilet Cleaning purpose", "Dining Room Cleaning Purpose", "Factory Floor Cleaning Purpose",
        "Lab and Office Cleaning Purpose", "equipment sanitation and cip", "Outside Perimeter Cleaning"
    }

    if doc.doctype in equip_doctypes:
        category = "Equipment Fault"
    elif doc.doctype in cleaning_doctypes:
        category = "Cleaning Required"
    else:
        category = "Quality Alert"

    return create_incident_from_doc(
        doc,
        category=category,
        severity=severity,
        description=note,
        detection_type="Manual Flag"
    )


def process_lab_incident(doc, method=None):
    """Handle manual flag or automated detection for Laboratory records."""
    if not doc:
        return None

    if doc.get("linked_incident"):
        return doc.get("linked_incident")

    return _check_manual_flag(doc, method)


def process_chemical_test(doc, method):
    """Standard Form 9: Evaluate pH and TDS thresholds."""
    # Manual flag check first
    manual = _check_manual_flag(doc, method)

    # Automated pH check
    ph = doc.get("ph_level")
    if ph is not None:
        ph = float(ph)
        if ph < 6.5 or ph > 7.5:
            create_incident_from_doc(
                doc,
                category="Quality Alert",
                severity="Critical",
                description=f"pH reading {ph} is out of spec (acceptable: 6.5\u20137.5) on Chemical Test {doc.name}.",
                detection_type="Automated Rule"
            )

    # Automated TDS check
    tds = doc.get("tds_level")
    if tds is not None:
        tds = float(tds)
        if tds > 200:
            create_incident_from_doc(
                doc,
                category="Quality Alert",
                severity="High",
                description=f"TDS reading {tds} ppm exceeds limit of 200 ppm on Chemical Test {doc.name}.",
                detection_type="Automated Rule"
            )


def process_micro_analysis(doc, method):
    """Standard Form 1: Evaluate microbiological sample results."""
    _check_manual_flag(doc, method)

    sample_results = doc.get("sample_results") or []
    critical_params = ["total_coliforms", "e_coli", "ecoli", "yeast", "mould", "mold"]

    for row in sample_results:
        for param in critical_params:
            val = row.get(param)
            if val is not None:
                try:
                    if float(val) > 0:
                        create_incident_from_doc(
                            doc,
                            category="Quality Alert",
                            severity="Critical",
                            description=f"Microbiological out-of-spec: {param.replace('_',' ').title()} = {val} in Micro Analysis {doc.name}. Immediate containment required.",
                            detection_type="Automated Rule"
                        )
                        return  # One incident per document is enough
                except (ValueError, TypeError):
                    pass


def process_cip_checklist(doc, method):
    """CIP Checklist: Flag if any step is marked as Failed."""
    _check_manual_flag(doc, method)

    detail_rows = doc.get("cip_checklist_detail") or []
    for row in detail_rows:
        result = str(row.get("result") or row.get("status") or row.get("outcome") or "").lower()
        if result in ("fail", "failed", "no", "nok"):
            create_incident_from_doc(
                doc,
                category="Cleaning Required",
                severity="High",
                description=f"CIP Checklist {doc.name}: Step '{row.get('description') or row.get('task') or 'Unknown'}' marked as FAILED. Line not cleared for production.",
                detection_type="Automated Rule"
            )
            return  # One incident per document


def process_seam_check(doc, method):
    """Seam Checklist Form: Flag seam overlap or visual defects."""
    _check_manual_flag(doc, method)

    seam_rows = doc.get("seam_checks") or []
    for row in seam_rows:
        # Check overlap thickness
        overlap = row.get("overlap") or row.get("seam_overlap")
        if overlap is not None:
            try:
                if float(overlap) < 1.1:
                    create_incident_from_doc(
                        doc,
                        category="Equipment Fault",
                        severity="High",
                        description=f"Seam overlap {overlap} mm below minimum 1.1 mm on Seam Check {doc.name}. Can integrity at risk.",
                        detection_type="Automated Rule"
                    )
                    return
            except (ValueError, TypeError):
                pass

        # Check for explicit fail result
        result = str(row.get("result") or row.get("visual_check") or "").lower()
        if result in ("fail", "failed", "defect", "nok"):
            create_incident_from_doc(
                doc,
                category="Equipment Fault",
                severity="High",
                description=f"Seam visual defect detected on {doc.name}. Result: '{row.get('result') or row.get('visual_check')}'.",
                detection_type="Automated Rule"
            )
            return


def process_cleaning_sanitation_incident(doc, method=None):
    """Handle manual flag or automated failure detection for Cleaning & Sanitation records."""
    if not doc:
        return None

    # Avoid duplicate creation if already linked
    if doc.get("linked_incident"):
        return doc.get("linked_incident")

    # 1. Manual flag check
    is_inc = doc.get("is_incident")
    if is_inc and str(is_inc) not in ("0", "false", "False", "None"):
        category = "Equipment Fault" if doc.doctype == "Balance Check or Callibration" else "Cleaning Required"
        raw_sev = doc.get("incident_severity") or "Medium"
        severity = raw_sev.capitalize() if raw_sev else "Medium"
        if severity not in ("Critical", "High", "Medium", "Low"):
            severity = "Medium"
        note = doc.get("incident_note") or f"Manual deviation flag on {doc.doctype} {doc.name}"
        return create_incident_from_doc(
            doc,
            category=category,
            severity=severity,
            description=note,
            detection_type="Manual Flag"
        )

    # 2. Automated status / fail check
    res = str(doc.get("sanitation_result") or doc.get("status") or doc.get("result") or "").lower()
    if res in ("fail", "failed", "needs attention", "unsatisfactory", "not acceptable"):
        return create_incident_from_doc(
            doc,
            category="Cleaning Required",
            severity="High",
            description=f"Sanitation check failed on {doc.doctype} {doc.name}. Result: {doc.get('sanitation_result') or doc.get('status') or doc.get('result')}.",
            detection_type="Automated Rule"
        )

    return None


def process_accident_disease_report(doc, method=None):
    """OHSF 1 & 2: Accident and Disease Notification Report.
    Any new record created in it will automatically create a record in Plant Incident.
    """
    if not doc:
        return None

    if doc.get("linked_incident"):
        return doc.get("linked_incident")

    days_lost = 0
    try:
        days_lost = int(doc.get("days_lost") or 0)
    except (ValueError, TypeError):
        days_lost = 0

    inc_type = str(doc.get("incident_type") or "").strip().lower()
    if inc_type in ("fatality", "dangerous occurrence") or days_lost >= 3 or "critical" in inc_type:
        severity = "Critical"
    elif inc_type == "accident":
        severity = "High"
    else:
        severity = "Medium"

    location = doc.get("incident_location") or "Plant Floor"
    details = doc.get("details") or f"Workplace safety incident ({doc.get('incident_type') or 'Accident'})."
    desc = f"{details} Injured: {doc.get('injured_person') or 'Unknown'}. Location: {location}."

    return create_incident_from_doc(
        doc,
        category="Safety",
        severity=severity,
        description=desc,
        detection_type="Manual Flag"
    )


def process_first_aid_record(doc, method=None):
    """Standard Form 17: First Aid Registry Log.
    Any new record created in it will automatically create a record in Plant Incident.
    """
    if not doc:
        return None

    if doc.get("linked_incident"):
        return doc.get("linked_incident")

    injury_type = str(doc.get("type_of_injury") or "").lower()
    if "immediate" in injury_type or "critical" in injury_type:
        severity = "Critical"
    elif "serious" in injury_type:
        severity = "High"
    else:
        severity = "Medium"

    employee = doc.get("employee__person_injured") or "Employee"
    treatment = doc.get("first_aid_treatment_given") or "First aid administered"
    causes = doc.get("causes_of_injury") or "Not specified"
    desc = f"First Aid log: Treatment '{treatment}' administered to {employee}. Cause: {causes}."

    return create_incident_from_doc(
        doc,
        category="Safety",
        severity=severity,
        description=desc,
        detection_type="Manual Flag"
    )


def process_swab_test(doc, method=None):
    """Standard Form 14: Environmental Swab Test microbiology Register.
    Acceptance threshold is =< 15cfu (excluding Warehouse).
    If threshold is breached (> 15 CFU in any non-warehouse zone), automatically create Plant Incident.
    """
    if not doc:
        return None

    if doc.get("linked_incident"):
        return doc.get("linked_incident")

    manual = _check_manual_flag(doc, method)
    if manual:
        return manual

    # Child table is table_hovh or table_mxza
    rows = doc.get("table_hovh") or doc.get("table_mxza") or []
    breached_zones = []
    max_cfu = 0

    for row in rows:
        loc = str(row.get("location") or "").strip()
        loc_lower = loc.lower()
        if "warehouse" in loc_lower or "ware-house" in loc_lower:
            # Excluded from compliance limits
            continue

        y_str = row.get("yeast")
        m_str = row.get("mould") or row.get("mold")
        h_str = row.get("hpc")

        def _to_num(val):
            try:
                return float(val) if val is not None and str(val).strip() != "" else 0.0
            except (ValueError, TypeError):
                return 0.0

        y = _to_num(y_str)
        m = _to_num(m_str)
        h = _to_num(h_str)

        row_max = max(y, m, h)
        if row_max > 15.0:
            if row_max > max_cfu:
                max_cfu = row_max
            violations = []
            if y > 15.0:
                violations.append(f"Yeast={y} CFU")
            if m > 15.0:
                violations.append(f"Mould={m} CFU")
            if h > 15.0:
                violations.append(f"HPC={h} CFU")
            breached_zones.append(f"{loc or 'Zone'} ({', '.join(violations)})")

    if breached_zones:
        severity = "Critical"
        desc = (
            f"Environmental swab test {doc.name} exceeded acceptance threshold (=< 15 CFU) at: "
            f"{'; '.join(breached_zones)}. Immediate sanitation, containment, and re-swab required."
        )
        return create_incident_from_doc(
            doc,
            category="Quality Alert",
            severity=severity,
            description=desc,
            detection_type="Automated Rule"
        )

    return None


def process_maintenance_incident(doc, method=None):
    """Auto-create Plant Incident when a maintenance form flags an operational incident."""
    if not doc:
        return None

    if doc.get("linked_incident"):
        return doc.get("linked_incident")

    is_inc = doc.get("is_incident")
    if not (is_inc and str(is_inc) not in ("0", "false", "False", "None")):
        return None

    raw_sev = doc.get("incident_severity") or "Medium"
    severity = raw_sev.capitalize() if raw_sev else "Medium"
    equipment = (
        doc.get("equipment")
        or doc.get("machine_name")
        or (f"Machine #{doc.get('machine_no')}" if doc.get("machine_no") else None)
        or "Equipment"
    )
    area = doc.get("area") or ""
    note = (
        doc.get("incident_note")
        or doc.get("breakdown_description")
        or f"Maintenance issue/deviation logged on {doc.doctype} {doc.name}"
    )

    category = "Quality Alert" if doc.doctype in ("Weight Check", "Hourly Weight Check Form") else "Equipment Fault"
    desc = f"Maintenance Issue on {equipment}{f' ({area})' if area else ''}: {note}"

    return create_incident_from_doc(
        doc,
        category=category,
        severity=severity,
        description=desc,
        detection_type="Manual Flag"
    )


# ==========================================
# Factory Helper
# ==========================================

def create_incident_from_doc(doc, category, severity, description,
                              detection_type="Automated Rule",
                              downtime=0, rejected=0):
    """Insert a Plant Incident and write back the link to the source doc."""
    # Deduplicate: avoid creating a second incident for the same source doc
    existing = frappe.get_all(
        "Plant Incident",
        filters={
            "source_doctype": doc.doctype,
            "source_name": doc.name,
            "category": category,
            "status": ["in", ["Open", "Acknowledged", "Pending"]]
        },
        limit=1
    )
    if existing:
        inc_name = existing[0]["name"]
        if _has_field(doc.doctype, "linked_incident") and not doc.get("linked_incident"):
            try:
                frappe.db.set_value(doc.doctype, doc.name, "linked_incident", inc_name, update_modified=False)
                doc.linked_incident = inc_name
            except Exception:
                pass
        return inc_name

    valid_lines = {"FL1", "FL2", "FL3", "FL4", "FL5", "FL6", "FL7", "Water Treatment", "Utilities"}
    raw_line = doc.get("production_line") or doc.get("line") or doc.get("linemachine") or doc.get("area") or "FL1"
    line = raw_line if raw_line in valid_lines else "FL1"

    work_order = doc.get("work_order")
    if work_order and not frappe.db.exists("Work Order", work_order):
        work_order = None

    reported_by = frappe.session.user if (frappe.session and frappe.session.user and frappe.db.exists("User", frappe.session.user)) else "Administrator"

    # Extract any overall comments/remarks from source form to append to description
    source_remarks = (
        doc.get("overall_remarks")
        or doc.get("overall_comments")
        or doc.get("remarks")
        or doc.get("comments")
        or ""
    )
    if isinstance(source_remarks, str):
        source_remarks = source_remarks.strip()
    else:
        source_remarks = str(source_remarks).strip() if source_remarks else ""

    final_description = description or ""
    if source_remarks:
        remarks_tag = f"[Remarks]: {source_remarks}"
        if remarks_tag.lower() not in final_description.lower():
            final_description = f"{final_description}\n\n{remarks_tag}" if final_description else remarks_tag

    incident = frappe.get_doc({
        "doctype": "Plant Incident",
        "incident_title": f"{category} — {doc.doctype} {doc.name}",
        "category": category,
        "severity": severity,
        "status": "Open",
        "investigation_status": "Pending",
        "detection_type": detection_type,
        "source_doctype": doc.doctype,
        "source_name": doc.name,
        "production_line": line,
        "work_order": work_order,
        "description": final_description,
        "downtime_minutes": int(downtime),
        "units_rejected": int(rejected),
        "reported_time": frappe.utils.now_datetime(),
        "reported_by": reported_by
    })
    incident.insert(ignore_permissions=True)

    # Write back-reference if the field was added to the source DocType
    if _has_field(doc.doctype, "linked_incident"):
        try:
            frappe.db.set_value(doc.doctype, doc.name, "linked_incident", incident.name, update_modified=False)
            doc.linked_incident = incident.name
        except Exception:
            pass

    return incident.name
