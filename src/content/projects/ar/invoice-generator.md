---
title: "مولّد الفواتير"
description: "أنشئ فواتير احترافية من القوالب مع تصدير PDF وتتبع المدفوعات."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["cli", "pdf", "data-pipeline"]
learningObjectives:
  - "نمذجة بيانات الفاتورة كفئات بيانات Python مع بنود الأسطر والمجاميع"
  - "إنشاء فواتير PDF احترافية باستخدام ReportLab"
  - "حساب المجاميع الفرعية والضرائب والمجاميع الكلية تلقائيًا"
  - "تتبع حالة الدفع وتواريخ الاستحقاق للفواتير المُولَّدة"
prerequisites: ["Python 101"]
---


# 🧾 ابنِ مولّد الفواتير

يواجه كل مستقل وصاحب عمل صغير في النهاية المهمة نفسها: تحويل جدول بيانات عن العمل المُنجَز إلى فاتورة احترافية. يبني هذا المشروع أداة Python تأخذ بيانات فاتورة منظمة ، معلومات العميل، وبنود أسطر بالكميات والأسعار، ونسب الضريبة ، وينتج ملف PDF مصقولًا بمجاميع محسوبة وأرقام فواتير وتواريخ استحقاق. ستُصمّم البيانات، وتبني عارض PDF، وتتتبع حالة الدفع، كل ذلك من سطر الأوامر.

يفترض هذا إنهاء Python 101 ، لا شيء من تحليل البيانات مطلوب. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع باستخدام `uv` وتثبيت التبعيات التي ستحتاجها.
2. نمذجة بيانات الفاتورة كفئات بيانات Python تتضمن معلومات العميل وبنود الأسطر وقواعد الضريبة.
3. بناء عارض PDF ينتج فواتير احترافية بمجاميع محسوبة.
4. إضافة تتبع للمدفوعات مع الحالة وتواريخ الاستحقاق واكتشاف التأخر عن السداد.
5. ربط كل شيء في واجهة CLI تنشئ الفواتير وتسردها وتفحص حالتها.
6. إنشاء تقرير ملخص عن الفواتير غير المسدَّدة والمسدَّدة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي ، هذه الأداة تكتب ملفات PDF إلى القرص، ما يتطلب نظام ملفات محليًا.

**Google Colab وKaggle Notebooks وBinder** تصلح لتجربة الأداة. يثبّت الدفتر الحزم نفسها ويولّد فواتير عينات في الجلسة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/invoice-generator/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/invoice-generator/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Finvoice-generator%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python، ومكتبة PDF، ومجلد مشروع.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق طرفيتك وأعد فتحها، ثم أكِّد:

```bash
uv --version
```

### هيّئ المشروع

```bash
uv init invoice-generator
cd invoice-generator
uv add click reportlab
```

`reportlab` هي مكتبة Python المعيارية لإنشاء ملفات PDF برمجيًا. يبني `click` واجهة CLI.

### أنشئ بنية المشروع

