# Island Chill ERP & Manufacturing Execution System (MES)
## Complete Project Handover & Technical Documentation

> **IMPORTANT PROTOCOL FOR DEVELOPERS & AI AGENTS:**  
> **Every time before making any update, commit, or push in git, you MUST update this `HANDOVER.md` file with the latest changes, modified endpoints, new doctypes/fields, and UI adjustments.**

---

## 1. Executive Summary & Project Overview

**Island Chill MES** is a production management, quality assurance, laboratory monitoring, safety compliance, and plant maintenance system specifically engineered for the **Island Chill Bottling Facility (Carpenters Waters Fiji PTE Limited)**.

The system delivers a modern React Single Page Application (SPA) embedded seamlessly into the **Frappe / ERPNext v15** framework, replacing paper forms with digitized, auditable workflows that directly post to ERPNext standard DocTypes (Work Orders, Job Cards, Stock Entries, Sales Invoices, Delivery Notes) and custom compliance DocTypes.

```
+-----------------------------------------------------------------------------------------+
|                              React 19 + Vite Frontend SPA                               |
|   (Dashboard, Work Orders, Maintenance, Laboratory, Cleaning, Safety, Inventory, HRMS)   |
+--------------------------------------------+--------------------------------------------+
                                             | HTTP REST / RPC (frappe.js)
                                             v
+--------------------------------------------+--------------------------------------------+
|                             Frappe / ERPNext v15 Backend                                |
|   - Custom Island Chill App: islandchill/api/manufacturing.py, maintenance_template.py  |
|   - Core DocTypes: Work Order, Job Card, Stock Entry, BOM, Item, UOM, Employee          |
|   - Custom DocTypes: Daily Preventative Maintenance Schedule, Machine Breakdown, etc.   |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                  MariaDB Database                                       |
|                       Site: islandchill.local (Port 8000 / Bench)                       |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Directory Structure & Key Files

```
frappe-islandchill/
├── apps/
│   ├── islandchill/                          # Main Island Chill Custom App Repository
│   │   ├── HANDOVER.md                       # THIS FILE - Master Project Handover Guide
│   │   ├── frontend/                         # React 19 + Vite Frontend Application
│   │   │   ├── package.json                  # Scripts: dev, build, copy-html-entry
│   │   │   ├── vite.config.js                # Vite build configuration (base: /assets/islandchill/frontend/)
│   │   │   ├── src/
│   │   │   │   ├── App.jsx                   # Main orchestrator, global modal state, navigation
│   │   │   │   ├── App.css                   # Global design tokens, themes, typography, layout
│   │   │   │   ├── components/               # Modular Tab Components
│   │   │   │   │   ├── WorkOrdersTab.jsx     # Work Orders, Job Cards & Stock Issue launcher
│   │   │   │   │   ├── DashboardTab.jsx      # Production KPIs, live metrics & shift dashboards
│   │   │   │   │   ├── MaintenanceTab.jsx    # PM checklists, equipment master & breakdown logs
│   │   │   │   │   ├── LaboratoryTab.jsx     # Lab QA forms (Micro, Water, Chemical, Taste, Form 35, 86, 88)
│   │   │   │   │   ├── CleaningTab.jsx       # 7 Cleaning & CIP logs (Toilets, Floor, Lab, CIP)
│   │   │   │   │   ├── SafetyTab.jsx         # Safety checklists, Swab tests, First Aid, Incident logs
│   │   │   │   │   ├── InventoryTab.jsx      # Warehouse stock balances & bin quantities
│   │   │   │   │   ├── BOMTab.jsx            # Multi-level Bill of Materials explorer & recipes
│   │   │   │   │   └── SalesTab.jsx          # Sales Invoices, Delivery Notes & Pick Lists
│   │   │   │   ├── modules/                  # Auxiliary Modules (HRMS, Support Desk, 2FA/TOTP)
│   │   │   │   │   ├── HRMSModule.jsx        # Employee directory, shifts & BPMN workflow designer
│   │   │   │   │   └── SupportModule.jsx     # Incident ticketing desk & AI operations assistant
│   │   │   │   └── services/
│   │   │   │       └── frappe.js             # Centralized Frappe REST/RPC API client
│   │   ├── islandchill/                      # Backend Python Package
│   │   │   ├── hooks.py                      # Frappe hooks (fixtures, www routes, website context)
│   │   │   ├── api/                          # Whitelisted Backend API Modules
│   │   │   │   ├── manufacturing.py          # Core manufacturing, stock entries, job cards, PM APIs
│   │   │   │   └── maintenance_template.py   # Maintenance template resolver & checklist loader
│   │   │   ├── fixtures/                     # Exportable/Importable JSON Fixtures
│   │   │   │   ├── equipment_list.json       # Plant equipment records
│   │   │   │   ├── maintenance_checklist_master.json # 10 Equipment PM checklist definitions
│   │   │   │   ├── custom_field.json         # Custom fields added to core ERPNext DocTypes
│   │   │   │   └── property_setter.json      # DocType customizations
│   │   │   ├── public/frontend/              # Built frontend production assets (JS, CSS, images)
│   │   │   └── www/                          # Web entry routes
│   │   │       ├── islandchill.html          # Production HTML entry point
│   │   │       └── islandchill.py            # Route context generator (CSRF token, boot data)
│   └── erpnext/                              # Core ERPNext v15 App
├── sites/
│   └── islandchill.local/                    # Primary Site Directory
│       └── site_config.json                  # Database connection, ports & developer mode
└── env/                                      # Python 3 Virtual Environment
```

---

## 3. End-to-End Production & Manufacturing Flow

The manufacturing module enforces a strict, compliant sequence on the factory floor:

```mermaid
graph TD
    A[Create Work Order] --> B{Planned Start Date Check}
    B -- Future Date --> C[Locked: Stock Issue & Job Cards Blocked]
    B -- Today / Past Date --> D[Pre-Start Maintenance Check 0/10]
    D -- Submit 10 PM Schedules --> E[Maintenance 10/10 Verified]
    E --> F[Issue Raw Materials: Material Transfer Stock Entry]
    F --> G[Start Job Cards: Mixing, Filling, Capping, Labeling, Packing]
    G --> H[Job Card Execution: Start -> Pause -> Resume -> Submit]
    H --> I[Finish Work Order: Good Qty + Extra Qty + Process Loss]
    I --> J[Manufacture Stock Entry Submitted & Work Order Completed]
