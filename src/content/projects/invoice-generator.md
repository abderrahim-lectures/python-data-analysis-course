---
title: "Build an Invoice Generator"
description: "Generate professional PDF invoices from structured data with line items, tax calculation, and payment tracking."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["cli", "pdf", "data-pipeline"]
learningObjectives:
  - "Model invoice data as Python dataclasses with line items and totals"
  - "Generate professional PDF invoices using ReportLab"
  - "Calculate subtotals, taxes, and totals automatically"
  - "Track payment status and due dates for generated invoices"
prerequisites: ["Python 101"]
---

# 🧾 Build an Invoice Generator

Every freelancer and small business eventually faces the same task: turn a spreadsheet of work done into a professional invoice. This project builds a Python tool that takes structured invoice data, client info, line items with quantities and rates, tax percentages, and generates a polished PDF with calculated totals, invoice numbers, and due dates. You'll model the data, build the PDF renderer, and track payment status, all from the command line.

This assumes Python 101, nothing from Data Analysis is required. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the dependencies you'll need.
2. Model invoice data as Python dataclasses with client info, line items, and tax rules.
3. Build a PDF renderer that produces professional invoices with calculated totals.
4. Add payment tracking with status, due dates, and overdue detection.
5. Wire everything into a CLI that creates invoices, lists them, and checks status.
6. Generate a summary report of outstanding and paid invoices.

## Where to run this

**Locally with `uv`** is the primary path, this tool writes PDF files to disk, which requires a local filesystem.

**Google Colab, Kaggle Notebooks, and Binder** work for trying the tool. The notebook installs the same packages and generates sample invoices in the session.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/invoice-generator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/invoice-generator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Finvoice-generator%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment, a PDF library, and a project directory.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init invoice-generator
cd invoice-generator
uv add click reportlab
```

`reportlab` is the standard Python library for generating PDFs programmatically. `click` builds the CLI.

### Create the project structure

```bash
mkdir -p invoicer
touch invoicer/__init__.py invoicer/models.py invoicer/pdf.py invoicer/tracker.py invoicer/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `invoice-generator/` exists with a `pyproject.toml`, and `click` and `reportlab` are installed.
- ✅ The `invoicer/` directory has all required module files.

## Step 1: Model invoice data

An invoice has a header (number, date, due date, status), a client section (name, address, email), and a list of line items (description, quantity, rate). Modeling this as dataclasses keeps the data clean and makes calculation methods natural.

### 1.1 Define the data models

**👟 Starter hint:** Create `invoicer/models.py` with `LineItem`, `Client`, and `Invoice` classes.

```python
# invoicer/models.py
from dataclasses import dataclass, field
from datetime import date, timedelta
from enum import Enum

class InvoiceStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"

@dataclass
class LineItem:
    description: str
    quantity: float
    rate: float

    @property
    def total(self) -> float:
        return self.quantity * self.rate

@dataclass
class Client:
    name: str
    address: str = ""
    email: str = ""

@dataclass
class Invoice:
    invoice_number: str
    client: Client
    items: list[LineItem]
    tax_rate: float = 0.0  # as decimal, e.g. 0.1 for 10%
    issue_date: date = field(default_factory=date.today)
    due_days: int = 30
    status: InvoiceStatus = InvoiceStatus.DRAFT

    @property
    def subtotal(self) -> float:
        return sum(item.total for item in self.items)

    @property
    def tax_amount(self) -> float:
        return self.subtotal * self.tax_rate

    @property
    def total(self) -> float:
        return self.subtotal + self.tax_amount

    @property
    def due_date(self) -> date:
        return self.issue_date + timedelta(days=self.due_days)

    @property
    def is_overdue(self) -> bool:
        return self.status == InvoiceStatus.SENT and date.today() > self.due_date
```

The `@property` decorators make calculations feel like attributes, `invoice.total` instead of `invoice.calculate_total()`. The `is_overdue` property combines status and date: an invoice is only overdue if it's been sent and the due date has passed. A draft invoice can't be overdue because it hasn't been sent yet.

**🎯 Expected output:** `LineItem("Consulting", 10, 150.0).total` returns `1500.0`. A `LineItem` with quantity 0 has total 0.

