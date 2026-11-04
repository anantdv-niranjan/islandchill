# Copyright (c) 2026, Island Chill and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.workflow import get_workflow_name

SUPER_ROLES = {"Administrator", "System Manager", "IslandChill Admin User"}


def is_user_super_admin(user=None):
    if not user:
        user = frappe.session.user
    if user == "Administrator":
        return True
    user_roles = set(frappe.get_roles(user))
    return bool(user_roles & SUPER_ROLES)


def check_user_can_verify(user, doctype):
    """
    Dynamically checks if the user has verification permission for the given doctype
    via configured 'IslandChill Role Form Item' permissions or standard Frappe write permissions.
    Zero hardcoded role lists.
    """
    if is_user_super_admin(user):
        return True
    user_roles = set(frappe.get_roles(user))
    if not user_roles:
        return False

    try:
        from islandchill.api.permissions import get_user_portal_permissions
        perms = get_user_portal_permissions(user)
        if perms and perms.get("is_super_admin"):
            return True
        allowed_forms = (perms or {}).get("allowed_forms", {})
        if doctype in allowed_forms:
            return bool(allowed_forms[doctype].get("can_verify"))
        for code, f in allowed_forms.items():
            if f.get("doctype_name") == doctype or f.get("form_code") == doctype:
                return bool(f.get("can_verify"))
    except Exception:
        pass

    if frappe.db.table_exists("IslandChill Role Form Item"):
        matched = frappe.db.sql("""
            SELECT can_verify FROM `tabIslandChill Role Form Item`
            WHERE parent IN %(roles)s
              AND (doctype_name = %(doctype)s OR form_code = %(doctype)s)
              AND can_verify = 1
            LIMIT 1
        """, {"roles": tuple(user_roles), "doctype": doctype})
        if matched:
            return True

    return frappe.has_permission(doctype, ptype="write", user=user)


def check_user_can_approve(user, doctype):
    """
    Dynamically checks if the user has approval permission for the given doctype
    via configured 'IslandChill Role Form Item' permissions or standard Frappe submit permissions.
    Zero hardcoded role lists.
    """
    if is_user_super_admin(user):
        return True
    user_roles = set(frappe.get_roles(user))
    if not user_roles:
        return False

    try:
        from islandchill.api.permissions import get_user_portal_permissions
        perms = get_user_portal_permissions(user)
        if perms and perms.get("is_super_admin"):
            return True
        allowed_forms = (perms or {}).get("allowed_forms", {})
        if doctype in allowed_forms:
            return bool(allowed_forms[doctype].get("can_approve"))
        for code, f in allowed_forms.items():
            if f.get("doctype_name") == doctype or f.get("form_code") == doctype:
                return bool(f.get("can_approve"))
    except Exception:
        pass

    if frappe.db.table_exists("IslandChill Role Form Item"):
        matched = frappe.db.sql("""
            SELECT can_approve FROM `tabIslandChill Role Form Item`
            WHERE parent IN %(roles)s
              AND (doctype_name = %(doctype)s OR form_code = %(doctype)s)
              AND can_approve = 1
            LIMIT 1
        """, {"roles": tuple(user_roles), "doctype": doctype})
        if matched:
            return True

    return frappe.has_permission(doctype, ptype="submit", user=user)


def get_user_and_employee_info(user=None):
    if not user:
        user = frappe.session.user
    emp = frappe.db.get_value("Employee", {"user_id": user}, ["name", "employee_name"], as_dict=True)
    if not emp:
        # Check if user matches employee name directly
        emp = frappe.db.get_value("Employee", user, ["name", "employee_name"], as_dict=True)
    
    full_name = frappe.db.get_value("User", user, "full_name") or user
    emp_id = emp.name if emp else None
    emp_name = (emp.employee_name if emp else full_name) or user
    return {
        "user": user,
        "full_name": full_name,
        "emp_id": emp_id,
        "emp_name": emp_name
    }