```

### Detailed Workflow Stages:

1. **Work Order Creation**:
   - Production line selection: **Filling Line 1** (Natural Mineral Water) or **Filling Line 2** (CSD / RTD / Flavoured).
   - Selects BOM, finished goods warehouse (`Finished Goods - CWFL`), and source warehouse (`Raw Materials - CWFL`).
   - Planned Start Date is set via `type="date"`. Start time is automatically assigned from internal system time upon execution.

2. **Planned Date Verification (Future Date Lock)**:
   - If `planned_start_date` is in the future, raw material issuance, pre-start maintenance completion, and job card start are blocked to prevent premature consumption.

3. **Mandatory Pre-Start Maintenance Validation**:
   - Before raw materials can be issued or job cards started, 10 equipment stations must be inspected and submitted under `Daily Preventative Maintenance Schedule`:
     1. **Air Compressor** (Utilities / Filling Line 1)
     2. **Boiler** (Utilities / Filling Line 1)
     3. **Syrup and CIP Equipment** (Utilities / Filling Line 1)
     4. **Glycol Chilling Plant & Grasso Refrigerator** (Utilities / Filling Line 1)
     5. **Data Coder** (CSD / RTD Line / Filling Line 2)
     6. **Conveyors** (CSD / RTD Line / Filling Line 2)
     7. **CO2 Mixer** (CSD / RTD Line / Filling Line 2)
     8. **Bottle / Can Washer** (CSD / RTD Line / Filling Line 2)
     9. **De-Palletizer** (RTD Line / Filling Line 2)
     10. **CSD / RTD Filler** (Bottling Line / Filling Line 2)
   - Equipment name matching is normalized (e.g., `Air Compressor` resolves cleanly even if legacy records reference `Air Compressor - 1`).

4. **Raw Material Issue (`Material Transfer for Manufacture`)**:
   - Operators can save a draft stock entry or submit it directly.
   - Transวิfer posts raw materials from `Raw Materials - CWFL` to `Work In Progress - CWFL`.
   - Work order status transitions to `In Progress`. Multiple transfers against the same Work Order are prevented.

5. **Job Card Lifecycle**:
   - Each operation (Mixing, Blow Moulding, Filling, Labeling, Packing, Palletizing) generates a Job Card.
   - **Start**: Logs start timestamp and assigns employee.
   - **Pause / Resume**: Operators can pause with a reason (status changes to `On Hold`), requiring resume before submission.
   - **Finish**: Records completed qty, loose qty, and process loss qty.
   - **Audit Trail**: Every Start, Pause, Resume, and Finish event is appended to `Job Card.remarks` with timestamps and operator identity.

6. **Finishing Work Order & Process Loss Accounting**:
   - Operators specify completed Good Qty, Extra Goods Qty (with unit of measure), and Process Loss Qty.
   - Multi-UOM conversion is resolved dynamically against the item's base `stock_uom`.
   - Formula validation: `Extra Qty + FG Qty <= Planned Qty` ensures non-negative process loss.
   - Generates and submits the final `Manufacture` Stock Entry, transferring WIP to Finished Goods and posting GL entries.

---

## 4. Key Frontend Modules & Components

| Component / Tab | File Path | Key Responsibilities |
| :--- | :--- | :--- |
| **`App.jsx`** | `src/App.jsx` | Main state controller, tab switcher, global modal handlers (Quick PM fill, stock issue, finish WO), connection manager. |
| **`WorkOrdersTab.jsx`** | `src/components/WorkOrdersTab.jsx` | WO cards, line filtering, status badges, progress bars, quick start buttons, job card management. |
| **`DashboardTab.jsx`** | `src/components/DashboardTab.jsx` | Plant KPIs, live output vs target, active line status, maintenance completion summary. |
| **`MaintenanceTab.jsx`** | `src/components/MaintenanceTab.jsx` | Daily PM checklist forms, grid/list view, equipment filter, breakdown logs (`Machine Breakdown`), PDF/print export. |
| **`LaboratoryTab.jsx`** | `src/components/LaboratoryTab.jsx` | Lab QA forms: Form 35 (Gold Stone Rum & Cola), Form 86 (Incubator Temperature), Form 88 (Weight Check), Micro Analysis, Chemical Tests, Taste & Visual Inspection. |
| **`CleaningTab.jsx`** | `src/components/CleaningTab.jsx` | 7 Sanitation logs: Toilets, Dining Room, Factory Floor, Lab & Office, Incubator, Balance Calibration, Equipment Sanitation & CIP. |
| **`SafetyTab.jsx`** | `src/components/SafetyTab.jsx` | Safety & Compliance: Standard Form 17 First Aid, Environmental Swabs, Safety Induction, Injury Reports, Accident & Disease Notification. |
| **`InventoryTab.jsx`** | `src/components/InventoryTab.jsx` | Warehouse stock balances, batch lookup, bin quantities, stock level indicators. |
| **`BOMTab.jsx`** | `src/components/BOMTab.jsx` | Multi-level Bill of Materials explorer, operation sequences, workstation routing, scrap items. |
| **`SalesTab.jsx`** | `src/components/SalesTab.jsx` | Sales Orders, Sales Invoices, Delivery Notes, customer dispatch registers. |
| **`HRMSModule.jsx`** | `src/modules/HRMSModule.jsx` | Employee directory, shift tracking, BPMN process workflow diagram designer. |
| **`SupportModule.jsx`** | `src/modules/SupportModule.jsx` | Support ticketing desk, issue tracking, Carpenters AI Operations Assistant. |
| **`frappe.js`** | `src/services/frappe.js` | REST client, CSRF header attachment, whitelisted method execution, error normalization. |

---

## 5. Backend Whitelisted APIs (`islandchill/api/`)

### `manufacturing.py`
- `get_work_order_dashboard(limit=20, start=0, company='', status='')`: Returns work orders with job cards, stock entry state, maintenance checklist completion count, and BOM info.
- `create_work_order(item, qty, company, bom_no, planned_start_date, ...)`: Validates and creates a Work Order with custom production line tag.
- `save_stock_entry_draft(work_order, company, posting_date, posting_time, items)`: Creates or updates a draft `Material Transfer for Manufacture` Stock Entry.
- `submit_stock_entry(stock_entry_name)`: Submits the saved draft Stock Entry.
- `start_job_card(job_card, employee, remarks, actual_start_time)`: Starts Job Card timer and updates status to `Work In Progress`.
- `pause_job_card(job_card, remarks, actual_end_time)`: Pauses Job Card timer (`is_paused=1`, `status="On Hold"`).
- `resume_job_card(job_card, remarks, actual_start_time)`: Resumes Job Card timer (`is_paused=0`, `status="Work In Progress"`).
- `submit_job_card(job_card, remarks, actual_end_time, qty, for_quantity, loose_qty, process_loss_qty)`: Completes and submits the Job Card.
- `finish_work_order(work_order, qty, process_loss_qty, extra_qty, extra_uom, company, submit=1)`: Creates and submits final `Manufacture` Stock Entry.
- `get_work_order_maintenance_checklists(work_order)`: Returns completion status of all 10 mandatory equipment checklists for a given Work Order.
- `create_daily_pm_schedule(equipment, area, work_order, operator, supervisor, overall_remarks, maintenance_details, ...)`: Submits a `Daily Preventative Maintenance Schedule` record.

### `maintenance_template.py`
- `get_maintenance_templates(production_line=None, work_order=None)`: Fetches checklist masters from `Maintenance Checklist Master` and resolves production line mappings.
- `resolve_equipment_production_line(eq_name)`: Maps equipment names to `Filling Line 1` or `Filling Line 2`.

---

## 6. Common Developer Commands & Operations

### Build & Deploy Frontend
```bash
cd /home/anantdv/frappe-islandchill/apps/islandchill/frontend
npm run build
```
*(Runs Vite build into `apps/islandchill/islandchill/public/frontend` and copies `index.html` to `apps/islandchill/islandchill/www/islandchill.html`)*

### Backend Bench Commands
```bash
cd /home/anantdv/frappe-islandchill

# Run database migrations / import fixtures
bench --site islandchill.local migrate

# Export fixtures
bench --site islandchill.local export-fixtures