**🩹 If it's off:** If `total` returns 0 when it shouldn't, check that `quantity` and `rate` are numbers (not strings). If `is_overdue` is always `False`, the status may not be `SENT`.

### 1.2 Verify the models

```python
# Quick test
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus
from datetime import date

client = Client(name="Acme Corp", email="billing@acme.com")
items = [
    LineItem("Web Development", 40, 150.0),
    LineItem("Design Review", 10, 100.0),
]
inv = Invoice(invoice_number="INV-001", client=client, items=items, tax_rate=0.1)
assert inv.subtotal == 7000.0
assert inv.tax_amount == 700.0
assert inv.total == 7700.0
assert inv.status == InvoiceStatus.DRAFT
```

**🎯 Expected output:** All assertions pass; the total is the sum of line items plus 10% tax.

**🩹 If it's off:** If the total is wrong, check that `tax_rate` is `0.1` (decimal) not `10` (percent).

### 1.3 Verify the models

**✅ Checklist**

- ✅ `LineItem.total` computes quantity × rate correctly.
- ✅ `Invoice.subtotal` sums all line item totals.
- ✅ `Invoice.total` adds tax to the subtotal.
- ✅ `is_overdue` returns `True` only for sent invoices past their due date.

**🤔 Socratic Question(s)**

- If a client requests a 5% early-payment discount, where in the model would you add it? Would it affect `subtotal`, `tax_amount`, or both?
- The `Invoice` class stores a flat `tax_rate`. How would you support multiple tax rates (state tax + federal tax) without changing the calculation properties?

## Step 2: Generate the PDF

ReportLab builds PDFs page by page, element by element. You'll create a function that takes an `Invoice` object and renders it as a professional-looking PDF with header, client info, line item table, totals, and payment instructions.

### 2.1 Build the PDF renderer

**👟 Starter hint:** Create `invoicer/pdf.py` with a function that renders an Invoice to a PDF file.

```python
# invoicer/pdf.py
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from invoicer.models import Invoice

def render_invoice(invoice: Invoice, output_path: str):
    """Render an Invoice object to a PDF file."""
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=25*mm, rightMargin=25*mm,
                            topMargin=25*mm, bottomMargin=25*mm)
    styles = getSampleStyleSheet()
    elements = []

    # Header
    elements.append(Paragraph(f"INVOICE #{invoice.invoice_number}", styles["Title"]))
    elements.append(Spacer(1, 12))

    # Client info
    elements.append(Paragraph(f"<b>Bill To:</b> {invoice.client.name}", styles["Normal"]))
    if invoice.client.address:
        elements.append(Paragraph(invoice.client.address, styles["Normal"]))
    if invoice.client.email:
        elements.append(Paragraph(invoice.client.email, styles["Normal"]))
    elements.append(Spacer(1, 12))

    # Dates
    elements.append(Paragraph(f"<b>Issue Date:</b> {invoice.issue_date}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Due Date:</b> {invoice.due_date}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Status:</b> {invoice.status.value.upper()}", styles["Normal"]))
    elements.append(Spacer(1, 18))

    # Line items table
    table_data = [["Description", "Qty", "Rate", "Total"]]
    for item in invoice.items:
        table_data.append([
            item.description,
            str(item.quantity),
            f"${item.rate:,.2f}",
            f"${item.total:,.2f}",
        ])

    table = Table(table_data, colWidths=[3*inch, 0.8*inch, 1.2*inch, 1.2*inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#ecf0f1")]),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 18))

    # Totals
    elements.append(Paragraph(f"<b>Subtotal:</b> ${invoice.subtotal:,.2f}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Tax ({invoice.tax_rate*100:.0f}%):</b> ${invoice.tax_amount:,.2f}", styles["Normal"]))
    elements.append(Paragraph(f"<b>TOTAL: ${invoice.total:,.2f}</b>", styles["Heading2"]))
    elements.append(Spacer(1, 24))

    # Footer
    elements.append(Paragraph("Thank you for your business!", styles["Normal"]))

    doc.build(elements)
    print(f"PDF saved to {output_path}")
```

