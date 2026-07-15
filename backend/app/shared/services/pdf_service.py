"""
PDF generation service — Purchase Order documents.

Uses fpdf2 (pure Python) to generate a professional letterhead-style PDF.
The generated PDF bytes are then uploaded to Cloudinary by the caller.

Font: DejaVuSans (bundled in app/fonts/) — supports full Unicode including
the em dash (—), Naira sign (₦), and any other characters staff may type.
"""

import os
from fpdf import FPDF
from datetime import date
from decimal import Decimal

# Path to the bundled font files and assets
_FONTS_DIR    = os.path.join(os.path.dirname(__file__), "..", "..", "fonts")
_FONT_REGULAR = os.path.join(_FONTS_DIR, "DejaVuSans.ttf")
_FONT_BOLD    = os.path.join(_FONTS_DIR, "DejaVuSans-Bold.ttf")
_LOGO_PATH    = os.path.join(_FONTS_DIR, "Portland-gas-logo.png")


class PurchaseOrderPDF(FPDF):
    """Custom FPDF subclass for Portland Gas Purchase Orders."""

    def _load_fonts(self):
        """Register DejaVu Unicode fonts. Called once after add_page()."""
        self.add_font("DejaVu",  "",  _FONT_REGULAR)
        self.add_font("DejaVu",  "B", _FONT_BOLD)

    def header(self):
        # ── White header background ──────────────────────────────────────────
        self.set_fill_color(255, 255, 255)
        self.rect(0, 0, 210, 36, "F")

        # Logo — sits cleanly on white
        if os.path.exists(_LOGO_PATH):
            self.image(_LOGO_PATH, x=12, y=5, h=26)

        # Company name
        self.set_xy(44, 7)
        self.set_font("DejaVu", "B", 15)
        self.set_text_color(13, 13, 18)
        self.cell(0, 8, "Portland Gas Limited", ln=True)

        # Tagline
        self.set_x(44)
        self.set_font("DejaVu", "", 9)
        self.set_text_color(109, 40, 217)   # vivid purple
        self.cell(0, 5, "Clean Energy | CNG | LPG | EV Charging", ln=True)

        # Contact info — right-aligned, dark gray
        self.set_font("DejaVu", "", 7.5)
        self.set_text_color(80, 80, 90)
        self.set_xy(0, 8)
        self.cell(196, 5, "2B Water Corporation Road, Victoria Island, Lagos", align="R", ln=True)
        self.set_x(0)
        self.cell(196, 5, "Tel: +234 (0) 800 PORTLAND  |  info@portlandgasltd.com", align="R", ln=True)
        self.set_x(0)
        self.cell(196, 5, "www.portlandgasltd.com", align="R", ln=True)

        # Purple accent rule under the header
        self.set_draw_color(109, 40, 217)
        self.set_line_width(0.8)
        self.line(0, 36, 210, 36)

        # Thin secondary rule below (light gray)
        self.set_draw_color(229, 231, 235)
        self.set_line_width(0.3)
        self.line(0, 37.2, 210, 37.2)

        self.set_text_color(17, 17, 24)
        self.set_y(43)

    def footer(self):
        self.set_y(-14)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(156, 163, 175)
        self.cell(0, 5, "This is a computer-generated Purchase Order. Portland Gas Limited \u2014 Internal Operations Platform.", align="C", ln=True)
        self.cell(0, 4, f"Page {self.page_no()}", align="C")


