import frappe

SUPER_ROLES = {"Administrator", "System Manager", "IslandChill Admin User"}

@frappe.whitelist()
def get_user_portal_permissions(user=None):
    """
    Returns effective portal permissions (allowed_pages and allowed_forms)
    for the current user based on their assigned roles and 'IslandChill Role Permission' records.
    """
    if not user:
        user = frappe.session.user

    user_roles = set(frappe.get_roles(user))
    is_super_admin = bool(user_roles & SUPER_ROLES) or user == "Administrator"

    # Fast in-memory cache check
    cache_key = f"islandchill_user_portal_perms_{user}"
    cached = frappe.cache.get_value(cache_key)
    if cached:
        return cached
    
    # Query all active permission configurations
    all_configs = frappe.get_all(
        "IslandChill Role Permission",
        filters={"is_active": 1},
        fields=["name", "role"]
    )
    
    all_known_pages = {}
    all_known_forms = {}
    matched_configs = []
    
    for cfg_summary in all_configs:
        doc = frappe.get_cached_doc("IslandChill Role Permission", cfg_summary.name)
        if doc.role in user_roles:
            matched_configs.append(doc)
            
        for p in doc.pages:
            all_known_pages[p.page_id] = p.page_name
            
        for f in doc.forms:
            form_entry = {
                "form_code": f.form_code,
                "form_title": f.form_title,
                "doctype_name": f.doctype_name,
                "can_view": 1,
                "can_create": 1 if is_super_admin else 0,
                "can_verify": 1 if is_super_admin else 0,
                "can_approve": 1 if is_super_admin else 0,
            }
            if f.form_code and f.form_code not in all_known_forms:
                all_known_forms[f.form_code] = form_entry
            if f.doctype_name and f.doctype_name not in all_known_forms:
                all_known_forms[f.doctype_name] = form_entry

    if is_super_admin:
        res = {
            "is_super_admin": True,
            "user": user,
            "roles": list(user_roles),
            "allowed_pages": list(all_known_pages.keys()) if all_known_pages else ["*"],
            "allowed_forms": {
                key: {
                    "can_view": True,
                    "can_create": True,
                    "can_verify": True,
                    "can_approve": True,
                    "form_title": f["form_title"],
                    "doctype_name": f["doctype_name"],
                    "form_code": f.get("form_code", key)
                }
                for key, f in all_known_forms.items()
            }
        }
        frappe.cache.set_value(cache_key, res, expires_in_sec=300)
        return res

    effective_pages = set()
    effective_forms = {}

    for doc in matched_configs:
        for p in doc.pages:
            if p.allowed:
                effective_pages.add(p.page_id)
                
        for f in doc.forms:
            keys = [k for k in (f.form_code, f.doctype_name) if k]
            for key in keys:
                if key not in effective_forms:
                    effective_forms[key] = {
                        "can_view": bool(f.can_view),
                        "can_create": bool(f.can_create),
                        "can_verify": bool(f.can_verify),
                        "can_approve": bool(f.can_approve),
                        "form_title": f.form_title,
                        "doctype_name": f.doctype_name,
                        "form_code": f.form_code
                    }
                else:
                    effective_forms[key]["can_view"] = effective_forms[key]["can_view"] or bool(f.can_view)
                    effective_forms[key]["can_create"] = effective_forms[key]["can_create"] or bool(f.can_create)
                    effective_forms[key]["can_verify"] = effective_forms[key]["can_verify"] or bool(f.can_verify)
                    effective_forms[key]["can_approve"] = effective_forms[key]["can_approve"] or bool(f.can_approve)

    for key, kf in all_known_forms.items():
        if key not in effective_forms:
            effective_forms[key] = {
                "can_view": True,
                "can_create": False,
                "can_verify": False,
                "can_approve": False,
                "form_title": kf["form_title"],
                "doctype_name": kf["doctype_name"],
                "form_code": kf["form_code"]
            }

    res = {
        "is_super_admin": False,
        "user": user,
        "roles": list(user_roles),
        "allowed_pages": sorted(list(effective_pages)),
        "allowed_forms": effective_forms
    }
    frappe.cache.set_value(cache_key, res, expires_in_sec=300)
    return res


@frappe.whitelist(allow_guest=True, methods=["POST", "GET"])
def mes_logout():
    """
    Completely terminates the user session on Frappe/ERPNext backend.
    Cleans up session from database, cache, cookie manager, and sends expired cookie headers.
    """
    user = frappe.session.user
    sid = frappe.session.sid

    if user and user != "Guest" and hasattr(frappe.local, "login_manager"):
        try:
            frappe.local.login_manager.logout()
        except Exception:
            pass

    if sid and sid != "Guest":
        from frappe.sessions import delete_session
        try:
            delete_session(sid, user=user, reason="User Logged Out via MES")
        except Exception:
            pass

    if user:
        try:
            frappe.cache.delete_value(f"islandchill_user_portal_perms_{user}")
        except Exception:
            pass

    frappe.db.commit()

    if hasattr(frappe.local, "cookie_manager"):
        try:
            for c in ["sid", "system_user", "user_id", "full_name", "user_image", "user_lang"]:
                frappe.local.cookie_manager.delete_cookie(c)
        except Exception:
            pass

    return {
        "success": True,
        "message": "Logged out successfully"
    }