The `SimpleDocTemplate` handles page layout. The `Table` with `TableStyle` creates a professional line-item table with alternating row colors, right-aligned numbers, and a dark header. The `Spacer` elements add breathing room between sections. `Paragraph` with HTML tags (`<b>`) adds bold text without needing separate style definitions.

**🎯 Expected output:** `render_invoice(invoice, "INV-001.pdf")` creates a PDF file with the invoice number, client info, line items table, and totals.

**🩹 If it's off:** If the PDF is empty, the `elements` list may be empty when `doc.build()` is called. If the table doesn't render, check that `Table` and `TableStyle` are imported from `reportlab.platypus`.

### 2.2 Verify PDF generation

```python
from invoicer.models import Invoice, LineItem, Client
from invoicer.pdf import render_invoice
import os

client = Client(name="Test Client")
items = [LineItem("Service", 1, 100.0)]
inv = Invoice(invoice_number="T-001", client=client, items=items)
render_invoice(inv, "/tmp/test_invoice.pdf")
assert os.path.exists("/tmp/test_invoice.pdf")
assert os.path.getsize("/tmp/test_invoice.pdf") > 1000  # non-trivial size
```

**🎯 Expected output:** Both assertions pass; the PDF exists and is larger than 1 KB.

**🩹 If it's off:** If the file is 0 bytes, `doc.build(elements)` may have failed silently, check for import errors.

### 2.3 Verify PDF rendering

**✅ Checklist**

- ✅ `render_invoice` creates a PDF file with the correct invoice number.
- ✅ The PDF includes line items, subtotal, tax, and total.
- ✅ The PDF is a valid file with non-trivial size.

**🤔 Socratic Question(s)**

- If you wanted to add your company logo to the invoice, where in the rendering pipeline would you place it? What ReportLab element would you use?
- The PDF is rendered once. If the invoice data changes, you'd need to regenerate. How would you implement a "preview" mode that shows the invoice in the terminal before saving?

## Step 3: Track payment status

Invoices go through a lifecycle: draft → sent → paid (or overdue). Tracking this means storing invoice data persistently and updating status as payments come in.

### 3.1 Build the tracker

**👟 Starter hint:** Create `invoicer/tracker.py` with functions to save, load, and update invoices.

```python
# invoicer/tracker.py
import json
from pathlib import Path
from datetime import date
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus

INVOICES_DIR = Path("invoices")

def save_invoice(invoice: Invoice):
    """Save an invoice to a JSON file."""
    INVOICES_DIR.mkdir(exist_ok=True)
    data = {
        "invoice_number": invoice.invoice_number,
        "client": {"name": invoice.client.name, "address": invoice.client.address, "email": invoice.client.email},
        "items": [{"description": i.description, "quantity": i.quantity, "rate": i.rate} for i in invoice.items],
        "tax_rate": invoice.tax_rate,
        "issue_date": invoice.issue_date.isoformat(),
        "due_days": invoice.due_days,
        "status": invoice.status.value,
    }
    path = INVOICES_DIR / f"{invoice.invoice_number}.json"
    path.write_text(json.dumps(data, indent=2))
    print(f"Invoice saved to {path}")

def load_invoice(invoice_number: str) -> Invoice:
    """Load an invoice from its JSON file."""
    path = INVOICES_DIR / f"{invoice_number}.json"
    data = json.loads(path.read_text())
    client = Client(**data["client"])
    items = [LineItem(**i) for i in data["items"]]
    return Invoice(
        invoice_number=data["invoice_number"],
        client=client,
        items=items,
        tax_rate=data["tax_rate"],
        issue_date=date.fromisoformat(data["issue_date"]),
        due_days=data["due_days"],
        status=InvoiceStatus(data["status"]),
    )

def update_status(invoice_number: str, status: InvoiceStatus):
    """Update an invoice's status."""
    invoice = load_invoice(invoice_number)
    invoice.status = status
    save_invoice(invoice)
    print(f"Invoice {invoice_number} status: {status.value}")
```

The JSON storage is simple but effective: each invoice is a file named `{invoice_number}.json`. The `save_invoice` function converts the dataclass hierarchy to a flat dictionary that serializes cleanly. `load_invoice` reconstructs the objects from JSON. This file-per-invoice pattern is easy to version-control, back up, and inspect by hand.

