"""add intranet faq tables and seed data

Revision ID: m7b8c9d0e1f2
Revises: l6a7b8c9d0e1
Create Date: 2026-07-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone

# revision identifiers, used by Alembic.
revision = 'm7b8c9d0e1f2'
down_revision = 'l6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── intranet_faq_categories ───────────────────────────────────────────────
    op.create_table(
        "intranet_faq_categories",
        sa.Column("id",         sa.Integer(),     primary_key=True, autoincrement=True),
        sa.Column("label",      sa.String(80),    nullable=False, unique=True),
        sa.Column("is_visible", sa.Boolean(),     nullable=False, server_default=sa.text("1")),
        sa.Column("sort_order", sa.Integer(),     nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(),    nullable=False, server_default=sa.text("NOW()")),
    )

    # ── intranet_faq ──────────────────────────────────────────────────────────
    op.create_table(
        "intranet_faq",
        sa.Column("id",          sa.Integer(),  primary_key=True, autoincrement=True),
        sa.Column("question",    sa.Text(),     nullable=False),
        sa.Column("answer",      sa.Text(),     nullable=False),
        sa.Column("category",    sa.String(80), nullable=False),
        sa.Column("order_index", sa.Integer(),  nullable=False, server_default=sa.text("0")),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at",  sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at",  sa.DateTime(), nullable=False, server_default=sa.text("NOW()"), onupdate=datetime.now),
    )

    # ── Seed categories ───────────────────────────────────────────────────────
    faq_categories = sa.table(
        "intranet_faq_categories",
        sa.column("label",      sa.String),
        sa.column("is_visible", sa.Boolean),
        sa.column("sort_order", sa.Integer),
    )
    op.bulk_insert(faq_categories, [
        {"label": "IT Support",   "is_visible": True, "sort_order": 0},
        {"label": "HR & Payroll", "is_visible": True, "sort_order": 1},
        {"label": "HSE",          "is_visible": True, "sort_order": 2},
        {"label": "Procurement",  "is_visible": True, "sort_order": 3},
        {"label": "General",      "is_visible": True, "sort_order": 4},
    ])

    # ── Seed FAQs (all mock data) ─────────────────────────────────────────────
    faq_table = sa.table(
        "intranet_faq",
        sa.column("question",    sa.Text),
        sa.column("answer",      sa.Text),
        sa.column("category",    sa.String),
        sa.column("order_index", sa.Integer),
        sa.column("is_published", sa.Boolean),
    )
    op.bulk_insert(faq_table, [
        # IT Support
        {"question": "How do I reset my work password?",        "answer": "Visit the IT Self-Service Portal at it.portlandgas.com and click 'Reset Password'. You will need your staff ID and registered mobile number. If you are locked out, call the IT Help Desk on ext. 1001.", "category": "IT Support",   "order_index": 0, "is_published": True},
        {"question": "How do I connect to the VPN?",            "answer": "Download the Cisco AnyConnect client from the IT portal. Use your email address as your username and your network password. Contact IT if you need the server address or encounter connection issues.",       "category": "IT Support",   "order_index": 1, "is_published": True},
        {"question": "How do I request a new device?",          "answer": "Raise a request via the Workflow Portal under IT Requests > Device Request. Your line manager must approve the request before it is processed by IT. Allow 5–7 working days for fulfilment.",               "category": "IT Support",   "order_index": 2, "is_published": True},
        {"question": "What do I do if my laptop won't start?",  "answer": "First, try a hard reset by holding the power button for 10 seconds. If it still won't start, log a ticket on the IT portal or call ext. 1001. Do not attempt to repair the device yourself.",             "category": "IT Support",   "order_index": 3, "is_published": True},
        {"question": "How do I set up my work email on my phone?", "answer": "Go to your phone's email settings and add a new account using your Portland Gas email and password. Use Microsoft Exchange or Outlook as the account type.",                                          "category": "IT Support",   "order_index": 4, "is_published": True},
        # HR & Payroll
        {"question": "How do I apply for leave?",               "answer": "Log in to the Workflow Portal and navigate to HR Management > Leave Requests. Select your leave type, dates, and add a note if required. Your line manager will receive a notification to approve or decline.", "category": "HR & Payroll", "order_index": 0, "is_published": True},
        {"question": "When is payroll processed?",              "answer": "Payroll is processed on the last working day of each month. Your payslip will be available on the HR portal within two working days of payment.",                                                          "category": "HR & Payroll", "order_index": 1, "is_published": True},
        {"question": "How do I update my bank details?",        "answer": "Submit a bank details change request via HR Management > My Profile in the Workflow Portal. You must attach a copy of your new bank statement or letter.",                                                  "category": "HR & Payroll", "order_index": 2, "is_published": True},
        {"question": "How do I check my leave balance?",        "answer": "Your current leave balance is visible on your profile in the HR Management section of the Workflow Portal. It is updated in real time as leave requests are approved or declined.",                         "category": "HR & Payroll", "order_index": 3, "is_published": True},
        {"question": "What is the process for a salary advance?", "answer": "Salary advance requests are submitted via the Workflow Portal under HR > Salary Advance. Requests must be submitted at least 10 working days before the required date.",                                 "category": "HR & Payroll", "order_index": 4, "is_published": True},
        # HSE
        {"question": "Where do I find the HSE manual?",         "answer": "The HSE manual is available on the intranet under Policies & Procedures. The current version is Rev. 4 (March 2026).",                                                                                    "category": "HSE",          "order_index": 0, "is_published": True},
        {"question": "How do I report a near-miss or incident?", "answer": "All near-misses must be reported within 24 hours. Use the HSE Incident Report form on the Workflow Portal or contact your supervisor immediately. For serious incidents, call ext. 1002.",               "category": "HSE",          "order_index": 1, "is_published": True},
        {"question": "Who is my nearest first-aider?",          "answer": "First-aider lists are posted on notice boards at all Portland Gas locations. You can also find the list for your location on the intranet under HSE > First Aid Contacts.",                               "category": "HSE",          "order_index": 2, "is_published": True},
        {"question": "What PPE is required at CNG stations?",   "answer": "Minimum PPE at CNG stations includes: safety boots, high-visibility vest, and safety glasses. Hard hats are required in all construction or maintenance zones.",                                           "category": "HSE",          "order_index": 3, "is_published": True},
        {"question": "How do I access HSE training records?",   "answer": "Your training history and certifications are in the Workflow Portal under HR Management > My Training.",                                                                                                   "category": "HSE",          "order_index": 4, "is_published": True},
        # Procurement
        {"question": "How do I raise a purchase request?",      "answer": "Go to the Workflow Portal and navigate to Procurement > New Request. Fill in the required details including category, items, vendor (if applicable), and justification.",                                  "category": "Procurement",  "order_index": 0, "is_published": True},
        {"question": "What is the vendor approval process?",    "answer": "New vendors must be registered by the Procurement team before they can be used in a purchase request. Email vendor details to procurement@portlandgas.com. Approval typically takes 3–5 working days.",   "category": "Procurement",  "order_index": 1, "is_published": True},
        {"question": "How do I track my purchase request status?", "answer": "Log in to the Workflow Portal and go to Procurement > My Requests. You will see the current status of all your requests.",                                                                             "category": "Procurement",  "order_index": 2, "is_published": True},
        {"question": "What is the purchase limit requiring MD approval?", "answer": "Purchase requests above \u20a65,000,000 require MD approval in addition to the standard line manager and procurement sign-off.",                                                                     "category": "Procurement",  "order_index": 3, "is_published": True},
        {"question": "How long does procurement approval take?", "answer": "Standard procurement requests are processed within 5–10 working days. Urgent requests can be flagged at submission.",                                                                                     "category": "Procurement",  "order_index": 4, "is_published": True},
        # General
        {"question": "How do I book a meeting room?",           "answer": "Meeting rooms can be booked via the Workflow Portal under Admin > Room Booking. Select your preferred location, date, time, and room size.",                                                               "category": "General",      "order_index": 0, "is_published": True},
        {"question": "Who do I contact for building access issues?", "answer": "For access card issues, contact the Admin team at admin@portlandgas.com or call ext. 1003. After-hours emergencies should be directed to the security desk on ext. 1000.",                          "category": "General",      "order_index": 1, "is_published": True},
    ])


def downgrade() -> None:
    op.drop_table("intranet_faq")
    op.drop_table("intranet_faq_categories")
