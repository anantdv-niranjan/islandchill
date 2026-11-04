app_name = "islandchill"
app_title = "Islandchill"
app_publisher = "anantdv"
app_description = "Islandchill"
app_email = "abhirup.s@anantdv.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "islandchill",
# 		"logo": "/assets/islandchill/logo.png",
# 		"title": "Islandchill",
# 		"route": "/islandchill",
# 		"has_permission": "islandchill.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/islandchill/css/islandchill.css"
app_include_js = "/assets/islandchill/js/portal_switch.js"

# include js, css files in header of web template
# web_include_css = "/assets/islandchill/css/islandchill.css"
# web_include_js = "/assets/islandchill/js/islandchill.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "islandchill/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "islandchill/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "islandchill.utils.jinja_methods",
# 	"filters": "islandchill.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "islandchill.install.before_install"
# after_install = "islandchill.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "islandchill.uninstall.before_uninstall"
# after_uninstall = "islandchill.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "islandchill.utils.before_app_install"
# after_app_install = "islandchill.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "islandchill.utils.before_app_uninstall"
# after_app_uninstall = "islandchill.utils.after_app_uninstall"

# Build
# ------------------
# To hook into the build process

# after_build = "islandchill.build.after_build"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "islandchill.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"islandchill.tasks.all"
# 	],
# 	"daily": [
# 		"islandchill.tasks.daily"
# 	],
# 	"hourly": [
# 		"islandchill.tasks.hourly"
# 	],
# 	"weekly": [
# 		"islandchill.tasks.weekly"
# 	],
# 	"monthly": [
# 		"islandchill.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "islandchill.install.before_tests"

# Extend DocType Class
# ------------------------------
#
# Specify custom mixins to extend the standard doctype controller.
# extend_doctype_class = {
# 	"Task": "islandchill.custom.task.CustomTaskMixin"
# }

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "islandchill.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "islandchill.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["islandchill.utils.before_request"]
# after_request = ["islandchill.utils.after_request"]

# Job Events
# ----------
# before_job = ["islandchill.utils.before_job"]
# after_job = ["islandchill.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"islandchill.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []


website_route_rules = [{'from_route': '/islandchill/<path:app_path>', 'to_route': 'islandchill'},]

# Fixtures
# --------
fixtures = [
	{
		"dt": "Custom Field",
		"filters": [
			["fieldname", "in", [
				"work_order", "custom_production_line", "custom_extra_goods_warehouse",
				"incident_section", "is_incident", "incident_severity", "incident_note", "linked_incident"
			]]
		]
	},
	{
		"dt": "Property Setter",
		"filters": [
			["doc_type", "in", ["Work Order"]]
		]
	},
	{
		"dt": "Role",
		"filters": [
			["role_name", "in", [
				"IslandChill MES User",
				"IslandChill Admin User",
				"Technical Production Coordinator",
				"Production Manager",
				"Lab Technicians",
				"OHS Rep",
				"Quality Checks",
				"Supervisor",
				"Warehouse Supervisor",
				"Gardener"
			]]
		]
	},
	"Equipment List",
	"Maintenance Checklist Master"
]