```bash
mkdir -p invoicer
touch invoicer/__init__.py invoicer/models.py invoicer/pdf.py invoicer/tracker.py invoicer/cli.py
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ يوجد `invoice-generator/` مع `pyproject.toml`، وحزمتا `click` و`reportlab` مثبَّتتان.
- ✅ يحتوي مجلد `invoicer/` على جميع ملفات الوحدات المطلوبة.

## الخطوة 1: صمّم بيانات الفاتورة

للفاتورة ترويسة (الرقم والتاريخ وتاريخ الاستحقاق والحالة)، وقسم عميل (الاسم والعنوان والبريد الإلكتروني)، وقائمة بنود أسطر (الوصف والكمية والسعر). نمذجة هذا كفئات بيانات تحافظ على نظافة البيانات وتجعل دوال الحساب طبيعية.

### 1.1 حدّد نماذج البيانات

**👟 تلميح البداية :**

أنشئ `invoicer/models.py` مع الفئات `LineItem` و`Client` و`Invoice`.

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

تجعل معدّلات `@property` الحسابات تبدو كخصائص ، `invoice.total` بدلًا من `invoice.calculate_total()`. تجمع خاصية `is_overdue` بين الحالة والتاريخ: الفاتورة متأخرة عن السداد فقط إذا أُرسِلَت وانقضى تاريخ استحقاقها. الفاتورة المسودة لا يمكن أن تتأخر عن السداد لأنها لم تُرسَل بعد.

**🎯 الناتج المتوقع :**

يُرجع `LineItem("Consulting", 10, 150.0).total` القيمة `1500.0`. بنود السطر بكمية 0 لها إجمالي 0.

**🩹 إذا لم يعمل :**

إذا أرجع `total` القيمة 0 عندما لا يجب ذلك، تحقّق أن `quantity` و`rate` أرقام (وليست سلاسل). إذا كان `is_overdue` دائمًا `False`، فقد تكون الحالة ليست `SENT`.

### 1.2 تحقّق من النماذج

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

**🎯 الناتج المتوقع :**

تمر التوكيدات كلها؛ الإجمالي هو مجموع بنود الأسطر زائد ضريبة 10٪.

**🩹 إذا لم يعمل :**

إذا كان الإجمالي خاطئًا، تحقّق أن `tax_rate` هي `0.1` (كسر عشري) وليست `10` (نسبة مئوية).

### 1.3 تحقّق من النماذج

**✅ قائمة التحقق**

- ✅ يحسب `LineItem.total` الكمية × السعر بشكل صحيح.
- ✅ يجمع `Invoice.subtotal` كل مجاميع بنود الأسطر.
- ✅ يضيف `Invoice.total` الضريبة إلى المجموع الفرعي.
- ✅ يُرجع `is_overdue` القيمة `True` فقط للفواتير المرسلة التي انقضى تاريخ استحقاقها.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا طلب عميل خصم السداد المبكر بنسبة 5٪، فأين ستضيفه في النموذج؟ هل سيؤثر على `subtotal` أم `tax_amount` أم كلاهما؟
- تخزّن الفئة `Invoice` نسبة ضريبة واحدة ثابتة. كيف تدعم أكثر من نسبة ضريبة (ضريبة الولاية + ضريبة فيدرالية) دون تغيير خصائص الحساب؟

## الخطوة 2: أنشئ ملف PDF

يبني ReportLab ملفات PDF صفحةً بصفحة وعنصرًا بعنصر. ستنشئ دالة تأخذ كائن `Invoice` وترسمه كملف PDF بمظهر احترافي يتضمن الترويسة ومعلومات العميل وجدول بنود الأسطر والمجاميع وتعليمات الدفع.

### 2.1 ابنِ عارض PDF

**👟 تلميح البداية :**

أنشئ `invoicer/pdf.py` مع دالة ترمّم فاتورة إلى ملف PDF.

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

يتولّى `SimpleDocTemplate` تخطيط الصفحة. ينشئ `Table` مع `TableStyle` جدول بنود أسطر احترافيًا بألوان صفوف متناوبة وأرقام مبررة يمينًا وترويسة داكنة. تضيف عناصر `Spacer` مساحة للتنفس بين الأقسام. يستخدم `Paragraph` مع وسوم HTML (`<b>`) لإضافة نص غامق دون الحاجة إلى تعريفات أنماط منفصلة.

**🎯 الناتج المتوقع :**

ينشئ `render_invoice(invoice, "INV-001.pdf")` ملف PDF يتضمن رقم الفاتورة ومعلومات العميل وجدول بنود الأسطر والمجاميع.

**🩹 إذا لم يعمل :**

إذا كان ملف PDF فارغًا، فقد تكون قائمة `elements` فارغة عند استدعاء `doc.build()`. إذا لم يرسم الجدول، تحقّق أن `Table` و`TableStyle` مستورَدان من `reportlab.platypus`.

### 2.2 تحقّق من إنشاء PDF

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

**🎯 الناتج المتوقع :**

يمر التوكيدان؛ ملف PDF موجود وحجمه أكبر من 1 كيلوبايت.

**🩹 إذا لم يعمل :**

إذا كان الملف 0 بايت، فقد فشل `doc.build(elements)` بصمت ، تحقّق من أخطاء الاستيراد.

### 2.3 تحقّق من رسم PDF

**✅ قائمة التحقق**

- ✅ ينشئ `render_invoice` ملف PDF برقم الفاتورة الصحيح.
- ✅ يتضمن ملف PDF بنود الأسطر والمجموع الفرعي والضريبة والإجمالي.
- ✅ الملف PDF صالح وله حجم غير بديهي.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا أردتَ إضافة شعار شركتك إلى الفاتورة، فأين تضعه في خط أنابيب الرسم؟ وما عنصر ReportLab الذي ستستخدمه؟
- يُرسم ملف PDF مرة واحدة. إذا تغيّرت بيانات الفاتورة، ستحتاج إلى إعادة إنشائه. كيف تنفّذ وضع «معاينة» يعرض الفاتورة في الطرفية قبل الحفظ؟

## الخطوة 3: تتبّع حالة الدفع

تمر الفواتير بدورة حياة: مسودة ← مرسلة ← مسدَّدة (أو متأخرة). تتبع هذا يعني تخزين بيانات الفاتورة بشكل دائم وتحديث الحالة مع وصول المدفوعات.

### 3.1 ابنِ المتتبّع

**👟 تلميح البداية :**

أنشئ `invoicer/tracker.py` مع دوال لحفظ الفواتير وتحميلها وتحديثها.

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

التخزين في JSON بسيط لكنه فعّال: كل فاتورة ملف باسم `{invoice_number}.json`. تحوّل دالة `save_invoice` تسلسل الفئات إلى قاموس مسطّح يتحوّل إلى JSON بشكل نظيف. تعيد `load_invoice` بناء الكائنات من JSON. هذا النمط «ملف لكل فاتورة» سهل لإدارته بالإصدارات والنسخ الاحتياطي والفحص اليدوي.

**🎯 الناتج المتوقع :**

ينشئ `save_invoice(invoice)` الملف `invoices/INV-001.json`. يُرجع `load_invoice("INV-001")` كائن `Invoice` مطابقًا.

**🩹 إذا لم يعمل :**

إذا فشل `load_invoice` بخطأ `KeyError`، فإن بنية JSON لا تطابق كود إعادة البناء ، تحقّق من أسماء الحقول.

### 3.2 تحقّق من المتتبّع

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

**🎯 الناتج المتوقع :**

تمر التوكيدات كلها؛ تمر الفاتورة عبر JSON ذهابًا وإيابًا بشكل صحيح.

**🩹 إذا لم يعمل :**

إذا كانت قيمة `loaded.total` خاطئة، فلم تُحفظ نسبة الضريبة أو البنود أثناء التسلسل.

### 3.3 تحقّق من التتبع

**✅ قائمة التحقق**

- ✅ ينشئ `save_invoice` ملف JSON في مجلد `invoices/`.
- ✅ تُعيد `load_invoice` بناء كائن Invoice مطابق.
- ✅ يغيّر `update_status` الحالة ويحفظ التغيير بشكل دائم.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا كانت لفواتيرتين الرقم نفسه، يحذف الحفظ الثاني الأول. كيف تكتشف أرقام الفواتير المكررة وتمنعها؟
- تعمل ملفات JSON لمستخدم واحد. كيف ترحّل إلى قاعدة بيانات (SQLite، PostgreSQL) دون تغيير نموذج Invoice؟

## الخطوة 4: ابنِ واجهة CLI وتقرير الملخص

تربط واجهة CLI كل شيء معًا: إنشاء الفواتير من سطر الأوامر، وسرد الفواتير الموجودة، وفحص حالة الدفع، وإنشاء تقارير ملخص.

### 4.1 ابنِ واجهة CLI

**👟 تلميح البداية :**

أنشئ `invoicer/cli.py` مع أوامر لإنشاء الفواتير وسردها وإصدار تقارير عنها.

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

يقبل أمر `create` البنود كسلسلة JSON ، مضغوطة لسطر الأوامر لكنها مرنة للفواتير المعقدة. يعرض أمر `list` جدولًا بكل الفواتير مع تحديد البنود المتأخرة بعلامة `*`. يجمع أمر `report` المجاميع حسب الحالة.

**🎯 الناتج المتوقع :**

ينشئ `uv run python -m invoicer.cli create --number INV-001 --client "Acme" --items '[{"desc":"Work","qty":10,"rate":150}]' --tax 0.1` ملف PDF ويحفظ بيانات الفاتورة.

**🩹 إذا لم يعمل :**

إذا فشل تحليل JSON، فسلسلة البنود ليست JSON صالحًا ، استخدم اقتباسات مزدوجة للمفاتيح والقيم.

### 4.2 اختبار دخان شامل من البداية للنهاية

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

**🎯 الناتج المتوقع :**

تمر التوكيدات كلها؛ تمر بيانات الفاتورة ذهابًا وإيابًا بشكل صحيح ويُولَّد ملف PDF.

**🩹 إذا لم يعمل :**

إذا لم تتطابق `loaded.total`، فلم تُحفظ `tax_rate` أثناء تسلسل JSON.

### 4.3 تحقّق من خط أنابيب CLI

**✅ قائمة التحقق**

- ✅ يحفظ `create` بيانات الفاتورة وينشئ ملف PDF.
- ✅ يعرض `list` جميع الفواتير مع الحالة والإجمالي.
- ✅ يجمع `report` مجاميع غير المسدَّد والمسدَّد والمتأخر.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تخزّن واجهة CLI البنود كسلسلة JSON في سطر الأوامر. كيف تضيف خيار `--from-csv` يقرأ بنود الأسطر من جدول بيانات؟
- إذا أضفت تكاملًا للبريد الإلكتروني، كيف ترسل ملف PDF كمرفق باستخدام `smtplib` في Python؟

## ⚠️ مآزق شائعة

- **الخلط بين نسبة الضريبة العشرية والنسبة المئوية.** `tax_rate=0.1` تعني 10٪. خطأ شائع هو تمرير `10` بدلًا من `0.1`، ما يطبّق ضريبة 1000٪. وثّق دائمًا الصيغة المتوقعة وتحقّق من المدى (من 0.0 إلى 1.0).
- **نسيان فحص `is_overdue` مقابل الحالة.** الفاتورة متأخرة فقط إذا كانت حالتها `SENT`، وليست `DRAFT` أو `PAID`. خاصية `is_overdue` تتعامل مع هذا، لكن إذا فحصت تواريخ الاستحقاق مباشرةً، فستعلّم المسودات كمتأخرة.
- **الكتابة فوق ملفات الفواتير بصمت.** يكتب `save_invoice` إلى `{invoice_number}.json` دون التحقق من وجود الملف. أضف موجه تأكيد أو ترقيم إصدارات لمنع الكتابة فوق العارضة.
- **مشاكل ترميز PDF مع الأحرف الخاصة.** يتعامل `Paragraph` في ReportLab مع HTML الأساسي، لكن الأحرف الخاصة (أسماء بعلامات تشكيل، رموز العملات) قد تحتاج ترميزًا صريحًا. استخدم UTF-8 دائمًا.
- **عدم التحقق من كميات بنود الأسطر.** الكمية السالبة تنتج إجماليًا سالبًا، ما يبدو كاسترداد بدلًا من رسوم. تحقّق أن `quantity > 0` عند إنشاء بنود الأسطر.

## ما بنيته للتو

مولّد فواتير يصمّم بيانات الفواتير ككائنات Python مُتحقَّق منها، ويرسم ملفات PDF احترافية بمجاميع محسوبة وجداول منسّقة، ويتتبّع حالة الدفع عبر دورة حياة (مسودة ← مرسلة ← مسدَّدة)، وينشئ تقارير ملخص عن الإيرادات غير المسدَّدة. تخزين «ملف لكل فاتورة» بسيط وقابل للتدقيق وسهل الترحيل إلى قاعدة بيانات لاحقًا.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/invoice-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/invoice-generator) في مستودع الدورة نسخة أغنى بمزيد من خيارات تنسيق PDF وفواتير عينات وواجهة CLI موصولة من البداية للنهاية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف تكاملًا للبريد الإلكتروني يرسل فاتورة PDF كمرفق باستخدام `smtplib` في Python.
- ابنِ جدولة فواتير متكررة تنشئ الفواتير وترسلها أسبوعيًا أو شهريًا.
- نفّذ بوابة عميل: واجهة ويب بسيطة يستطيع العملاء من خلالها عرض فواتيرهم والإشارة إلى دفعها.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