def set_field_value_smart(doc, meta, fieldname, user_info):
    field = meta.get_field(fieldname)
    if not field:
        return
    if field.fieldtype == "Link" and field.options == "Employee":
        val = user_info["emp_id"]
        if not val:
            val = frappe.db.get_value("Employee", {"status": "Active"}, "name")
        setattr(doc, fieldname, val)
    elif field.fieldtype == "Link" and field.options == "User":
        setattr(doc, fieldname, user_info["user"])
    else:
        # Data, Small Text, etc.
        setattr(doc, fieldname, user_info["emp_name"] or user_info["full_name"])


DOCTYPE_ALIASES = {
    "form 9": "Chemical Test",
    "chemical test": "Chemical Test",
    "standard chemical test": "Chemical Test",
    "form 9: chemical test": "Chemical Test",
    "form 11": "Microbiologiocal Analysis Raw and Product Water",
    "micro water": "Microbiologiocal Analysis Raw and Product Water",
    "raw and product water": "Microbiologiocal Analysis Raw and Product Water",
    "form 1": "Microbiological Analysis of Primary Raw Materials",
    "micro raw": "Microbiological Analysis of Primary Raw Materials",
    "primary raw materials": "Microbiological Analysis of Primary Raw Materials",
    "cleaning of toilets": "Cleaning of Toilets",
    "toilet cleaning": "Cleaning of Toilets",
    "dining room cleaning": "Cleaning of Dining Room",
    "cleaning of dining room": "Cleaning of Dining Room",
    "lab and office cleaning": "Cleaning of Lab and Office",
    "cleaning of lab and office": "Cleaning of Lab and Office",
    "factory floor": "Factory Floor",
    "factory floor cleaning": "Factory Floor",
    "outside perimeter cleaning table": "Outside Perimeter Cleaning Table",
    "perimeter cleaning": "Outside Perimeter Cleaning Table",
    "daily preventative maintenance schedule": "Daily Preventative Maintenance Schedule",
    "preventative maintenance": "Daily Preventative Maintenance Schedule",
    "preventive maintenance form": "Daily Preventative Maintenance Schedule",
    "machine breakdown": "Machine Breakdown",
    "monitoring": "Monitoring",
    "water monitoring form": "Water Monitoring Form",
    "silver photometer log": "Silver Photometer Log",
    "seam checklist form": "Seam Checklist Form",
    "cip checklist": "CIP CHECKLIST",
    "taste test and visual inspection": "Taste Test and Visual Inspection",
    "incident log": "Plant Incident",
    "plant incident": "Plant Incident"
}

PREFIX_TO_DOCTYPE = {
    "CT-": "Chemical Test",
    "CHEM-": "Chemical Test",
    "DPMS-": "Daily Preventative Maintenance Schedule",
    "MNT-": "Daily Preventative Maintenance Schedule",
    "MON-": "Monitoring",
    "COT-": "Cleaning of Toilets",
    "CDR-": "Cleaning of Dining Room",
    "CLO-": "Cleaning of Lab and Office",
    "FF-": "Factory Floor",
    "OPCT-": "Outside Perimeter Cleaning Table",
    "MARPW-": "Microbiologiocal Analysis Raw and Product Water",
    "MARPM-": "Microbiological Analysis of Primary Raw Materials",
    "MAPRM-": "Microbiological Analysis of Primary Raw Materials",
    "SPL-": "Silver Photometer Log",
    "SCF-": "Seam Checklist Form",
    "CIP-": "CIP CHECKLIST",
    "WMF-": "Water Monitoring Form",
    "MB-": "Machine Breakdown",
    "INC-": "Plant Incident"
}


