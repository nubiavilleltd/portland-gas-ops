from __future__ import annotations

from io import BytesIO
from urllib.request import urlopen

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from dataclasses import dataclass
from typing import Callable, Generic, Sequence, TypeVar



from datetime import date, datetime
from decimal import Decimal

from app.shared.config.company import COMPANY_INFO


# ---------------------------------------------------------------------
# Page
# ---------------------------------------------------------------------

PAGE_WIDTH, PAGE_HEIGHT = A4

MARGIN_LEFT = 18 * mm
MARGIN_RIGHT = PAGE_WIDTH - (18 * mm)


# ---------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------

PURPLE = colors.HexColor("#7C3AED")

DARK_TEXT = colors.HexColor("#1A1A1A")

MUTED_TEXT = colors.HexColor("#787878")

LIGHT_BORDER = colors.HexColor("#DCDCDC")

ROW_ALT = colors.HexColor("#FCFCFC")

HEADER_FILL = colors.HexColor("#F5F5F5")

TOTAL_FILL = colors.HexColor("#EDE9FE")


T = TypeVar("T")


@dataclass(frozen=True)
class TableColumn(Generic[T]):
    header: str
    width: float
    align: str = "left"          # left | center | right
    renderer: Callable[[T], str] = str


def fmt_currency(value: Decimal | float | int) -> str:
    return f"{float(value):,.2f}"


def fmt_date(value: date | datetime | None) -> str:
    if not value:
        return "—"

    if isinstance(value, datetime):
        value = value.date()

    return value.strftime("%d %b %Y")


def capitalize(value: str | None) -> str:
    if not value:
        return ""

    return value[:1].upper() + value[1:]

_cached_logo: ImageReader | None = None


def get_logo() -> ImageReader | None:
    global _cached_logo

    if _cached_logo is None:
        _cached_logo = load_logo()

    return _cached_logo


def load_logo() -> ImageReader | None:
    """
    Download the company logo from Cloudinary.

    Returns None if unavailable so callers can gracefully
    fall back to rendering the company name.
    """

    try:
        response = urlopen(COMPANY_INFO.logo_url)

        return ImageReader(
            BytesIO(
                response.read(),
            )
        )

    except Exception:
        return None
    