def generate_purchase_order(
    reference: str,
    title: str,
    category: str,
    priority: str,
    justification: str | None,
    required_by: date | None,
    vendor_name: str | None,
    vendor_address: str | None,
    vendor_phone: str | None,
    vendor_email: str | None,
    items: list[dict],
    requester_name: str,
    created_at: date,
) -> bytes:
    pdf = PurchaseOrderPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf._load_fonts()
    pdf.add_page()

    # ── DOCUMENT TITLE ──────────────────────────────────────────────────────
    pdf.set_font("DejaVu", "B", 18)
    pdf.set_text_color(124, 58, 237)
    pdf.cell(0, 10, "PURCHASE ORDER", ln=True)

    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, f"Reference: {reference}   |   Date: {created_at.strftime('%d %B %Y')}   |   Priority: {priority.upper()}", ln=True)
    pdf.ln(4)

    # ── DIVIDER ──────────────────────────────────────────────────────────────
    pdf.set_draw_color(229, 231, 235)
    pdf.set_line_width(0.4)
    pdf.line(14, pdf.get_y(), 196, pdf.get_y())
    pdf.ln(5)

    # ── TWO COLUMN SECTION ───────────────────────────────────────────────────
    col_x_left  = 14
    col_x_right = 112
    start_y     = pdf.get_y()

    def label(text):
        pdf.set_font("DejaVu", "B", 8)
        pdf.set_text_color(107, 114, 128)
        pdf.cell(0, 4, text.upper(), ln=True)

    def value(text, bold=False):
        pdf.set_font("DejaVu", "B" if bold else "", 10)
        pdf.set_text_color(17, 17, 24)
        pdf.cell(0, 5, text or "\u2014", ln=True)
        pdf.ln(2)

    # Left column
    pdf.set_xy(col_x_left, start_y)
    label("Request Title")
    pdf.set_x(col_x_left)
    value(title, bold=True)

    pdf.set_x(col_x_left)
    label("Category")
    pdf.set_x(col_x_left)
    value(category.replace("_", " ").title())

    pdf.set_x(col_x_left)
    label("Required By")
    pdf.set_x(col_x_left)
    value(required_by.strftime("%d %B %Y") if required_by else "Not specified")

    pdf.set_x(col_x_left)
    label("Raised By")
    pdf.set_x(col_x_left)
    value(requester_name)

    left_end_y = pdf.get_y()

    # Right column — vendor
    pdf.set_xy(col_x_right, start_y)
    label("Vendor")
    pdf.set_x(col_x_right)
    value(vendor_name or "Not specified", bold=True)

    if vendor_address:
        pdf.set_x(col_x_right)
        label("Address")
        pdf.set_x(col_x_right)
        pdf.set_font("DejaVu", "", 10)
        pdf.set_text_color(17, 17, 24)
        pdf.multi_cell(84, 5, vendor_address)
        pdf.ln(2)

    if vendor_phone:
        pdf.set_x(col_x_right)
        label("Phone")
        pdf.set_x(col_x_right)
        value(vendor_phone)

    if vendor_email:
        pdf.set_x(col_x_right)
        label("Email")
        pdf.set_x(col_x_right)
        value(vendor_email)

    right_end_y = pdf.get_y()
    pdf.set_y(max(left_end_y, right_end_y) + 4)

    # Justification
    if justification:
        label("Justification / Purpose")
        pdf.set_font("DejaVu", "", 10)
        pdf.set_text_color(17, 17, 24)
        pdf.multi_cell(0, 5, justification)
        pdf.ln(4)

    # ── DIVIDER ──────────────────────────────────────────────────────────────
    pdf.set_draw_color(229, 231, 235)
    pdf.line(14, pdf.get_y(), 196, pdf.get_y())
    pdf.ln(6)

    # ── LINE ITEMS TABLE ─────────────────────────────────────────────────────
    pdf.set_font("DejaVu", "B", 9)
    pdf.set_fill_color(245, 243, 255)
    pdf.set_text_color(91, 33, 182)
    pdf.set_draw_color(237, 233, 254)

    pdf.cell(78, 8, "Description",     border=1, fill=True)
    pdf.cell(18, 8, "Qty",             border=1, fill=True, align="C")
    pdf.cell(18, 8, "Unit",            border=1, fill=True, align="C")
    pdf.cell(32, 8, "Unit Cost (NGN)", border=1, fill=True, align="R")
    pdf.cell(32, 8, "Total (NGN)",     border=1, fill=True, align="R", ln=True)

    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(17, 17, 24)
    pdf.set_fill_color(255, 255, 255)

    grand_total = Decimal("0")
    for i, item in enumerate(items):
        fill = i % 2 == 1
        if fill:
            pdf.set_fill_color(249, 250, 251)

        unit_cost   = Decimal(str(item["unit_cost"]  or 0))
        total_cost  = Decimal(str(item["total_cost"] or 0))
        grand_total += total_cost

        row_h    = 7
        x_before = pdf.get_x()
        y_before = pdf.get_y()

        pdf.multi_cell(78, row_h, str(item["description"]), border=1, fill=fill)
        row_height = pdf.get_y() - y_before

        pdf.set_xy(x_before + 78, y_before)
        pdf.cell(18, row_height, str(item["quantity"]),                              border=1, fill=fill, align="C")
        pdf.cell(18, row_height, str(item.get("unit") or "").replace("_", " ").title(), border=1, fill=fill, align="C")
        pdf.cell(32, row_height, f"{unit_cost:,.2f}",                                border=1, fill=fill, align="R")
        pdf.cell(32, row_height, f"{total_cost:,.2f}",                               border=1, fill=fill, align="R", ln=True)

    # Grand total row — label left-aligned, amount right-aligned in its own cell
    pdf.set_font("DejaVu", "B", 10)
    pdf.set_fill_color(124, 58, 237)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(114, 9, "",                  border="LTB", fill=True)
    pdf.cell(32,  9, "ESTIMATED TOTAL",   border="TB",  fill=True, align="R")
    pdf.cell(32,  9, f"NGN {grand_total:,.2f}", border="RTB", fill=True, align="R", ln=True)

    pdf.ln(8)

    # ── SIGNATURE SECTION ────────────────────────────────────────────────────
    pdf.set_text_color(107, 114, 128)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_draw_color(209, 213, 219)

    sig_y = pdf.get_y() + 4   # small gap above signatures

    # Left column — Raised By
    pdf.set_xy(14, sig_y)
    pdf.cell(80, 5, "Raised By", ln=True)
    pdf.set_x(14)
    pdf.set_font("DejaVu", "B", 9)
    pdf.set_text_color(17, 17, 24)
    pdf.cell(80, 6, requester_name, ln=True)
    pdf.set_x(14)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(80, 4, created_at.strftime("%d %B %Y"), ln=True)

    # Signature line — 25 mm below the label row to give room to sign
    sig_line_y = sig_y + 30
    pdf.line(14, sig_line_y, 94, sig_line_y)
    pdf.set_xy(14, sig_line_y + 2)
    pdf.cell(80, 5, "Signature", ln=False)

    # Right column — Authorised By
    pdf.set_xy(112, sig_y)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(80, 5, "Authorised By", ln=True)
    pdf.set_xy(112, sig_y + 8)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(80, 5, "Name:", ln=True)

    auth_line_y = sig_y + 30
    pdf.line(112, auth_line_y, 192, auth_line_y)
    pdf.set_xy(112, auth_line_y + 2)
    pdf.cell(80, 5, "Signature & Date")

    return bytes(pdf.output())