@frappe.whitelist()
def clear_user_portal_permissions_cache(user=None):
    if user:
        frappe.cache.delete_value(f"islandchill_user_portal_perms_{user}")
    else:
        try:
            frappe.cache.delete_keys("islandchill_user_portal_perms_")
        except Exception:
            pass
    return {"success": True}


@frappe.whitelist()
def export_role_permissions_fixture():
    import json
    roles = frappe.get_all('IslandChill Role Permission', fields=['name'], order_by='name')
    docs = []
    for r in roles:
        doc = frappe.get_doc('IslandChill Role Permission', r.name)
        docs.append(doc.as_dict())

    path = '/home/anantdv/frappe-islandchill/apps/islandchill/islandchill/fixtures/islandchill_role_permission.json'
    with open(path, 'w') as f:
        json.dump(docs, f, indent=2, default=str)
    return {"success": True, "count": len(docs)}


@frappe.whitelist()
def get_configured_form_doctypes(category=None):
    """
    Returns dynamically configured DocTypes from 'IslandChill Role Form Item'.
    Zero hardcoded arrays in frontend and backend.
    """
    cache_key = f"islandchill_configured_form_doctypes_{category or 'all'}"
    cached = frappe.cache.get_value(cache_key)
    if cached:
        return cached

    items = []
    if frappe.db.table_exists("IslandChill Role Form Item"):
        items = frappe.db.sql("""
            SELECT DISTINCT form_code, doctype_name, form_title
            FROM `tabIslandChill Role Form Item`
            WHERE doctype_name IS NOT NULL AND doctype_name != ''
            ORDER BY idx ASC
        """, as_dict=True)

    if not items:
        # Fallback to fixture file if database table not yet populated
        import os
        import json
        fixture_path = frappe.get_app_path("islandchill", "fixtures", "islandchill_role_permission.json")
        if os.path.exists(fixture_path):
            try:
                with open(fixture_path, "r") as f:
                    data = json.load(f)
                    if data and isinstance(data, list) and len(data) > 0:
                        items = data[0].get("forms", [])
            except Exception:
                pass

    def classify(form_code, dt):
        code = (form_code or "").lower()
        dtn = (dt or "").lower()
        if code.startswith("clean-") or any(k in dtn for k in ["cleaning", "sanitation", "balance check", "incubator", "cip"]):
            return "cleaning"
        if code.startswith("safety-") or any(k in dtn for k in ["accident", "first aid", "swab", "induction", "screening", "injury"]):
            return "safety"
        if code.startswith("maint-") or any(k in dtn for k in ["maintenance", "breakdown", "handover"]):
            return "maintenance"
        if code.startswith("form") or any(k in dtn for k in ["micro", "chemical", "autoclave", "sensory", "photometer", "seam", "weight check", "taste", "monitoring", "rum", "cola", "traceability", "rinse-off", "recall", "library"]):
            return "laboratory"
        return "other"

    if category:
        filtered = []
        seen = set()
        for item in items:
            dt = item.get("doctype_name")
            if dt and dt not in seen:
                if classify(item.get("form_code"), dt) == category:
                    seen.add(dt)
                    filtered.append(dt)
        frappe.cache.set_value(cache_key, filtered, expires_in_sec=3600)
        return filtered

    grouped = {"cleaning": [], "laboratory": [], "safety": [], "maintenance": [], "other": [], "all": []}
    seen = set()
    for item in items:
        dt = item.get("doctype_name")
        if dt and dt not in seen:
            seen.add(dt)
            cat = classify(item.get("form_code"), dt)
            grouped[cat].append(dt)
            grouped["all"].append(dt)

    frappe.cache.set_value(cache_key, grouped, expires_in_sec=3600)
    return grouped


@frappe.whitelist()
def set_baseline_role_tab_permissions():
    """Configures tab-level visibility baseline across operational roles from dynamic fixture."""
    import os
    import json
    fixture_path = frappe.get_app_path("islandchill", "fixtures", "islandchill_role_permission.json")
    if not os.path.exists(fixture_path):
        return {"success": False, "message": "Fixture file not found"}

    with open(fixture_path, "r") as f:
        data = json.load(f)

    updated = {}
    for item in data:
        role_name = item.get("role") or item.get("name")
        if not role_name:
            continue
        allowed_pages = [p["page_id"] for p in item.get("pages", []) if p.get("allowed")]
        if frappe.db.exists("IslandChill Role Permission", role_name):
            doc = frappe.get_doc("IslandChill Role Permission", role_name)
            for page_item in doc.pages:
                page_item.allowed = 1 if page_item.page_id in allowed_pages else 0
            doc.save(ignore_permissions=True)
            updated[role_name] = allowed_pages

    frappe.db.commit()
    clear_user_portal_permissions_cache()
    return {"success": True, "updated": updated}

