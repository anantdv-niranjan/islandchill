# Copyright (c) 2026, Island Chill and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PlantIncident(Document):
    def before_insert(self):
        if not self.reported_time:
            self.reported_time = frappe.utils.now_datetime()
        if not self.reported_by:
            self.reported_by = frappe.session.user

    def on_update(self):
        # Auto-set resolution date when status moves to Resolved
        if self.status == "Resolved" and not self.resolution_date:
            self.resolution_date = frappe.utils.today()
            if not self.resolved_by:
                self.resolved_by = frappe.session.user
