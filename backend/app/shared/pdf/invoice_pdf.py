from __future__ import annotations

from io import BytesIO

from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas

from app.invoices.model import Invoice
from app.orders.model import Order
from app.customers.model import Customer

from app.shared.pdf.builder import (
    PdfBuilder,
    fmt_date,
)


def generate_invoice_pdf(
    *,
    invoice: Invoice,
    order: Order | None,
    customer: Customer | None,
) -> bytes:
    """
    Generate an invoice PDF.

    Returns
    -------
    bytes
        PDF bytes suitable for downloading,
        storing or attaching to an email.
    """

    #
    # Create PDF
    #
    buffer = BytesIO()

    canvas = Canvas(buffer)

    builder = PdfBuilder(canvas)

    #
    # Header
    #
    builder.draw_header()

    #
    # Title
    #
    builder.draw_title(
        title="INVOICE",
        subtitle=(
            f"Invoice No: {invoice.invoice_no}"
            f"   |   Issued: {fmt_date(invoice.issued_date)}"
        ),
    )

    #
    # Two-column layout
    #
    col1 = builder.margin_left

    col2 = builder.page_width / 2 + 4 * mm

    col_width = (
        builder.page_width / 2
        - builder.margin_left
        - 4 * mm
    )

    y = builder.cursor_y

    #
    # Bill To / Due Date
    #
    left_height = builder.draw_label_value(
        label="Bill To",
        value=order.customer_name if order else "—",
        x=col1,
        y=y,
        width=col_width,
    )

    right_height = builder.draw_label_value(
        label="Due Date",
        value=fmt_date(invoice.due_date),
        x=col2,
        y=y,
        width=col_width,
    )

    y -= max(left_height, right_height) + 5 * mm

    #
    # Address / Order Number
    #
    left_height = builder.draw_label_value(
        label="Address",
        value=customer.address if customer else "—",
        x=col1,
        y=y,
        width=col_width,
    )

    right_height = builder.draw_label_value(
        label="Order Number",
        value=order.order_no if order else "—",
        x=col2,
        y=y,
        width=col_width,
    )

    y -= max(left_height, right_height) + 5 * mm

    #
    # Email / Phone
    #
    left_height = builder.draw_label_value(
        label="Email",
        value=customer.email if customer else "—",
        x=col1,
        y=y,
        width=col_width,
    )

    right_height = builder.draw_label_value(
        label="Phone",
        value=customer.phone if customer else "—",
        x=col2,
        y=y,
        width=col_width,
    )

    y -= max(left_height, right_height) + 5 * mm

    #
    # Divider
    #
    builder.draw_divider(
        y,
    )

    builder.cursor_y = y - 6 * mm

    #
    # Finish
    #
    canvas.showPage()

    canvas.save()

    pdf = buffer.getvalue()

    buffer.close()

    return pdf