def resolve_doctype_and_name(doctype, name):
    name_str = str(name or "").strip()
    dt_str = str(doctype or "").strip()

    # 1. Prefix pattern check
    for pfx, mapped_dt in PREFIX_TO_DOCTYPE.items():
        if name_str.startswith(pfx) and frappe.db.exists("DocType", mapped_dt):
            if frappe.db.exists(mapped_dt, name_str):
                return mapped_dt, name_str
            dt_str = mapped_dt

    # 2. Alias resolution
    clean_dt = dt_str.lower()
    if clean_dt in DOCTYPE_ALIASES:
        target = DOCTYPE_ALIASES[clean_dt]
        if frappe.db.exists("DocType", target):
            dt_str = target

    # 3. Direct check
    if dt_str and name_str and frappe.db.exists(dt_str, name_str):
        return dt_str, name_str

    # 4. Fallback search across common operational doctypes
    for candidate_dt in PREFIX_TO_DOCTYPE.values():
        if frappe.db.exists("DocType", candidate_dt) and frappe.db.exists(candidate_dt, name_str):
            return candidate_dt, name_str

    return dt_str, name_str


def get_workflow_states_for_doctype(doctype):
    """
    Resolves the exact verification (Stage 2) and approval (Stage 3) states
    for a given DocType based on active Frappe Workflow definition, or standard defaults.
    """
    wf_name = get_workflow_name(doctype)
    if not wf_name:
        return {
            "has_workflow": False,
            "verification_state": "Pending Approval",
            "approval_state": "Approved",
            "rejection_state": "Rejected",
            "wf_state_field": "workflow_state"
        }

    wf = frappe.get_doc("Workflow", wf_name)
    wf_state_field = wf.workflow_state_field or "workflow_state"

    verification_state = None
    approval_state = None
    rejection_state = "Rejected"

    for s in wf.states:
        s_name = s.state
        s_docstatus = str(s.doc_status or 0)
        s_lower = s_name.lower()

        if "reject" in s_lower or "fail" in s_lower:
            rejection_state = s_name
        elif s_docstatus == "1" or "approved by operation manager" in s_lower or "approved by supervisor" in s_lower:
            approval_state = s_name
        elif s_docstatus == "0" and "draft" not in s_lower:
            if not verification_state:
                verification_state = s_name

    if not verification_state:
        verification_state = "Pending Approval"
    if not approval_state:
        submittable_states = [s.state for s in wf.states if str(s.doc_status) == "1"]
        if submittable_states:
            approval_state = submittable_states[-1]
        else:
            approval_state = wf.states[-1].state if wf.states else "Approved"

    return {
        "has_workflow": True,
        "workflow_name": wf_name,
        "verification_state": verification_state,
        "approval_state": approval_state,
        "rejection_state": rejection_state,
        "wf_state_field": wf_state_field
    }


@frappe.whitelist()
def verify_form(doctype, name, notes=None):
    """
    Stage 2: Verification of operational documents.
    Advances document from Draft / Pending Verification to Stage 2 Verified.
    """
    doctype, name = resolve_doctype_and_name(doctype, name)

    if not frappe.db.exists(doctype, name):
        frappe.throw(_("Document {0} {1} does not exist").format(doctype, name), frappe.DoesNotExistError)

    user = frappe.session.user
    if not check_user_can_verify(user, doctype):
        frappe.throw(_("User {0} is not authorized to verify {1}").format(user, doctype), frappe.PermissionError)

    doc = frappe.get_doc(doctype, name)
    user_info = get_user_and_employee_info(user)
    today_date = frappe.utils.today()
    now_time = frappe.utils.nowtime()

    meta = frappe.get_meta(doctype)

    # Set audit fields if present on the DocType
    for vf in ["verified_by", "verifyed_by", "verified_by_supervisor", "sign_of_the_operator", "supervisor_sign"]:
        set_field_value_smart(doc, meta, vf, user_info)

    if meta.get_field("verification_date"):
        setattr(doc, "verification_date", today_date)
    if meta.get_field("verification_time"):
        setattr(doc, "verification_time", now_time)

    wf_info = get_workflow_states_for_doctype(doctype)
    target_state = wf_info["verification_state"]
    doc.set(wf_info["wf_state_field"], target_state)

    if meta.get_field("status") and not wf_info["has_workflow"]:
        doc.status = "Pending Approval"

    # Save safely with workflow bypass to support unified role-based permissions
    orig_install = frappe.flags.in_install
    try:
        frappe.flags.in_install = "frappe"
        doc.flags.ignore_permissions = True
        doc.save()
    finally:
        frappe.flags.in_install = orig_install

    frappe.db.commit()

    if notes:
        doc.add_comment("Comment", _("Verified with remarks: {0}").format(notes))
    else:
        doc.add_comment("Comment", _("Form verified by {0}").format(user_info["emp_name"]))

    return {
        "success": True,
        "name": doc.name,
        "doctype": doctype,
        "workflow_state": doc.get(wf_info["wf_state_field"]),
        "verified_by": user_info["emp_name"],
        "verification_date": today_date,
        "verification_time": now_time
    }