**🎯 Expected output:** `save_invoice(invoice)` creates `invoices/INV-001.json`. `load_invoice("INV-001")` returns an identical `Invoice` object.

**🩹 If it's off:** If `load_invoice` fails with a `KeyError`, the JSON structure doesn't match the reconstruction code, check field names.

### 3.2 Verify the tracker

```python
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus
from invoicer.tracker import save_invoice, load_invoice, update_status

client = Client(name="Test Co")
items = [LineItem("Work", 5, 100.0)]
inv = Invoice(invoice_number="TR-001", client=client, items=items, tax_rate=0.1)
save_invoice(inv)

loaded = load_invoice("TR-001")
assert loaded.client.name == "Test Co"
assert loaded.total == 550.0

update_status("TR-001", InvoiceStatus.SENT)
reloaded = load_invoice("TR-001")
assert reloaded.status == InvoiceStatus.SENT
```

**🎯 Expected output:** All assertions pass; the invoice round-trips through JSON correctly.

**🩹 If it's off:** If `loaded.total` is wrong, the tax rate or items weren't preserved during serialization.

### 3.3 Verify tracking

**✅ Checklist**

- ✅ `save_invoice` creates a JSON file in the `invoices/` directory.
- ✅ `load_invoice` reconstructs an identical Invoice object.
- ✅ `update_status` changes the status and persists the change.

**🤔 Socratic Question(s)**

- If two invoices have the same number, the second save overwrites the first. How would you detect and prevent duplicate invoice numbers?
- JSON files work for a single user. How would you migrate to a database (SQLite, PostgreSQL) without changing the Invoice model?

## Step 4: Build the CLI and summary report

The CLI ties everything together: create invoices from the command line, list existing invoices, check payment status, and generate summary reports.

### 4.1 Build the CLI

**👟 Starter hint:** Create `invoicer/cli.py` with commands for creating, listing, and reporting on invoices.

```python
# invoicer/cli.py
import json
import click
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus
from invoicer.pdf import render_invoice
from invoicer.tracker import save_invoice, load_invoice, update_status, INVOICES_DIR

@click.group()
def cli():
    """Invoice Generator — create, track, and report on invoices."""
    pass

@cli.command()
@click.option("--number", required=True, help="Invoice number")
@click.option("--client", required=True, help="Client name")
@click.option("--items", required=True, help='JSON items: [{"desc":"Work","qty":1,"rate":100}]')
@click.option("--tax", default=0.0, help="Tax rate as decimal (e.g. 0.1 for 10%%)")
@click.option("--output", default=None, help="PDF output path")
def create(number, client, items, tax, output):
    """Create an invoice and generate a PDF."""
    items_list = [LineItem(i["desc"], i["qty"], i["rate"]) for i in json.loads(items)]
    inv = Invoice(
        invoice_number=number,
        client=Client(name=client),
        items=items_list,
        tax_rate=tax,
    )
    save_invoice(inv)
    pdf_path = output or f"{number}.pdf"
    render_invoice(inv, pdf_path)

@cli.command()
def list():
    """List all saved invoices."""
    if not INVOICES_DIR.exists():
        click.echo("No invoices found.")
        return
    for path in sorted(INVOICES_DIR.glob("*.json")):
        inv = load_invoice(path.stem)
        status_marker = " *" if inv.is_overdue else ""
        click.echo(f"  {inv.invoice_number} | {inv.client.name} | ${inv.total:,.2f} | {inv.status.value}{status_marker}")

@cli.command()
@click.argument("invoice_number")
@click.argument("status", type=click.Choice(["sent", "paid"]))
def status_cmd(invoice_number, status):
    """Update an invoice's payment status."""
    update_status(invoice_number, InvoiceStatus(status))

@cli.command()
def report():
    """Show a summary of all invoices."""
    if not INVOICES_DIR.exists():
        click.echo("No invoices to report.")
        return
    total_outstanding = 0.0
    total_paid = 0.0
    overdue_count = 0
    for path in sorted(INVOICES_DIR.glob("*.json")):
        inv = load_invoice(path.stem)
        if inv.status == InvoiceStatus.PAID:
            total_paid += inv.total
        else:
            total_outstanding += inv.total
            if inv.is_overdue:
                overdue_count += 1
    click.echo(f"Total outstanding: ${total_outstanding:,.2f}")
    click.echo(f"Total paid: ${total_paid:,.2f}")
    click.echo(f"Overdue invoices: {overdue_count}")

if __name__ == "__main__":
    cli()
```