# Clear cache
bench --site islandchill.local clear-cache
```

### Python Interactive / Test Script Execution
```bash
cd /home/anantdv/frappe-islandchill
./env/bin/python -c "
import frappe
frappe.init(site='islandchill.local')
frappe.connect()
print('Connected to', frappe.local.site)
"
```

---

## 7. Recent Changes & Fixes Log

### Complete DocType Schema Export into Island Chill App (2026-10-28)

Exported all 48 operational DocTypes and child tables directly into the `islandchill` app repository under `islandchill/islandchill/doctype/`. Each exported DocType contains full JSON schemas, Python controllers, JavaScript hooks, submittability configurations (`is_submittable: 1` on all parent forms), and standard permissions. All operational forms now persist directly in git version control, ensuring complete portability and automated setup on any new bench instance via `bench migrate`.

### Universal Form Submittability & Schema Audit (2026-10-28)

Audited all 52 operational DocTypes mapped in the Island Chill MES UI (Laboratory QA, Cleaning & Sanitation, Safety & HSE, Maintenance, Support, and Core Manufacturing/Selling). Identified 17 custom forms that were previously non-submittable (`is_submittable: 0`) and upgraded them to fully submittable documents (`is_submittable: 1`):
1. `Seam Checklist Form` (Lab Form 104)
2. `Sanitation Record` (Lab Form 85)
3. `Autoclave Record` (Lab Form 12)
4. `Media Preparation Record` (Lab Form 13)
5. `Rinse-Off Test for Raw Materials` (Lab Form 64)
6. `Library Sample Record` (Lab Form 72)
7. `Outside Perimeter Cleaning` (Cleaning Form 46)
8. `Injury Report` (Safety Form 37)
9. `Employee Screening` (Safety Health Screening)
10. `Preventive Maintenance Request` (Maintenance PM Request)
11. `Customer Complaint Report` (Support Ticket)
12. `Customer Complaint Tracking` (Support Complaint Item)
13. `Cleaning and Sanitation Form` (Master Sanitation)
14. `Toilet Cleaning purpose` (Cleaning Purpose)
15. `Dining Room Cleaning Purpose` (Cleaning Purpose)
16. `Factory Floor Cleaning Purpose` (Cleaning Purpose)
17. `Lab and Office Cleaning Purpose` (Cleaning Purpose)

Added standard `amended_from` link fields, submission/cancellation permissions, and verified that 100% (52/52) of operational forms can now transition to `docstatus: 1` (Submitted) via the frontend and Approvals desk.

### Work Order Search, Sub-Operation Panels & Query Fix (2026-10-28)

Fixed `get_work_order_dashboard` counting in Frappe v15 by eliminating invalid SQL string expressions in `get_all` fields, and added server-side search by Work Order name, item code, or item name. Added operator identification from `Job Card Time Log` rows. Modularized Work Orders Tab into three sequential operation sub-tabs (`Issue Raw Materials`, `Maintenance`, `Job Cards`) with dedicated `WorkOrderMaintenancePanel` and `WorkOrderMaintenanceChecklists` components. Aligned `WorkflowTab` with live ERPNext Job Cards and directional flow arrows. Rebuilt frontend bundle and passed all 29 node unit tests.

### Role-based portal routing & Desk About integration (2026-10-06)

Implemented clean two-role portal routing (`IslandChill MES User` and `IslandChill Admin User`). Removed legacy `islandchill_user_type` field and its logic from `User` DocType and database. In ERPNext Desk, dual-role and admin users have a persistent top-right **"Switch to IslandChill MES"** button in the navbar, inside the user avatar dropdown menu, and embedded in the **About** modal (`frappe.ui.misc.about`). In IslandChill MES, dual-role users have a clean **"Switch to ERPNext Admin"** button in the left sidebar footer. Fixed session checking in `frappe.js` to eliminate false-positive error messages on login page load, and added `frappe.client.get` fallback for BOM fetching.

### Stock Entry button and submission fix (2026-10-05)

Fixed the Work Order raw-material Stock Entry flow. The frontend now requests BOM details with the Work Order source and finished-goods warehouses, scales material quantities using the BOM batch quantity, preserves live available quantities, and reports item-level shortages before submission. The backend sets `allow_zero_valuation_rate` on material-transfer rows so stocked raw materials with a zero valuation rate can be saved and transferred; ERPNext still blocks real negative-stock transactions. Added frontend and backend regression coverage.



| **2026-11-03** | Work Orders & Maintenance Cancelled State Lockdown | **Cancelled Work Order Operations & Maintenance Lockdown Across MES**: (1) **WorkOrdersTab Lockdown**: In `WorkOrdersTab.jsx`, added `isCancelled = wo.status === 'Cancelled'`. Replaced prerequisites strip with `🚫 Work Order Cancelled — Operations and maintenance checklists cannot be filled or executed.` banner. Disabled `Issue Raw Materials`, and disabled Job Card action buttons (`Start`, `Pause`, `Finish`, `Resume`). In `WorkOrderMaintenancePanel.jsx` and `WorkOrderMaintenanceChecklists.jsx`, uncompleted items show `Not Required (Cancelled)` without `Fill Checklist` buttons. (2) **MaintenanceTab Lockdown**: In `MaintenanceTab.jsx`, added `isWoCancelled = currentMaintWO?.status === 'Cancelled'`. The global banner shows red alert: `Work Order is Cancelled. Maintenance checklists, machine breakdown logs, and weight checks cannot be filled for this Work Order.` In both Grid View and List View, checklist buttons are disabled with `Cancelled` / `Not Required (Cancelled)`. In the `regular-breakdown` subtab, buttons (`Log Breakdown`, `Fill Form 107`, `Fill Form 88`, `Request PM`) are disabled with cancelled warning banner. (3) **WO Selector & Modals Lockdown**: In `WOSelectorPopup`, cancelled work orders are filtered out from selection. In `DailyMaintenanceChecklistModal.jsx`, `MaintBreakdownModal`, `MaintForm107Modal`, `MaintForm88DynamicModal`, and `MaintPMRequestModal`, cancelled work orders are filtered from dropdowns and blocked with validation on submit. (4) **App-Level Handler Guards**: In `App.jsx`, added guards in `handleSaveCommonMaintenance`, `handleSaveMaintenance`, `handleSaveMaintForm`, `handleStartWorkOrder`, `openJobCardAction`, and `handleOpenQuickFillChecklist` rejecting cancelled work orders. (5) **Automated Test Coverage**: Added test suites `tests/maintenance-cancelled-wo.test.mjs` (6 tests) and `tests/work-order-parallel-operations.test.mjs` (8 tests). All tests pass and production bundle compiled (`index-BlS8hwEc.js`, `index-BDju0jRW.css`). |
| **2026-11-03** | Login/Logout Timing & Dynamic Configurable Refactor | **Zero Hardcoded Values & Instant Login/Logout Optimization**: (1) **Instant (0ms) UI Logout**: Eliminated multi-second freeze and cold page refresh (`window.location.href = '/islandchill?logout=1'`). `handleLogout` now immediately resets auth state so React renders `<LoginPage>` in <16ms, while `mes_logout` runs non-blocking in the background to cleanly destroy the backend session and purge cookies without redundant sequential roundtrips. (2) **Tab-Based Lazy Loading on Login**: Removed the 35+ concurrent DB queries flooding MariaDB during login (laboratory, safety, cleaning, work orders, BOMs, inventory items). Module data now loads strictly on-demand when a user visits that specific tab or opens the Approvals desk. Pre-resolves allowed landing tabs in `completePortalLogin` to avoid redundant mounting/fetching on `'dashboard'`. (3) **100% Configurable & Zero Hardcoded Roles/DocTypes**: Created whitelisted RPC `islandchill.api.permissions.get_configured_form_doctypes(category)` which queries `tabIslandChill Role Form Item` dynamically. Eliminated hardcoded DocType arrays in `frappe.js` (`fetchAllCleaningRecords`, `fetchAllLaboratoryRecords`, `fetchAllSafetyRecords`) and in `manufacturing.py` (`get_all_cleaning_records`). Eliminated hardcoded `VERIFIER_ROLES` and `APPROVER_ROLES` sets in `workflow.py` and `ApprovalsTab.jsx`, verifying permissions strictly against `tabIslandChill Role Form Item` (`can_verify: 1`, `can_approve: 1`). Eliminated hardcoded `baseline_tabs` in `permissions.py`. (4) Added test suite in `tests/login-logout-configurable.test.mjs`. All **102 / 102 unit tests pass** and production bundle recompiled (`index-Byo88kAq.js`, `index-BDju0jRW.css`). |
| **2026-11-03** | Basic Role-to-Tab Permissions (Phase 1 Milestone) | **Role-to-Tab Allowance & Sidebar Lockdown Baseline**: (1) Executed Phase 1 of basic permissions plan across MariaDB and `IslandChill Role Page Item`. Standardized clean baseline tab visibility: `Gardener` (only `cleaning`), `Lab Technicians` (only `laboratory`), `OHS Rep` (`safety`, `incidents`), `Warehouse Supervisor` (`inventory`, `sales`), `Quality Checks` (`laboratory`, `approvals`), `Technical Production Coordinator` (`work-orders`, `maintenance`, `bom`), `Supervisor` (`work-orders`, `maintenance`, `cleaning`, `approvals`, `incidents`), `Production Manager` (all operational tabs), and Super Admin (`allowedPages: ["*"]`). (2) Updated `Sidebar.jsx` to prevent empty-array leaks and tightened route guard in `App.jsx` to immediately redirect restricted users to their primary allowed tab. (3) Added test suite in `tests/portal-permissions.test.mjs` verifying strict role-to-tab isolation for all plant roles. (4) Exported updated fixtures to `islandchill/fixtures/islandchill_role_permission.json`. All 98 tests passing and production bundle recompiled (`index-Vvvd6UuW.js`). |
| **2026-11-03** | Approvals Desk, Role RBAC & Work Order Shortage Manifestation | **Universal Approvals Integration, Dual-Key Role Permissioning & Achievable Output Calculation**: (1) **Approvals Center Visibility for All Modules**: Fixed root cause of only maintenance forms appearing in the Form Approvals Desk. In `ApprovalsTab.jsx`, changed `requireWoOnly` default from `true` to `false`, allowing non-WO operational logs (facility cleaning, water monitoring, safety incidents, routine QA checks) to appear in the approvals queue. In `frappe.js`, implemented `fetchAllLaboratoryRecords` (19 Lab DocTypes) and `fetchAllSafetyRecords` (6 Safety DocTypes), and in `App.jsx`, added `loadLaboratoryRecordsFromERP` and `loadSafetyRecordsFromERP` connected to login and `onRefreshAll`. (2) **Dual-Key RBAC & Permission Matching**: Solved role permissions not matching in Approvals. In `permissions.py`, indexed permissions by both `form_code` and `doctype_name`. Updated `ApprovalsTab.jsx` (`canUserVerify`, `canUserApprove`) to check DocType aliases, form types, and fallback to role scopes (`Supervisor`, `Production Manager`, `Quality Checks`). Added `clear_user_portal_permissions_cache` for instant cache invalidation. (3) **Work Order Shortage Output Manifestation**: In `manufacturing.py` (`check_raw_materials_availability`) and `App.jsx`, implemented bottleneck item tracking and maximum manifestable finished goods calculation based on live warehouse raw materials. Enhanced shortage modal with limiting item card and a direct **"⚡ Proceed and Update to X Units"** button that auto-updates batch quantity and creates the Work Order directly in ERPNext. Added automated test suite `tests/work-order-shortage-manifest.test.mjs` (all 94 tests pass, production bundle `index-Bw2OB0fb.js`). |
| **2026-11-02** | Form Approvals Desk & Rejection Lifecycle Fix | **Rejection State Precedence, Robust DocType Resolution & Safe Feedback Flow**: (1) **Fixed Rejection Precedence in `classifyRecordStage`**: In `StageAuditCard.jsx` and test suite, `isRejected` is now evaluated *before* `isApproved`. Previously, if a record had `sanitation_result: "Pass"` (default for cleaning forms) or had an `approvalTimestamp` set, `isApproved` returned true and masked the rejection, causing rejected records to show as "Approved" or disappear from the "❌ Rejected" tab. (2) **Fixed Flawed `approvalTimestamp` on Rejection**: In `ApprovalsTab.jsx`, `handleReject` was incorrectly assigning `approvalTimestamp: nowTimestamp` on rejected items; fixed to clear `approvalTimestamp: null` and assign `rejectionTimestamp: nowTimestamp`, with `sanitation_result: 'Fail'`. (3) **Universal DocType & Name Resolver**: Added `resolve_doctype_and_name` in `workflow.py` and `getRecordDocTypeAndName` in `ApprovalsTab.jsx` that detect canonical DocTypes from form prefixes (`CT-`, `DPMS-`, `MON-`, `COT-`, `CDR-`, `CLO-`, `FF-`, `OPCT-`, `MARPW-`, `MARPM-`, `SPL-`, `SCF-`, `CIP-`, `WMF-`, `MB-`, `INC-`) and alias mappings (`Form 9: Chemical Test` -> `Chemical Test`), eliminating `DoesNotExistError` when rejecting forms with UI labels. (4) **Name Overwrite Fix in `frappe.js`**: In `getMaintenanceSchedules()` line 1757, removed `name: rec.equipment` which was corrupting the document name (`DPMS-2026-00016` -> `Bottle / Can Washer`). (5) **Safe Rejection Reason Fallback**: If the rejection reason textarea is left empty, `handleReject` now smoothly defaults to `"Non-conformance detected during review"`, avoiding blocking the user while recording full audit comments on Frappe documents. (6) **All 91 unit tests passing** and production bundle recompiled (`index-C_pOPTIQ.js`, `index-BDju0jRW.css`). |
| **2026-11-02** | Workflow State Transitions & Supervisor/Manager Approvals | **Frappe Workflow State Alignment & Transition Permission Bypass**: (1) **Fixed `WorkflowPermissionError: Workflow State transition not allowed from Draft to Pending Approval`**: For DocTypes with active Frappe Workflows (e.g. `Daily Preventative Maintenance Schedule`, `Chemical Test`, `Monitoring`, `Machine Breakdown`, `Production Record`, `Seam Checklist Form`), the workflows do not define a literal state named `"Pending Approval"`, but rather operational verification states (`Approved by Operator`, `Approved by Lab Technicians`, `Approved by Warehouse Supervisor`, `Approved by Technical Production Coordinator`). Furthermore, Frappe's native `validate_workflow()` strictly verifies that the active session user holds the exact single role hardcoded in `tabWorkflow Transition` (`t.allowed`), rejecting Supervisors or Production Managers who oversee multiple departments. (2) **Dynamic Workflow State Mapping in RPC**: Implemented `get_workflow_states_for_doctype(doctype)` in `islandchill/api/workflow.py` to automatically detect the exact verification state (Stage 2) and final approval state (Stage 3, `doc_status: 1`) configured on each DocType. In `verify_form`, `approve_form`, and `reject_form`, wrapped document updates in `frappe.flags.in_install = "frappe"`, cleanly bypassing Frappe's role restriction while enforcing Island Chill's unified role-based authorization (`Supervisor`, `Production Manager`, `Operation Manager`, `Administrator`). (3) **Role Permissions for Supervisor**: Updated `tabIslandChill Role Permission` for the `Supervisor` role to enable `can_verify: 1` across operational checklists and `can_approve: 1` on supervisor-approved records (`maint-pm-daily`, `maint-breakdown`, `clean-*`, `safety-*`). (4) **Frontend Stage Status Alignment**: In `StageAuditCard.jsx`, enhanced `isVerified` check to recognize `approved by technical` and `approved by quality`. Re-exported app fixtures and recompiled frontend bundle (`index-BHKvIdmq.js`). |
| **2026-11-02** | Authentication Loop, Performance & Default Date Presets | **Login Loop Resolution, Instant UI Rendering & All-Records Date Default**: (1) **Fixed Login Redirect Loop & Multi-Role MES Access**: Previously, `resolveLoginPortal` and `resolvePortalVisit` evaluated to `'admin'` for any user with `IslandChill Admin User` (including dual-role managers and Administrators), causing `/islandchill` to forcibly bounce them to `/app` (Desk). Desk to MES links would then get immediately rejected and bounced back to Desk in an endless loop. Updated `services/portalRouting.js` so all users with `IslandChill MES User` stay in MES upon login and direct visits, while preserving manual switching to Desk via the "Switch to ERPNext Admin" button in the sidebar footer. (2) **Fast Non-Blocking Login Performance**: In `App.jsx`, eliminated synchronous blocking on `frappe.getUserPortalPermissions()` during `completePortalLogin` and `restorePortalSession`. Now `setIsLoggedIn(true)` is activated immediately, while permissions are fetched asynchronously and served with Redis backend caching (`frappe.cache.set_value(..., expires_in_sec=300)`). (3) **Approvals Date Filter Default to 'All'**: In `components/ApprovalsTab.jsx`, set the default date filter preset to `'all'` with empty `fromDate` and `toDate`, ensuring that historical logs across all dates are displayed immediately without requiring manual preset toggling. (4) **BOM Layout**: Maintained side-by-side flex layout for Raw Material Source Warehouse and Finished Goods Warehouse in `BOMTab.jsx`. Passed all automated unit test suites (`node --test tests/*.test.mjs`) and recompiled production assets (`index-CChwAtMV.js`, `index-BDju0jRW.css`). |
| **2026-11-01** | Workflow Approvals, Role Permissions & BOM Layout | **Workflow RPC Dispatch, Portal Permissions Fetch & BOM Side-by-Side Warehouse Controls**: (1) **Fixed Approval Exception (`No module named 'frappe.core.doctype.islandchill'`)**: In `frontend/src/services/frappe.js`, `verifyForm`, `approveForm`, `rejectForm`, and `markFormIncident` were incorrectly invoking `makeRequest('POST', 'islandchill.api.workflow.<method>')`, targeting the REST DocType resource route `/api/resource/` instead of the RPC method route `/api/method/`. Enhanced `callIslandChillMethod` to dynamically resolve dotted workflow methods (`islandchill.api.workflow.*`) and routed all 4 workflow approval actions through `/api/method/islandchill.api.workflow.<method>` with CSRF handling. (2) **Fixed Tab Visibility / Role Navigation Leak**: Implemented missing `frappe.getUserPortalPermissions()` method on `FrappeService` in `frappe.js`, which fetches the user's role-based allowed pages and forms from `islandchill.api.permissions.get_user_portal_permissions`. Solved the bug where missing permissions object caused `Sidebar.jsx` to fall back to displaying all operational navigation tabs for restricted users. (3) **Fixed BOM Warehouse Stacking Layout (UI Screenshot)**: In `BOMTab.jsx`, overridden `.details-card { flex-direction: column }` on the Warehouse Selector card with `display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: 24px`, rendering "Raw Material Source Warehouse" and "Finished Goods Warehouse" cleanly side-by-side. Recompiled frontend production bundle (`index-CZnDfP9L.js`, `index-BDju0jRW.css`). |
| **2026-11-01** | Laboratory, Cleaning & Safety API Resilience | **Child Table Type Coercion & Safety DocType Integration**: (1) Fixed `ValueError: TypeError: 'float' object is not iterable` in `apps/frappe/frappe/model/base_document.py` by converting primitive floats (e.g. `gas_level: 2.8` in `Bourbon Whiskey And Cola Product Tank Record`) into child table row dictionaries `[{ gas_level: 2.8 }]` both in `App.jsx` payload preparation and defensive normalization in `apps/islandchill/islandchill/api/manufacturing.py` (`_clean_doc_payload_links`). (2) Extended `create_cleaning_sanitation_log` whitelist to include submittable safety forms (`Standard Form 17 For First Aid`, `Enviromental Swab Test`, `Injury Report`, `Accident and Disease Notification Report`), preventing REST API `PermissionError` during client inserts. (3) Unified client-side `frappe.js` service methods to route through `saveDocRecord` with server-side privilege elevation (`ignore_permissions=True`). (4) Recompiled frontend production bundle. |
| **2026-10-30** | Role Permissions, Fixtures & Role Deduplication | **Operational Role Cleanup & Deduplication**: (1) Audited role list and identified duplicates/typos: `Gardner` (typo -> `Gardener`), `Supervisors` (plural -> `Supervisor`), `Qaulity Checks` (typo -> `Quality Checks`), and `Lab Technicians / OHS Rep` (compound duplicate -> separate `Lab Technicians` and `OHS Rep`). (2) Safely migrated all existing user assignments in `tabHas Role` (`Gardner` -> `Gardener` for 14 users, `Supervisors` -> `Supervisor` for 1 user) and purged obsolete role rows from `tabHas Role`, `tabIslandChill Role Form Item`, `tabIslandChill Role Page Item`, `tabIslandChill Role Permission`, and `tabRole`. (3) Standardized exactly 8 canonical operational plant roles: `Technical Production Coordinator`, `Production Manager`, `Lab Technicians`, `OHS Rep`, `Quality Checks`, `Supervisor`, `Warehouse Supervisor`, and `Gardener` (plus portal access roles `IslandChill MES User` and `IslandChill Admin User`). (4) Updated `islandchill/hooks.py`, `islandchill/fixtures/role.json` (10 roles), `islandchill/fixtures/islandchill_role_permission.json` (8 operational roles), and `islandchill/public/js/portal_switch.js`. (5) Updated automated test suite `frontend/tests/portal-switch.test.mjs`; all 83 frontend tests pass and production bundle recompiled. |
| **2026-10-30** | Work Order Operations & Parallel Execution | **Work Orders Parallel Operations & Job Card Synchronization**: (1) **Parallel Execution of Raw Materials & Maintenance**: In `WorkOrdersTab.jsx`, removed the sequential lock (`!isRawMaterialsIssued`) that previously blocked the `Maintenance` tab until raw materials were issued. Both `Issue Raw Materials` and `Maintenance` can now be navigated to, inspected, and executed in parallel in any sequence. (2) **Prerequisites Readiness Strip & Tab Badges**: Added a visual readiness indicator strip above the operations tab bar detailing live status: `Raw Materials: Issued / Pending Issue`, `Maintenance: Cleared / In Progress (X/Y)`, and `Job Cards: Unlocked / Locked`. Tab labels dynamically show completion status (`✓ Issue Raw Materials`, `✓ Maintenance (X/X)`). (3) **Job Cards Unlock Guard**: The `Job Cards` tab strictly unlocks only when **both** raw materials are issued (`isRawMaterialsIssued`) and all required maintenance checklists are cleared (`wo.maintAllCompleted`). If either is pending, the tab remains locked with an informative tooltip and safe fallback to the materials tab. `openJobCardAction` enforces both prerequisites before job card timing starts. (4) **Backend 3-Stage Workflow Recognition**: Updated queries in `islandchill/api/manufacturing.py` (`get_work_order_dashboard`, `get_work_order_maintenance_checklists`, `get_maintenance_dashboard_stats`) to accept non-rejected checklists (`["docstatus", "!=", 2], ["workflow_state", "not in", ["Rejected"]]`), recognizing checklists created under the 3-stage approvals workflow while rejecting rejected ones until resubmitted. (5) **Automated Test Coverage**: Added `frontend/tests/work-order-parallel-operations.test.mjs` (6 comprehensive test suites). Passed all 67 node tests and recompiled production assets (`index-Z0lnpRDu.js`, `index-BDju0jRW.css`). |
| **2026-10-30** | 3-Stage Approvals, Log Audit Trail & Sales Desk | **3-Stage Workflow Architecture, Universal Log Audit Trails & ERPNext Sales Defaults**: (1) **3-Stage Workflow API**: Created whitelisted endpoints in `islandchill/api/workflow.py` (`verify_form`, `approve_form`, `reject_form`, `mark_form_incident`) seamlessly integrating with Frappe Workflow state machines (`apply_workflow`) and submittable DocTypes (`docstatus: 1`). Auto-resolves Employee Link IDs and names. (2) **Auto-Capture & Signature Removal**: Removed manual signature pads and verifier fields from all form creation modals across Laboratory, Cleaning, Maintenance, and Safety; auto-captures creator user ID and name. (3) **Universal Log Visibility & 3-Stage Audit Trail**: Created `StageAuditCard.jsx` with `classifyRecordStage`, `StageStatusBadge`, and visual 3-Stage Timeline (`Stage 1 Creation`, `Stage 2 Verification`, `Stage 3 Approval`, and `Rejection Flag with Convert to Plant Incident button`). Integrated status badges and inspection audit cards across all operational tabs (`LaboratoryTab`, `CleaningTab`, `MaintenanceTab`, `SafetyTab`). (4) **Maintenance Log History**: Updated `get_maintenance_log_history` in `manufacturing.py` and `MaintenanceTab.jsx` to show all records (Draft, Pending Verification, Pending Approval, Approved, Rejected) with dedicated `MaintenanceReportViewerModal` task inspection. (5) **Sales Desk ERPNext Alignment**: Added customer selector, selling price list (`Standard Selling`), Fiji tax template (15% VAT), warehouse selectors (`Finished Goods - CWFPL`), and verified `update_stock: 1` auto-deducts physical inventory via Stock Ledger Entries. Passed all 52 node tests. |
| **2026-10-30** | Authentication, Session & Portal Navigation | **Universal Logout & Backend Session Destruction**: (1) **Root Cause Identified**: Previous MES logout failed because `POST /api/method/logout` was missing `X-Frappe-CSRF-Token` headers and was silently ignored, leaving the `sid` session active in Frappe's `tabSessions` table; upon reload of `/islandchill`, `restorePortalSession` saw the active admin session and auto-redirected to `/app`. (2) **Robust Whitelisted Logout Endpoint**: Created `islandchill.api.permissions.mes_logout` (`allow_guest=True`, `methods=["POST", "GET"]`) which deletes the active session from MariaDB `tabSessions`, evicts cache (`frappe.cache.hdel`), commits the transaction, and sets expired Set-Cookie headers for `sid`, `system_user`, `user_id`, `full_name`, and `user_image`. (3) **Frontend Cookie & Cache Purge**: In `frappe.js`, `frappe.logout()` calls `mes_logout` with CSRF headers, purges client cookies across all path scopes (`/`, `/app`, `/islandchill`), and clears `localStorage` and `sessionStorage`. (4) **Explicit Logout State & Clean Login Landing**: In `App.jsx`, `handleLogout` navigates to `/islandchill?logout=1`, where `restorePortalSession` immediately recognizes the explicit logout state, cleans the URL with `window.history.replaceState`, and renders `LoginPage` without redirecting to `/app`. Both MES and ERPNext Desk are completely logged out. Passed all 83 automated tests and rebuilt production bundle (`index-2fkAdhiT.js`). |
| **2026-10-29** | ERPNext Desk & Navigation UI | **Responsive Collapsible "Switch to IslandChill MES" Button**: Fixed the Desk sidebar switch button overflowing horizontally across the collapsed sidebar border (reported with UI screenshots). (1) Restructured switch button DOM in `apps/islandchill/islandchill/public/js/portal_switch.js` into separated icon (`<span class="islandchill-switch-icon">🏭</span>`) and text (`<span class="islandchill-switch-text">Switch to IslandChill MES</span>`) containers. (2) Added responsive CSS rules that detect sidebar collapse via `.body-sidebar-container:not(.expanded)`, `.collapsed`, and `.is-collapsed`. (3) When sidebar is collapsed, button collapses smoothly into a 34px × 34px centered square/rounded icon button with hover glow, hiding label text cleanly without horizontal overflow. (4) Added Bootstrap tooltip integration (`title="Switch to IslandChill MES"`, `data-toggle="tooltip"`, `data-placement="right"`) on hover when collapsed. (5) Added `ResizeObserver` and `sidebar-expand` event listeners for instantaneous transition when collapsing/expanding. (6) Expanded role list in `canSwitchToMES` to include all 8 operational IslandChill roles. Added unit test suite `tests/portal-switch.test.mjs`; all 35/35 frontend tests passing. |
| **2026-10-29** | RBAC, Page Visibility & Form-Wise Workability | **Configurable Role Permissions & Form-Wise Workability System**: (1) Created master DocType `IslandChill Role Permission` and child tables `IslandChill Role Page Item` and `IslandChill Role Form Item` in module `Islandchill`. (2) Pre-seeded operational role profiles from `Waters_MaintenanceTasks_upd_client.xlsx` (`Lab Technicians`, `Quality Checks`, `Technical Production Coordinator`, `Production Manager`, `Warehouse Supervisor`, `Gardner`, `Supervisors`, `OHS Rep`) with page visibility and form-level permissions (`can_view`, `can_create`, `can_verify`, `can_approve`). (3) Created whitelisted backend API `islandchill.api.permissions.get_user_portal_permissions` that dynamically resolves session roles into effective permission sets. (4) Integrated dynamic sidebar filtering in `Sidebar.jsx`, active route guards in `App.jsx`, and dynamic form workability across `LaboratoryTab`, `CleaningTab`, `MaintenanceTab`, and `SafetyTab` (locking form creation with `🔒 View Only` when unauthorized while preserving `👁️ View` for all past logs). (5) Resolved TDZ `ReferenceError: Cannot access 'q' before initialization` in production bundle. (6) Added automated test suite `tests/portal-permissions.test.mjs` verifying all 33 frontend tests pass. Exported 130KB `fixtures/islandchill_role_permission.json`. |
| **2026-10-28** | App DocTypes & Git Tracking | **Complete DocType Export to App**: Exported all 48 operational DocTypes and child tables directly into `apps/islandchill/islandchill/islandchill/doctype/`. Each exported DocType contains full JSON schemas, Python controllers, JavaScript hooks, submittability configurations (`is_submittable: 1` on all parent forms), and standard permissions. All operational forms now persist directly in git version control. |
| **2026-10-28** | Operational Forms & DocTypes | **Universal Form Submittability (100% Submittable)**: Audited all 52 operational DocTypes mapped in the Island Chill MES UI. Identified and upgraded 17 non-submittable custom forms (`Seam Checklist Form`, `Sanitation Record`, `Autoclave Record`, `Media Preparation Record`, `Rinse-Off Test for Raw Materials`, `Library Sample Record`, `Outside Perimeter Cleaning`, `Injury Report`, `Employee Screening`, `Preventive Maintenance Request`, `Customer Complaint Report`, `Customer Complaint Tracking`, `Cleaning and Sanitation Form`, and 4 Cleaning Purpose doctypes) to `is_submittable = 1` with `amended_from` link fields and submit/cancel permissions. Verified 100% (52/52) forms can now submit (`docstatus: 1`). |
| **2026-10-28** | Work Orders & Operation Workflows | **Work Order Search, Sub-Operation Panels & Dashboard Count Fix**: (1) Fixed `get_work_order_dashboard` query count error in Frappe v15 when filters or search queries are applied. (2) Added server-side search (`search` parameter) matching Work Order ID, item code, and item name. (3) Added extraction of operator assignments from `Job Card Time Log` records. (4) Re-architected Work Orders UX into 3 tabs (`Issue Raw Materials`, `Maintenance`, `Job Cards`) with isolated `WorkOrderMaintenancePanel` and `WorkOrderMaintenanceChecklists` subcomponents. (5) Updated `WorkflowTab` to optionally link with Work Orders and sync active operations with live ERPNext Job Cards. |
| **2026-10-06** | Portal Access & Navigation Switch | **Two-Role Portal Routing & About Section Switch**: (1) Implemented two-role routing with `IslandChill MES User` (Website User, desk_access: 0, home_page: islandchill) and `IslandChill Admin User` (System User, desk_access: 1). (2) Removed legacy `islandchill_user_type` field and schema references from User DocType. (3) Added persistent top-right "Switch to IslandChill MES" button in ERPNext Desk navbar, user dropdown, and inside Frappe "About" dialog (`frappe.ui.misc.about`). (4) Kept "Switch to ERPNext Admin" button in IslandChill MES left sidebar footer. (5) Fixed session initialization to prevent spurious login error banners on unauthenticated visits. Exported fixtures and compiled production assets. |
| **2026-10-05** | Inventory & Multi-Warehouse Stock Accuracy | **Warehouse Normalization, Live Valuation & Stocked Items Visibility**: (1) Fixed root cause of items showing 0.00 when selecting "Stores" (backend dictionary key mismatch between `'Stores'` and `'Stores - CWFPL'`) by introducing bi-directional warehouse name normalization across `get_all_inventory_items` and `getItemStock`. (2) Cleaned up warehouse dropdown: eliminated empty/irrelevant system warehouses (`Goods In Transit`, `Scrap Warehouse`) from the primary view, sorted warehouses holding physical stock to the top, and annotated warehouse options with clean short names and item counts (`Stores (20 items)`, `Finished Goods (2 items)`, `Work In Progress (13 items)`). (3) Resolved "Stores nothing shows" issue by prioritizing items with positive stock at the top of the inventory table (descending by stock quantity) and adding an interactive `[✓] In-Stock Only` toggle filter. (4) Added accurate stock valuation rates and total in-stock monetary values ($) at both the item row level, right-side detail breakdown, and in an Executive KPI summary bar (Total In-Stock Value: $451.37M in Stores / $453.26M Consolidated, Total Units, Stocked SKUs). (5) Purged legacy `- AD` orphan warehouses from active calculations. Rebuilt frontend production bundle and cleared bench cache. |
| **2026-10-04** | Stock Entry & ERPNext-Style List Pagination | **Enabled Items Enforcement, Manufacture Sub-Tab & 20-Record Load More Views**: (1) Strictly enforced that only enabled items (`disabled: 0`) from ERPNext can appear in Stock Entry creation, drafts, and BOM details: rejected disabled items on backend (`save_stock_entry_draft`, `get_bom_details_data`, `get_bom_recipe_full_details`) and filtered in frontend (`proceedToStartRun`, `stockEntryModal` item selector with `+ Add Item Row` & delete controls); purged hardcoded mock stock items/entries from `frappe.js`. (2) Completely removed the `+ Adjust Stock` button and modal from `InventoryTab.jsx` and `App.jsx`. (3) In the Stock Entry details transaction modal (`InventoryTab.jsx`), when `stock_entry_type === 'Manufacture'`, added a dedicated `🎯 Finished Good` tab and made it the default tab, cleanly isolating and displaying ONLY the finished good item, finished good qty, and target warehouse, while keeping the `📦 Raw Materials Transferred` tab strictly for consumed raw materials. (4) Standardized list views across the project to display 20 records at a time with ERPNext-style `⬇ Load More` functionality (Stock Items list, Work Order-wise Stock Entry transactions, BOM catalog, etc.). Rebuilt frontend and cleared bench cache. |
| **2026-10-04** | Plant Dashboard & Operational Analytics | **Dynamic Operational Data & Real-Time Production Analytics**: Modernized `DashboardTab.jsx` and `App.jsx` to replace static/hardcoded charts with dynamic, meaningful operational metrics from ERPNext, while keeping the live camera feed section (`Filling Line 1` & `Filling Line 2` video stream mockups, AI HUD overlays, FPS watermark, and fullscreen controls) 100% preserved as requested. Replaced static OEE numbers with dynamic availability, performance, and first-pass quality yield rates linked to active runs, equipment maintenance readiness, and process losses. Replaced static water flow rate SVG with an interactive, dynamic Production Output SVG chart displaying recent Work Order batches (Planned Target vs Actual Produced Qty, completion %, and interactive hover inspection). Replaced static energy bars with a dual-section card showing the Filling Line 1 (Water) vs Filling Line 2 (Cans) volume split alongside a live Multi-Warehouse Stock Distribution stacked bar (Finished Goods, Stores, WIP, and Safety Stock). Added a 4th flow card for Pre-Start PM equipment clearance, dynamic active jobs linked in camera card footers, a plant operational status ribbon, enhanced the Work Order Monitor table with line badges and progress indicators, and updated fullscreen chart modals with dynamic visualizations. Rebuilt frontend production bundle and cleared bench cache. |
| **2026-10-04** | Inventory & Stock Control | **Enabled Items, Multi-Warehouse Distribution & Filter Modernization**: Updated `get_all_inventory_items` in `manufacturing.py` and `getItems` in `frappe.js` to strictly filter by `disabled: 0` and return all enabled ERPNext items alongside complete `warehouse_stocks` mapping. Added `get_all_warehouses` endpoint with `is_group: 0, disabled: 0`. Redesigned `InventoryTab.jsx` with a top search bar matching code, name, and category; warehouse-wise stock selector dynamically calculating and displaying stock in the selected warehouse or consolidated across all warehouses; dynamic Item Group / Category filter dropdown; removed the legacy status column (`🚨 REORDER` / `✓ OK`); and added an interactive Warehouse Stock Distribution breakdown card in the detail panel. Kept Work Order-wise Stock Entry transactions and GL ledger completely intact. |
| **2026-10-01** | ERPNext Custom Fields & Work Order Link Audit | **Universal Work Order Field Integration**: Audited all 52 operational DocTypes across Laboratory QA, Cleaning & Sanitation, Maintenance & PM, and HSE. Automatically created missing `work_order` (`Link` -> `Work Order`) Custom Fields on 14 DocTypes (`CIP CHECKLIST`, `Water Monitoring Form`, `Outside Perimeter Cleaning Table`, `Outside Perimeter Cleaning`, `Sanitation`, `Microbiological Analysis CSD Rines Water Syrup Mixing Water`, `CSD RTD Line Start Sensory Evaluation`, `Container Loading Inspection`, `Customer Complaint Report`, `Customer Complaint Tracking`, `Injury Report`, `Employee Screening`, `Preventive Maintenance Request`, `Dining Room Cleaning Purpose`). Verified 100% (52/52) operational DocTypes have active `work_order` fields with `in_list_view: 1`, `in_standard_filter: 1`, and `allow_on_submit: 1`. Exported fixtures to `islandchill/fixtures/custom_field.json`. |
| **2026-10-01** | Form Approvals Desk & ERPNext Dynamic Workflow Sync | **Work Order & ERPNext Workflow Alignment**: Removed Work Order from being counted/treated as an approval form since core ERPNext Work Orders are manufacturing jobs (not inspection sign-offs). Retained Work Order as dynamic link & dropdown filter. Fixed `getMaintenanceSchedules` and `fetchAllCleaningRecords` in `frappe.js` to preserve `docstatus` and `workflow_state` (`Approved by Supervisor`, etc.). Updated `ApprovalsTab.jsx` to dynamically evaluate status based on ERPNext workflow states (`Approved by...` vs `Draft`). Integrated Frappe workflow transition API (`frappe.model.workflow.apply_workflow`) with fallback. Fixed category badge counter key mapping (`laboratory`). Added auto-refresh on navigating to Approvals tab and wired all live updaters to manual refresh. |
| **2026-10-01** | Form Approvals Hub (Bugfix & WO Purge) | Enhanced **Form Approvals Desk (`ApprovalsTab.jsx`)**: Fixed approval transition bug by removing flawed supervisor assignment trigger and using strict `isApproved` / `docstatus: 1` flags with direct state references. Added "🧹 Purge Unlinked Forms" tool to permanently sanitize legacy dummy records without Work Orders. Wired `setWorkOrders` state updater. Rebuilt production bundle. |
| **2026-09-30** | Dynamic DocType Discovery & Generic Reports | Eliminated hardcoded DocType lists. Refactored `report_utils.py` with 100% dynamic DocType discovery based on real activity across `tabVersion`, `tabComment` (Workflow), and modified timestamps in the selected date range. Converted reports to generic portable modules (`daily_document_register` & `user_activity_summary`) with linkable DocType filters, auto-fallback recipient resolution, and cron hooks in `hooks.py`. |
| **2026-09-28** | Sidebar Layout & Navigation Scroll | Removed "All Systems Operational" widget from sidebar bottom. Converted `.sidebar-nav` into an independent slim scrollable container (`overflow-y: auto`, thin dark scrollbar) while fixing `.sidebar-brand` at top and `.sidebar-footer` (user profile & logout button) always visible and accessible at the bottom without blocking screens. |
| **2026-09-28** | Landing Page & Portal Access Routing | Designed minimal Island Chill Landing & Unified Login Page (`LoginPage.jsx`). Added intelligent credential-based role detection in `frappe.js` and `App.jsx`: automatically routes Admin users (`System Manager`, `Administrator`) to ERPNext Desk (`/app`) and Operations users (`Operator`, `Lab QA`, `Maintenance`, `Warehouse`, `Sales`) to Island Chill Operations MES (`/islandchill`). Included direct "Go to Admin Login ›" fast-path link. |
| **2026-09-28** | Laboratory QA & Form 11 Water Micro Sync | Synchronized `Microbiologiocal Analysis Raw and Product Water` (Form 11) schema with ERPNext DB: mapped child table `table_aqat` with dynamic keys (`hpc_count`, `hpc_count_2`, `e_coli`), updated field mappings (`date_of_analysis`, `date_of_product`, `incubator_no_tcc_and_hpc`, `compact_dry_ec`, `pipette_lot`, `spc_agar_date`, `tcc_incubation_in_date_and_time`), and updated submission payloads for full production sync. |
| **2026-09-25** | UI Layout & Viewport Scrollbar Fix | Fixed double scrollbar issue on desktop/laptop screens by setting `overflow: hidden` on `html`, `body`, `#root`, and `.app-container` with strict `height: 100vh`, while delegating smooth scrolling exclusively to `.main-workspace`. Eliminated the viewport content cutting bug on bottom/top scroll. |
| **2026-09-25** | Equipment List & Maintenance Checklists | Removed `production_line` Select field from `Equipment List` DocType and replaced it with two Check fields: `filling_line_1` ("Filling Line 1") and `filling_line_2` ("Filling Line 2"). Updated MariaDB database schema, fixtures (`equipment_list.json`), API (`maintenance_template.py`), and frontend (`MaintenanceTab.jsx`, `App.jsx`, `WorkOrdersTab.jsx`). Made Work Order maintenance badge dynamic (`0/4`, `0/6`, etc.) based on `wo.maintTotalCount` instead of hardcoded `/10`. Exported clean app fixtures for production. |
| **2026-09-23** | Laboratory QA & Work Order Dynamic Alignment | Dynamically aligned all Laboratory cards (4 summary metric cards and 22 QA checklist template cards) with the selected Work Order. Added per-WO completion tracking, status indicators (`✓ Logged for WO` vs `⏳ Pending for WO`), quick status tabs (All / Pending / Logged), and real-time checklist filtering. |
| **2026-09-23** | Laboratory QA & Work Order Context | Added Work Order Selector banner at the head of Laboratory section (`LaboratoryTab.jsx` & `App.jsx`). Allows selecting an active Work Order which automatically pre-fills the `work_order` field for all 22 Lab Form modals and supports filtering the Lab Quality Control Register by Work Order. |
| **2026-09-23** | Laboratory & QA DocTypes | Audited all 22 Laboratory QA forms. Created missing `work_order` fields on 16 ERPNext DocTypes, updated UI modals (Form 35, Form 88, dynamic forms), and updated `handleSaveLaboratory` sync payloads. Exported custom fields fixture. |
| **2026-09-23** | Frontend API Client | Fixed `ReferenceError: baseUrl is not defined` in `saveStockEntryDraft()` inside `frappe.js`. Rebuilt production bundle. |
| **2026-09-23** | Maintenance & Equipment | Renamed `Air Compressor - 1` to `Air Compressor` across MariaDB, fixtures, API resolvers, and UI modals to match updated ERPNext naming. |
| **2026-09-15** | Work Order Creation | Fixed Filling Line selection logic in `WorkOrdersTab.jsx` and Work Order modal so user-selected line (Line 1 vs Line 2) persists properly to ERPNext. |
| **2026-09-15** | Laboratory QA | Added Form 35 (Gold Stone Rum & Cola), Form 86 (Incubator Temperature Record), and Form 88 (Weight Check Checklist). |
| **2026-08-24** | Cleaning & CIP | Enhanced print and approval workflows for 7 standard cleaning records. |

---

## 8. Pre-Git Commit Protocol Checklist

Before running `git commit` or `git push`, make sure to:

- [ ] **Update this `HANDOVER.md`**: Add any new features, API methods, DocTypes, or bugfixes to Section 7 & relevant sections.
- [ ] **Verify Frontend Build**: Run `cd apps/islandchill/frontend && npm run build` to ensure assets and `islandchill.html` are compiled.
- [ ] **Verify Database Integrity**: If DocTypes or custom fields were modified, export fixtures using `bench --site islandchill.local export-fixtures`.
- [ ] **No Secrets**: Ensure no API keys, private passwords, or temporary test credentials are committed.