@frappe.whitelist()
def approve_form(doctype, name, notes=None):
    """
    Stage 3: Final Approval & Submission of operational documents.
    Advances document to Approved and sets docstatus = 1 (Submit).
    """
    doctype, name = resolve_doctype_and_name(doctype, name)

    if not frappe.db.exists(doctype, name):
        frappe.throw(_("Document {0} {1} does not exist").format(doctype, name), frappe.DoesNotExistError)

    user = frappe.session.user
    if not check_user_can_approve(user, doctype):
        frappe.throw(_("User {0} is not authorized to approve {1}").format(user, doctype), frappe.PermissionError)

    doc = frappe.get_doc(doctype, name)
    user_info = get_user_and_employee_info(user)
    today_date = frappe.utils.today()
    now_time = frappe.utils.nowtime()

    meta = frappe.get_meta(doctype)

    # Set approver fields if present
    for af in ["approved_by", "supervisor_name", "supervisor", "approved_by_manager", "approved_by_fm", "maintenance_approved_by", "sign_of_supervisor"]:
        set_field_value_smart(doc, meta, af, user_info)

    if meta.get_field("approval_date"):
        setattr(doc, "approval_date", today_date)
    if meta.get_field("approval_time"):
        setattr(doc, "approval_time", now_time)
    if meta.get_field("approval_notes") and notes:
        setattr(doc, "approval_notes", notes)

    wf_info = get_workflow_states_for_doctype(doctype)
    target_state = wf_info["approval_state"]
    doc.set(wf_info["wf_state_field"], target_state)

    if meta.get_field("status"):
        doc.status = "Approved"
    if meta.get_field("sanitation_result"):
        doc.sanitation_result = "Pass"

    orig_install = frappe.flags.in_install
    try:
        frappe.flags.in_install = "frappe"
        doc.flags.ignore_permissions = True
        if meta.is_submittable and doc.docstatus == 0:
            doc.submit()
        else:
            doc.save()
    finally:
        frappe.flags.in_install = orig_install

    frappe.db.commit()

    if notes:
        doc.add_comment("Comment", _("Approved with remarks: {0}").format(notes))
    else:
        doc.add_comment("Comment", _("Form approved and submitted by {0}").format(user_info["emp_name"]))

    return {
        "success": True,
        "name": doc.name,
        "doctype": doctype,
        "docstatus": doc.docstatus,
        "workflow_state": doc.get(wf_info["wf_state_field"]),
        "approved_by": user_info["emp_name"],
        "approval_date": today_date,
        "approval_time": now_time
    }