The `create` command accepts items as a JSON string, compact for the command line but flexible for complex invoices. The `list` command shows a table of all invoices with overdue items marked with `*`. The `report` command aggregates totals by status.

**🎯 Expected output:** `uv run python -m invoicer.cli create --number INV-001 --client "Acme" --items '[{"desc":"Work","qty":10,"rate":150}]' --tax 0.1` creates a PDF and saves the invoice data.

**🩹 If it's off:** If the JSON parsing fails, the items string isn't valid JSON, use double quotes for keys and values.

### 4.2 End-to-end smoke test

```python
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus
from invoicer.pdf import render_invoice
from invoicer.tracker import save_invoice, load_invoice

client = Client(name="Smoke Test Co", email="test@example.com")
items = [LineItem("Consulting", 20, 200.0), LineItem("Travel", 3, 500.0)]
inv = Invoice(invoice_number="SMOKE-001", client=client, items=items, tax_rate=0.08)

# Save and render
save_invoice(inv)
render_invoice(inv, "/tmp/smoke_invoice.pdf")

# Reload
loaded = load_invoice("SMOKE-001")
assert loaded.client.name == "Smoke Test Co"
assert loaded.subtotal == 5500.0
assert loaded.total == 5940.0  # 5500 * 1.08
assert loaded.is_overdue is False  # still a draft
```

**🎯 Expected output:** All assertions pass; the invoice data round-trips correctly and the PDF is generated.

**🩹 If it's off:** If `loaded.total` doesn't match, the `tax_rate` wasn't preserved during JSON serialization.

### 4.3 Verify the CLI pipeline

**✅ Checklist**

- ✅ `create` saves invoice data and generates a PDF file.
- ✅ `list` shows all invoices with status and total.
- ✅ `report` aggregates outstanding, paid, and overdue totals.

**🤔 Socratic Question(s)**

- The CLI stores items as a JSON string on the command line. How would you add a `--from-csv` option that reads line items from a spreadsheet?
- If you added email integration, how would you send the PDF as an attachment using Python's `smtplib`?

## ⚠️ Common pitfalls

- **Tax rate confusion between decimal and percent.** `tax_rate=0.1` means 10%. A common mistake is passing `10` instead of `0.1`, which applies 1000% tax. Always document the expected format and validate the range (0.0 to 1.0).
- **Forgetting to check `is_overdue` against status.** An invoice is only overdue if its status is `SENT`, not `DRAFT` or `PAID`. The `is_overdue` property handles this, but if you check due dates directly, you'll flag drafts as overdue.
- **Overwriting invoice files silently.** `save_invoice` writes to `{invoice_number}.json` without checking if the file exists. Add a confirmation prompt or version numbering to prevent accidental overwrites.
- **PDF encoding issues with special characters.** ReportLab's `Paragraph` handles basic HTML, but special characters (accented names, currency symbols) may need explicit encoding. Always use UTF-8.
- **Not validating line item quantities.** A negative quantity would produce a negative total, which looks like a refund instead of a charge. Validate that `quantity > 0` when creating line items.

## What you just built

An invoice generator that models invoice data as validated Python objects, renders professional PDFs with calculated totals and styled tables, tracks payment status through a lifecycle (draft → sent → paid), and generates summary reports of outstanding revenue. The file-per-invoice storage is simple, auditable, and easy to migrate to a database later.

:::tip[Run a fuller version without any local setup]
[`examples/invoice-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/invoice-generator) in the course repo has a richer version with more PDF styling options, sample invoices, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add email integration that sends the PDF invoice as an attachment using Python's `smtplib`.
- Build a recurring invoice scheduler that generates and sends invoices on a weekly or monthly basis.
- Implement a client portal: a simple web interface where clients can view their invoices and mark them as paid.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
