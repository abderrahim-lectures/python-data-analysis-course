"""Generates a small set of sample PDFs so this example runs standalone,
with no need to go find real PDFs of your own first.

Run with: uv run python generate_sample_pdfs.py

This is a one-time setup script, not part of the RAG pipeline itself --
real usage means dropping your own PDFs into pdfs/ instead. It needs
`reportlab`, which is only a dependency of *this* script, not of the
chat-with-your-PDFs app.
"""

from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

PDFS_DIR = Path("pdfs")


def write_pdf(path: Path, pages: list[list[str]], title: str) -> None:
    """Writes one PDF where `pages` is a list of pages, each a list of
    paragraph strings for that page."""
    c = canvas.Canvas(str(path), pagesize=LETTER)
    width, height = LETTER

    for page_lines in pages:
        c.setFont("Helvetica-Bold", 16)
        c.drawString(1 * inch, height - 1 * inch, title)
        c.setFont("Helvetica", 11)
        y = height - 1.5 * inch
        for line in page_lines:
            for wrapped in wrap_text(line, 90):
                c.drawString(1 * inch, y, wrapped)
                y -= 0.25 * inch
            y -= 0.15 * inch
        c.showPage()

    c.save()


def wrap_text(text: str, width: int) -> list[str]:
    """Naive word-wrap so lines fit on the page."""
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) > width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def main() -> None:
    PDFS_DIR.mkdir(exist_ok=True)

    write_pdf(
        PDFS_DIR / "employee-handbook.pdf",
        title="Northwind Traders -- Employee Handbook",
        pages=[
            [
                "Section 1: Time Off",
                "Full-time employees accrue 18 days of paid time off per year, "
                "credited at the start of each quarter. Unused days roll over "
                "up to a maximum of 10 days into the following year.",
                "Requests for time off must be submitted at least 5 business "
                "days in advance through the HR portal, except in the case of "
                "documented medical emergencies.",
            ],
            [
                "Section 2: Remote Work",
                "Employees may work remotely up to 3 days per week with manager "
                "approval. Fully remote arrangements require a written agreement "
                "renewed annually with HR.",
                "Remote employees are expected to be reachable during core hours, "
                "10am to 4pm in their local time zone.",
            ],
            [
                "Section 3: Expense Reimbursement",
                "Business expenses under $75 can be self-approved and submitted "
                "through the expense portal within 30 days of purchase. Expenses "
                "above $75 require prior manager approval.",
                "Reimbursements are processed within two pay cycles of a "
                "correctly submitted claim.",
            ],
        ],
    )

    write_pdf(
        PDFS_DIR / "product-warranty.pdf",
        title="Aurora Blender 3000 -- Warranty Guide",
        pages=[
            [
                "Coverage Period",
                "The Aurora Blender 3000 is covered by a 2-year limited warranty "
                "from the date of original purchase, covering defects in "
                "materials and workmanship under normal household use.",
            ],
            [
                "What Is Not Covered",
                "The warranty does not cover damage from misuse, unauthorized "
                "repairs, commercial use, or normal wear of the blade assembly, "
                "which is considered a consumable part.",
                "Water damage to the base unit is excluded unless caused by a "
                "manufacturing defect in the seal.",
            ],
            [
                "How to File a Claim",
                "To file a warranty claim, register your product at "
                "aurora-appliances.example/register and contact support with "
                "your order number and a description of the defect.",
                "Approved claims are resolved by repair, replacement, or refund "
                "at Aurora's discretion, typically within 10 business days.",
            ],
        ],
    )

    write_pdf(
        PDFS_DIR / "city-permit-guide.pdf",
        title="Riverside City -- Home Renovation Permit Guide",
        pages=[
            [
                "When You Need a Permit",
                "A building permit is required for any structural changes, "
                "electrical rewiring, new plumbing lines, or additions over "
                "120 square feet. Cosmetic work such as painting or flooring "
                "does not require a permit.",
            ],
            [
                "Application Process",
                "Permit applications are submitted online through the Riverside "
                "Permits Portal and typically reviewed within 15 business days. "
                "Incomplete applications are returned with a list of missing "
                "items rather than rejected outright.",
                "A licensed contractor's information is required for electrical "
                "and plumbing permits, but not for general structural permits.",
            ],
            [
                "Fees and Inspections",
                "Permit fees are based on the estimated project cost, starting "
                "at $85 for projects under $5,000. At least one inspection is "
                "required before a permit is closed out; larger projects may "
                "require inspections at multiple stages.",
            ],
        ],
    )

    print(f"Wrote 3 sample PDFs to {PDFS_DIR}/")


if __name__ == "__main__":
    main()