# Document Events — Automated Incident Detection
# -----------------------------------------------
doc_events = {
	"Chemical Test": {
		"on_submit": "islandchill.api.incident_engine.process_chemical_test",
		"on_update": "islandchill.api.incident_engine.process_chemical_test"
	},
	"Microbiological Analysis": {
		"on_submit": "islandchill.api.incident_engine.process_micro_analysis"
	},
	"CIP Checklist": {
		"on_submit": "islandchill.api.incident_engine.process_cip_checklist"
	},
	"CIP CHECKLIST": {
		"on_submit": "islandchill.api.incident_engine.process_cip_checklist"
	},
	"Seam Checklist Form": {
		"on_submit": "islandchill.api.incident_engine.process_seam_check"
	},
	"Cleaning of Toilets": {
		"on_submit": "islandchill.api.incident_engine.process_cleaning_sanitation_incident",
		"on_update": "islandchill.api.incident_engine.process_cleaning_sanitation_incident"
	},
	"Cleaning of Dining Room": {
		"on_submit": "islandchill.api.incident_engine.process_cleaning_sanitation_incident",
		"on_update": "islandchill.api.incident_engine.process_cleaning_sanitation_incident"
	},
	"Factory Floor": {
		"on_submit": "islandchill.api.incident_engine.process_cleaning_sanitation_incident",
		"on_update": "islandchill.api.incident_engine.process_cleaning_sanitation_incident"
	},
	"Cleaning of Lab and Office": {
		"on_submit": "islandchill.api.incident_engine.process_cleaning_sanitation_incident",
		"on_update": "islandchill.api.incident_engine.process_cleaning_sanitation_incident"
	},
	"Incubator Temperature Record": {
		"on_submit": "islandchill.api.incident_engine.process_cleaning_sanitation_incident",
		"on_update": "islandchill.api.incident_engine.process_cleaning_sanitation_incident"
	},
	"Balance Check or Callibration": {
		"on_submit": "islandchill.api.incident_engine.process_cleaning_sanitation_incident",
		"on_update": "islandchill.api.incident_engine.process_cleaning_sanitation_incident"
	},
	"equipment sanitation and cip": {
		"on_submit": "islandchill.api.incident_engine.process_cleaning_sanitation_incident",
		"on_update": "islandchill.api.incident_engine.process_cleaning_sanitation_incident"
	},
	"Outside Perimeter Cleaning": {
		"on_submit": "islandchill.api.incident_engine.process_cleaning_sanitation_incident",
		"on_update": "islandchill.api.incident_engine.process_cleaning_sanitation_incident"
	},
	"Sanitation Record": {
		"on_submit": "islandchill.api.incident_engine.process_cleaning_sanitation_incident",
		"on_update": "islandchill.api.incident_engine.process_cleaning_sanitation_incident"
	},
	"Microbiological Analysis of Primary Raw Materials": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Microbiologiocal Analysis Raw and Product Water": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Taste Test and Visual Inspection": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Gold Stone Rum and Cola": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Bourbon Whiskey And Cola Product Tank Record": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Container Loading Inspection": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"CSD RTD Line Start Sensory Evaluation": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Autoclave Record": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Media Preparation Record": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Rinse-Off Test for Raw Materials": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Library Sample Record": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Traceability of products": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Induction": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"For Weight Check Checklist": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Hourly Weight Check Form": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Weight Check": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Silver Photometer Log": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Silver Photometer Log and Calibration": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Monitoring": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Production Record": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Mock Product Recall": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Recall Review": {
		"on_submit": "islandchill.api.incident_engine.process_lab_incident",
		"on_update": "islandchill.api.incident_engine.process_lab_incident"
	},
	"Accident and Disease Notification Report": {
		"after_insert": "islandchill.api.incident_engine.process_accident_disease_report",
		"on_submit": "islandchill.api.incident_engine.process_accident_disease_report",
		"on_update": "islandchill.api.incident_engine.process_accident_disease_report"
	},
	"Standard Form 17 For First Aid": {
		"after_insert": "islandchill.api.incident_engine.process_first_aid_record",
		"on_submit": "islandchill.api.incident_engine.process_first_aid_record",
		"on_update": "islandchill.api.incident_engine.process_first_aid_record"
	},
	"Enviromental Swab Test": {
		"after_insert": "islandchill.api.incident_engine.process_swab_test",
		"on_submit": "islandchill.api.incident_engine.process_swab_test",
		"on_update": "islandchill.api.incident_engine.process_swab_test"
	},
	"Daily Preventative Maintenance Schedule": {
		"after_insert": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_submit": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_update": "islandchill.api.incident_engine.process_maintenance_incident"
	},
	"Preventive Maintenance Request": {
		"after_insert": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_submit": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_update": "islandchill.api.incident_engine.process_maintenance_incident"
	},
	"Machine Breakdown": {
		"after_insert": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_submit": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_update": "islandchill.api.incident_engine.process_maintenance_incident"
	},
	"Weight Check": {
		"after_insert": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_submit": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_update": "islandchill.api.incident_engine.process_maintenance_incident"
	},
	"Hourly Weight Check Form": {
		"after_insert": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_submit": "islandchill.api.incident_engine.process_maintenance_incident",
		"on_update": "islandchill.api.incident_engine.process_maintenance_incident"
	}
}

scheduler_events = {
	"cron": {
		"0 23 * * *": [
			"islandchill.islandchill.report.daily_document_register.daily_document.send_daily_document_register_email",
			"islandchill.islandchill.report.user_activity_summary.daily_user_activity.send_daily_user_activity_email",
		]
	}
}