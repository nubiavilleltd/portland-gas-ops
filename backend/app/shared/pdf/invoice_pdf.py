
from __future__ import annotations

from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas

from app.crm.model import Customers
from app.invoices.model import Invoice
from app.orders.enums import DiscountType
from app.orders.model import Order, OrderItem
from app.payments.model import Payment
from app.shared.config.company import COMPANY_BANK_DETAILS
from app.shared.pdf.builder import (
    DARK_TEXT,
    MUTED_TEXT,
    PdfBuilder,
    TableColumn,
    fmt_currency,
    fmt_date,
)


def generate_invoice_pdf(
    *,
    invoice: Invoice,
    order: Order | None,
    customer: Customers | None,
) -> bytes:
    """
    Generate a professional invoice PDF.

    Returns
    -------
    bytes
        PDF bytes suitable for:

        • browser download
        • email attachment
        • cloud storage
        • audit archive
    """

    ###########################################################
    # Create document
    ###########################################################

    buffer = BytesIO()

    canvas = Canvas(buffer)

    builder = PdfBuilder(canvas)

    ###########################################################
    # Header
    ###########################################################

    builder.draw_header()

    ###########################################################
    # Title
    ###########################################################

    builder.draw_title(
        title="INVOICE",
        subtitle=(
            f"Invoice No: {invoice.invoice_no}"
            f"   |   Issued: {fmt_date(invoice.issued_date)}"
        ),
    )

    ###########################################################
    # Two-column layout
    ###########################################################

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
        value=customer.address_line1 if customer else "—",
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
    builder.draw_divider(y)

    builder.cursor_y = y - 6 * mm

    ###########################################################
    # Invoice Items
    ###########################################################

    def quantity_with_unit(item: OrderItem) -> str:

        unit = ""

        if item.product and item.product.unit:
            unit = item.product.unit.value.replace("_", " ")

        quantity = (
            f"{Decimal(item.quantity):,.3f}"
            .rstrip("0")
            .rstrip(".")
        )

        return f"{quantity} {unit}".strip()

    columns = [

        TableColumn[OrderItem](
            header="Product",
            width=70 * mm,
            align="left",
            renderer=lambda item: item.product_name,
        ),

        TableColumn[OrderItem](
            header="Qty",
            width=30 * mm,
            align="center",
            renderer=quantity_with_unit,
        ),

        TableColumn[OrderItem](
            header="Unit Price (NGN)",
            width=37 * mm,
            align="right",
            renderer=lambda item: fmt_currency(
                item.unit_price,
            ),
        ),

        TableColumn[OrderItem](
            header="Total (NGN)",
            width=37 * mm,
            align="right",
            renderer=lambda item: fmt_currency(
                item.total,
            ),
        ),

    ]

    builder.draw_table(
        columns=columns,
        rows=order.order_items if order else [],
    )

    builder.cursor_y -= 2 * mm

    ###########################################################
    # Totals
    ###########################################################

    subtotal = invoice.total_amount

    discount = Decimal("0.00")

    if order:

        discount = Decimal(
            order.discount_amount or 0
        )

        subtotal = (
            Decimal(invoice.total_amount)
            + discount
        )
            #
    # Subtotal
    #
    builder.canvas.setFont(
        "Helvetica",
        8.5,
    )

    builder.canvas.setFillColor(DARK_TEXT)

    right_label_x = builder.margin_right - 60 * mm
    right_value_x = builder.margin_right - 2 * mm

    if discount > 0:

        builder.canvas.drawString(
            right_label_x,
            builder.cursor_y,
            "Subtotal",
        )

        builder.canvas.drawRightString(
            right_value_x,
            builder.cursor_y,
            f"NGN {fmt_currency(subtotal)}",
        )

        builder.cursor_y -= 7 * mm

        if (
            order
            and order.discount_type == DiscountType.percentage
        ):
            discount_label = (
                f"Discount ({order.discount_value}%)"
            )
        else:
            discount_label = "Discount"

        builder.canvas.drawString(
            right_label_x,
            builder.cursor_y,
            discount_label,
        )

        builder.canvas.drawRightString(
            right_value_x,
            builder.cursor_y,
            f"- NGN {fmt_currency(discount)}",
        )

        builder.cursor_y -= 9 * mm

    #
    # Grand Total
    #
    builder.draw_total_row(
        label="GRAND TOTAL",
        value=f"NGN {fmt_currency(invoice.total_amount)}",
    )

    builder.cursor_y -= 10 * mm

    ###########################################################
    # Payment Summary
    ###########################################################

    payments: list[Payment] = (
        invoice.payments or []
    )

    amount_paid = sum(
        Decimal(payment.amount)
        for payment in payments
    )

    balance = (
        Decimal(invoice.total_amount)
        - amount_paid
    )

    builder.canvas.setFont(
        "Helvetica-Bold",
        6.5,
    )

    builder.canvas.setFillColor(
        MUTED_TEXT,
    )

    builder.canvas.drawString(
        builder.margin_left,
        builder.cursor_y,
        "PAYMENT SUMMARY",
    )

    builder.cursor_y -= 8 * mm

    left_height = builder.draw_label_value(
        label="Amount Paid",
        value=f"NGN {fmt_currency(amount_paid)}",
        x=col1,
        y=builder.cursor_y,
        width=col_width,
    )

    right_height = builder.draw_label_value(
        label="Balance Due",
        value=f"NGN {fmt_currency(balance)}",
        x=col2,
        y=builder.cursor_y,
        width=col_width,
    )

    builder.cursor_y -= (
        max(left_height, right_height)
        + 8 * mm
    )

    ###########################################################
    # Payment History
    ###########################################################

    if payments:

        builder.canvas.setFont(
            "Helvetica-Bold",
            6.5,
        )

        builder.canvas.setFillColor(
            MUTED_TEXT,
        )

        builder.canvas.drawString(
            builder.margin_left,
            builder.cursor_y,
            "PAYMENT HISTORY",
        )

        builder.cursor_y -= 6 * mm

        payment_columns = [

            TableColumn[Payment](
                header="Reference",
                width=50 * mm,
                align="left",
                renderer=lambda p:
                    p.reference or "-",
            ),

            TableColumn[Payment](
                header="Date",
                width=40 * mm,
                align="center",
                renderer=lambda p:
                    fmt_date(
                        p.payment_date,
                    ),
            ),

            TableColumn[Payment](
                header="Method",
                width=44 * mm,
                align="center",
                renderer=lambda p:
                    p.method.value.replace(
                        "_",
                        " ",
                    ).title(),
            ),

            TableColumn[Payment](
                header="Amount (NGN)",
                width=40 * mm,
                align="right",
                renderer=lambda p:
                    fmt_currency(
                        p.amount,
                    ),
            ),

        ]

        builder.draw_table(
            columns=payment_columns,
            rows=payments,
        )

        builder.cursor_y -= 10 * mm

    ###########################################################
    # Divider
    ###########################################################

    builder.draw_divider(
        builder.cursor_y + 3 * mm,
    )

    builder.cursor_y -= 3 * mm

    ###########################################################
    # Payment Instructions
    ###########################################################

    builder.canvas.setFont(
        "Helvetica-Bold",
        6.5,
    )

    builder.canvas.setFillColor(
        MUTED_TEXT,
    )

    builder.canvas.drawString(
        builder.margin_left,
        builder.cursor_y,
        "PAYMENT INSTRUCTIONS",
    )

    builder.cursor_y -= 8 * mm

    left_height = builder.draw_label_value(
        label="Bank Name",
        value=COMPANY_BANK_DETAILS.bank_name,
        x=col1,
        y=builder.cursor_y,
        width=col_width,
    )

    right_height = builder.draw_label_value(
        label="Account Name",
        value=COMPANY_BANK_DETAILS.account_name,
        x=col2,
        y=builder.cursor_y,
        width=col_width,
    )

    builder.cursor_y -= (
        max(left_height, right_height)
        + 5 * mm
    )

    builder.draw_label_value(
        label="Account Number",
        value=COMPANY_BANK_DETAILS.account_number,
        x=col1,
        y=builder.cursor_y,
        width=col_width,
    )

    ###########################################################
    # Footer
    ###########################################################

    builder.draw_footer(
        disclaimer=(
            "This is a computer-generated invoice. "
            "Portland Gas Limited — Internal Operations Platform."
        ),
    )

    ###########################################################
    # Finish
    ###########################################################

    canvas.showPage()

    canvas.save()

    pdf = buffer.getvalue()

    buffer.close()

    return pdf