class PdfBuilder:

    def __init__(self, canvas):
        self.canvas = canvas

        self.page_width = PAGE_WIDTH
        self.page_height = PAGE_HEIGHT

        self.margin_left = MARGIN_LEFT
        self.margin_right = MARGIN_RIGHT

        self.cursor_y = PAGE_HEIGHT
    
    def draw_divider(
        self,
        y: float,
    ) -> None:

        self.canvas.setStrokeColor(LIGHT_BORDER)

        self.canvas.line(
            self.margin_left,
            y,
            self.margin_right,
            y,
        )
    def draw_header(self) -> None:

        logo = get_logo()

        if logo:
            self.canvas.drawImage(
                logo,
                self.margin_left,
                PAGE_HEIGHT - 25 * mm,
                width=28 * mm,
                height=15 * mm,
                preserveAspectRatio=True,
                mask="auto",
            )

        else:
            self.canvas.setFont(
                "Helvetica-Bold",
                16,
            )

            self.canvas.setFillColor(DARK_TEXT)

            self.canvas.drawString(
                self.margin_left,
                PAGE_HEIGHT - 18 * mm,
                COMPANY_INFO.name,
            )

        #
        # Company information
        #

        self.canvas.setFillColor(MUTED_TEXT)

        self.canvas.setFont(
            "Helvetica",
            7.5,
        )

        self.canvas.drawString(
            self.margin_left,
            PAGE_HEIGHT - 30 * mm,
            COMPANY_INFO.tagline,
        )

        right_x = self.margin_right

        self.canvas.drawRightString(
            right_x,
            PAGE_HEIGHT - 16 * mm,
            COMPANY_INFO.address,
        )

        self.canvas.drawRightString(
            right_x,
            PAGE_HEIGHT - 21 * mm,
            f"Tel: {COMPANY_INFO.phone} | {COMPANY_INFO.email}",
        )

        self.canvas.drawRightString(
            right_x,
            PAGE_HEIGHT - 26 * mm,
            COMPANY_INFO.website,
        )
        self.draw_divider(
            PAGE_HEIGHT - 33 * mm,
        )
        self.cursor_y = PAGE_HEIGHT - 42 * mm
    

    def draw_title(
        self,
        title: str,
        subtitle: str,
    ) -> None:
        """
        Draw the document title and subtitle.
        """

        #
        # Leave some space below the company header
        #
        y = self.cursor_y - 3 * mm

        #
        # Title
        #
        self.canvas.setFont(
            "Helvetica-Bold",
            22,
        )
        self.canvas.setFillColor(PURPLE)

        self.canvas.drawString(
            self.margin_left,
            y,
            title,
        )

        #
        # Subtitle
        #
        self.canvas.setFont(
            "Helvetica",
            8.5,
        )
        self.canvas.setFillColor(MUTED_TEXT)

        self.canvas.drawString(
            self.margin_left,
            y - 8 * mm,
            subtitle,
        )

        #
        # Divider
        #
        divider_y = y - 13 * mm

        self.draw_divider(divider_y)

        #
        # Leave space before the next section
        #
        self.cursor_y = divider_y - 8 * mm

    def draw_label_value(
        self,
        label: str,
        value: str,
        x: float,
        y: float,
        width: float,
    ) -> float:
        """
        Draw a label with a bold value beneath it.

        The value is automatically wrapped to fit within the
        supplied width.

        Returns the vertical space consumed.
        """

        #
        # Label
        #
        self.canvas.setFont(
            "Helvetica-Bold",
            6.5,
        )

        self.canvas.setFillColor(MUTED_TEXT)

        self.canvas.drawString(
            x,
            y,
            label.upper(),
        )

        #
        # Value
        #
        text = value or "—"

        font_name = "Helvetica-Bold"
        font_size = 9.5

        self.canvas.setFont(
            font_name,
            font_size,
        )

        self.canvas.setFillColor(DARK_TEXT)

        #
        # Wrap text
        #
        words = text.split()

        lines: list[str] = []
        current = ""

        for word in words:

            candidate = (
                word
                if not current
                else f"{current} {word}"
            )

            if (
                stringWidth(
                    candidate,
                    font_name,
                    font_size,
                )
                <= width
            ):
                current = candidate

            else:
                if current:
                    lines.append(current)

                current = word

        if current:
            lines.append(current)

        #
        # Draw wrapped lines
        #
        line_spacing = 4 * mm
        line_y = y - 5 * mm

        for line in lines:

            self.canvas.drawString(
                x,
                line_y,
                line,
            )

            line_y -= line_spacing

        #
        # Return height consumed so callers can
        # lay out the next section correctly.
        #
        return (
            5 * mm +
            max(1, len(lines)) * line_spacing
        )

    def draw_footer(
        self,
        disclaimer: str,
        page_number: int = 1,
    ) -> None:

        self.canvas.setFont(
            "Helvetica",
            7,
        )

        self.canvas.setFillColor(MUTED_TEXT)

        self.canvas.drawCentredString(
            PAGE_WIDTH / 2,
            10 * mm,
            disclaimer,
        )

        self.canvas.drawCentredString(
            PAGE_WIDTH / 2,
            6 * mm,
            f"Page {page_number}",
        )
    
    def next_line(self, height: float) -> float:
        """
        Move the cursor down and return the new Y position.
        """

        self.cursor_y -= height
        return self.cursor_y
    
    def draw_table(
        self,
        columns: Sequence[TableColumn],
        rows: Sequence,
        row_height: float = 8 * mm,
    ) -> None:
        """
        Draw a reusable table.

        Left-aligned cells automatically wrap onto multiple lines,
        while centered and right-aligned cells remain single-line.
        """

        table_width = sum(col.width for col in columns)

        x_positions = [self.margin_left]

        for column in columns[:-1]:
            x_positions.append(
                x_positions[-1] + column.width
            )

        header_height = 9 * mm

        y = self.cursor_y

        #
        # Header background
        #
        self.canvas.setFillColor(HEADER_FILL)

        self.canvas.rect(
            self.margin_left,
            y - header_height,
            table_width,
            header_height,
            fill=1,
            stroke=0,
        )

        #
        # Header border
        #
        self.canvas.setStrokeColor(LIGHT_BORDER)

        self.canvas.rect(
            self.margin_left,
            y - header_height,
            table_width,
            header_height,
            fill=0,
            stroke=1,
        )

        #
        # Header text
        #
        self.canvas.setFont(
            "Helvetica-Bold",
            7.5,
        )

        self.canvas.setFillColor(MUTED_TEXT)

        for i, column in enumerate(columns):

            x = x_positions[i]

            if column.align == "right":

                self.canvas.drawRightString(
                    x + column.width - 2 * mm,
                    y - 6 * mm,
                    column.header,
                )

            elif column.align == "center":

                self.canvas.drawCentredString(
                    x + column.width / 2,
                    y - 6 * mm,
                    column.header,
                )

            else:

                self.canvas.drawString(
                    x + 2 * mm,
                    y - 6 * mm,
                    column.header,
                )

        y -= header_height

        #
        # Body
        #
        for index, row in enumerate(rows):

            #
            # Determine row height based on wrapped cells
            #
            max_lines = 1

            for column in columns:

                if column.align != "left":
                    continue

                text = str(column.renderer(row))

                words = text.split()

                current = ""
                lines = 0

                for word in words:

                    candidate = (
                        word
                        if not current
                        else f"{current} {word}"
                    )

                    if (
                        stringWidth(
                            candidate,
                            "Helvetica",
                            9,
                        )
                        <= column.width - 4 * mm
                    ):
                        current = candidate

                    else:
                        lines += 1
                        current = word

                if current:
                    lines += 1

                max_lines = max(
                    max_lines,
                    lines,
                )

            actual_row_height = max(
                row_height,
                max_lines * 4 * mm + 4 * mm,
            )

            #
            # Alternate background
            #
            if index % 2 == 1:

                self.canvas.setFillColor(ROW_ALT)

                self.canvas.rect(
                    self.margin_left,
                    y - actual_row_height,
                    table_width,
                    actual_row_height,
                    fill=1,
                    stroke=0,
                )

            #
            # Bottom border
            #
            self.canvas.setStrokeColor(
                colors.HexColor("#EBEBEB")
            )

            self.canvas.line(
                self.margin_left,
                y - actual_row_height,
                self.margin_left + table_width,
                y - actual_row_height,
            )

            self.canvas.setFont(
                "Helvetica",
                9,
            )

            self.canvas.setFillColor(DARK_TEXT)

            #
            # Draw cells
            #
            for i, column in enumerate(columns):

                text = str(
                    column.renderer(row)
                )

                x = x_positions[i]

                if column.align == "right":

                    self.canvas.drawRightString(
                        x + column.width - 2 * mm,
                        y - 5.5 * mm,
                        text,
                    )

                elif column.align == "center":

                    self.canvas.drawCentredString(
                        x + column.width / 2,
                        y - 5.5 * mm,
                        text,
                    )

                else:

                    #
                    # Wrap text
                    #
                    words = text.split()

                    current = ""

                    lines: list[str] = []

                    for word in words:

                        candidate = (
                            word
                            if not current
                            else f"{current} {word}"
                        )

                        if (
                            stringWidth(
                                candidate,
                                "Helvetica",
                                9,
                            )
                            <= column.width - 4 * mm
                        ):
                            current = candidate

                        else:
                            if current:
                                lines.append(current)
                            current = word

                    if current:
                        lines.append(current)

                    line_y = y - 5.5 * mm

                    for line in lines:

                        self.canvas.drawString(
                            x + 2 * mm,
                            line_y,
                            line,
                        )

                        line_y -= 4 * mm

            y -= actual_row_height

        self.cursor_y = y

    def draw_total_row(
        self,
        label: str,
        value: str,
    ) -> None:
        """
        Purple highlighted total row.
        """

        row_height = 10 * mm

        width = self.margin_right - self.margin_left

        self.canvas.setFillColor(TOTAL_FILL)

        self.canvas.rect(
            self.margin_left,
            self.cursor_y - row_height,
            width,
            row_height,
            fill=1,
            stroke=0,
        )

        self.canvas.setFont(
            "Helvetica-Bold",
            9,
        )

        self.canvas.setFillColor(PURPLE)

        self.canvas.drawString(
            self.margin_left + 2 * mm,
            self.cursor_y - 6 * mm,
            label,
        )

        self.canvas.drawRightString(
            self.margin_right - 2 * mm,
            self.cursor_y - 6 * mm,
            value,
        )

        self.cursor_y -= row_height + 2 * mm


    def draw_text(
        self,
        text: str,
        font_size: float = 9,
        color=DARK_TEXT,
    ) -> None:
        """
        Draw a simple paragraph at the current cursor.
        """

        self.canvas.setFont(
            "Helvetica",
            font_size,
        )

        self.canvas.setFillColor(color)

        self.canvas.drawString(
            self.margin_left,
            self.cursor_y,
            text,
        )

        self.cursor_y -= 6 * mm
        

        



        

    