@frappe.whitelist()
def reject_form(doctype, name, reason=None):
    """
    Rejects the document. Sets workflow_state = 'Rejected' and records reason.
    """
    doctype, name = resolve_doctype_and_name(doctype, name)

    if not frappe.db.exists(doctype, name):
        frappe.throw(_("Document {0} {1} does not exist").format(doctype, name), frappe.DoesNotExistError)

    user = frappe.session.user
    if not (check_user_can_verify(user, doctype) or check_user_can_approve(user, doctype)):
        frappe.throw(_("User {0} is not authorized to reject {1}").format(user, doctype), frappe.PermissionError)

    if not reason or not str(reason).strip():
        reason = "Rejected during quality review"

    doc = frappe.get_doc(doctype, name)
    user_info = get_user_and_employee_info(user)

    wf_info = get_workflow_states_for_doctype(doctype)
    target_state = wf_info["rejection_state"]
    doc.set(wf_info["wf_state_field"], target_state)

    meta = frappe.get_meta(doctype)
    status_f = meta.get_field("status")
    if status_f:
        if status_f.fieldtype == "Select":
            options = (status_f.options or "").split("\n")
            if "Rejected" in options:
                doc.status = "Rejected"
        else:
            doc.status = "Rejected"

    if meta.get_field("sanitation_result"):
        doc.sanitation_result = "Fail"
    if meta.get_field("rejection_reason"):
        doc.rejection_reason = reason

    # Set comments/remarks in whichever field exists on the DocType
    remark_fields = ["rejection_reason", "overall_remarks", "remarks", "comments", "overall_comments", "incident_note"]
    for rf in remark_fields:
        if meta.get_field(rf):
            val = reason if rf == "rejection_reason" else f"[REJECTED: {reason}]"
            setattr(doc, rf, val)
            break

    orig_install = frappe.flags.in_install
    try:
        frappe.flags.in_install = "frappe"
        doc.flags.ignore_permissions = True
        doc.save()
    finally:
        frappe.flags.in_install = orig_install

    frappe.db.commit()

    doc.add_comment("Comment", _("Form rejected by {0}. Reason: {1}").format(user_info["emp_name"], reason))

    return {
        "success": True,
        "name": doc.name,
        "doctype": doctype,
        "workflow_state": target_state,
        "rejection_reason": reason,
        "rejected_by": user_info["emp_name"]
    }


@frappe.whitelist()
def mark_form_incident(doctype, name, incident_title=None, description=None, production_line=None):
    """
    Links a rejected form directly to a Plant Incident record.
    """
    doctype, name = resolve_doctype_and_name(doctype, name)
    if not frappe.db.exists(doctype, name):
        frappe.throw(_("Document {0} {1} does not exist").format(doctype, name), frappe.DoesNotExistError)
    doc = frappe.get_doc(doctype, name)
    user = frappe.session.user
    wo = getattr(doc, "work_order", None) or getattr(doc, "work_order_id", None)
    rejection = getattr(doc, "rejection_reason", None) or getattr(doc, "remarks", "")

    title = incident_title or f"Form Failure / Rejected Record: {doctype} - {name}"
    desc = description or f"Operational document {name} ({doctype}) was rejected.\nReason: {rejection}"

    incident = frappe.new_doc("Plant Incident")
    incident.incident_title = title
    incident.category = "Quality Alert"
    incident.severity = "Medium"
    incident.status = "Open"
    incident.investigation_status = "Pending"
    incident.detection_type = "Manual Flag"
    incident.source_doctype = doctype
    incident.source_name = name
    incident.reported_by = user
    incident.reported_time = frappe.utils.now()
    incident.description = desc

    if wo and frappe.db.exists("Work Order", wo):
        incident.work_order = wo
        wo_doc = frappe.get_doc("Work Order", wo)
        incident.production_item = wo_doc.production_item
        incident.production_line = production_line or wo_doc.get("production_line") or "FL1"
    else:
        incident.production_line = production_line or "Water Treatment"

    incident.flags.ignore_permissions = True
    incident.insert()
    frappe.db.commit()

    return {
        "success": True,
        "incident_name": incident.name,
        "incident_title": incident.incident_title,
        "status": incident.status
    }
