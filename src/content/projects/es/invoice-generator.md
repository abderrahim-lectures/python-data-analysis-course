---
title: "Generador de Facturas"
description: "Genera facturas profesionales desde plantillas con exportación a PDF y seguimiento de pagos."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["cli", "pdf", "data-pipeline"]
learningObjectives:
  - "Modelar los datos de factura como dataclasses de Python con partidas y totales"
  - "Generar facturas PDF profesionales usando ReportLab"
  - "Calcular subtotales, impuestos y totales automáticamente"
  - "Hacer seguimiento del estado de pago y de las fechas de vencimiento de las facturas generadas"
prerequisites: ["Python 101"]
---

# 🧾 Construye un Generador de Facturas

Todo freelancer y pequeña empresa se enfrenta tarde o temprano a la misma tarea: convertir una hoja de cálculo del trabajo realizado en una factura profesional. Este proyecto construye una herramienta en Python que toma datos estructurados de factura — información del cliente, partidas con cantidades y tarifas, porcentajes de impuesto — y genera un PDF pulido con totales calculados, números de factura y fechas de vencimiento. Modelarás los datos, construirás el renderizador de PDF y harás seguimiento del estado de pago, todo desde la línea de comandos.

Esto asume Python 101 — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias que necesitarás.
2. Modelar los datos de factura como dataclasses de Python con información del cliente, partidas y reglas de impuesto.
3. Construir un renderizador de PDF que produzca facturas profesionales con totales calculados.
4. Añadir seguimiento de pagos con estado, fechas de vencimiento y detección de vencidas.
5. Conectar todo en un CLI que crea facturas, las lista y revisa su estado.
6. Generar un informe resumen de las facturas pendientes y pagadas.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — esta herramienta escribe archivos PDF en disco, lo que requiere un sistema de archivos local.

**Google Colab, Kaggle Notebooks y Binder** funcionan para probar la herramienta. El notebook instala los mismos paquetes y genera facturas de muestra en la sesión.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/invoice-generator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/invoice-generator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Finvoice-generator%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python, una librería de PDF y un directorio de proyecto.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init invoice-generator
cd invoice-generator
uv add click reportlab
```

`reportlab` es la librería estándar de Python para generar PDFs de forma programática. `click` construye el CLI.

### Crea la estructura del proyecto

```bash
mkdir -p invoicer
touch invoicer/__init__.py invoicer/models.py invoicer/pdf.py invoicer/tracker.py invoicer/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `invoice-generator/` existe con un `pyproject.toml`, y `click` y `reportlab` están instalados.
- ✅ El directorio `invoicer/` tiene todos los archivos de módulo requeridos.

## Paso 1: Modela los datos de factura

Una factura tiene un encabezado (número, fecha, fecha de vencimiento, estado), una sección del cliente (nombre, dirección, correo electrónico) y una lista de partidas (descripción, cantidad, tarifa). Modelarlo como dataclasses mantiene los datos limpios y hace que los métodos de cálculo sean naturales.

### 1.1 Define los modelos de datos

**👟 Pista inicial :** Crea `invoicer/models.py` con las clases `LineItem`, `Client` e `Invoice`.

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

Los decoradores `@property` hacen que los cálculos se sientan como atributos — `invoice.total` en lugar de `invoice.calculate_total()`. La propiedad `is_overdue` combina el estado y la fecha: una factura solo está vencida si se ha enviado y la fecha de vencimiento ha pasado. Una factura borrador no puede estar vencida porque aún no se ha enviado.

**🎯 Resultado esperado :** `LineItem("Consulting", 10, 150.0).total` devuelve `1500.0`. Una `LineItem` con cantidad 0 tiene total 0.

**🩹 Si sale mal :** Si `total` devuelve 0 cuando no debería, revisa que `quantity` y `rate` sean números (no cadenas). Si `is_overdue` siempre es `False`, el estado puede no ser `SENT`.

### 1.2 Verifica los modelos

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

**🎯 Resultado esperado :** Todas las afirmaciones pasan; el total es la suma de las partidas más el 10% de impuesto.

**🩹 Si sale mal :** Si el total es incorrecto, revisa que `tax_rate` sea `0.1` (decimal) y no `10` (porcentaje).

### 1.3 Verifica los modelos

**✅ Lista de verificación**

- ✅ `LineItem.total` calcula cantidad × tarifa correctamente.
- ✅ `Invoice.subtotal` suma todos los totales de las partidas.
- ✅ `Invoice.total` añade el impuesto al subtotal.
- ✅ `is_overdue` devuelve `True` solo para las facturas enviadas cuya fecha de vencimiento ya pasó.

**🤔 Pregunta(s) socrática(s)**

- Si un cliente solicita un descuento del 5% por pago anticipado, ¿dónde lo añadirías en el modelo? ¿Afectaría a `subtotal`, a `tax_amount` o a ambos?
- La clase `Invoice` guarda una `tax_rate` plana. ¿Cómo soportarías múltiples tasas de impuesto (impuesto estatal + impuesto federal) sin cambiar las propiedades de cálculo?

## Paso 2: Genera el PDF

ReportLab construye PDFs página por página, elemento por elemento. Crearás una función que toma un objeto `Invoice` y lo renderiza como un PDF de aspecto profesional con encabezado, información del cliente, tabla de partidas, totales e instrucciones de pago.

### 2.1 Construye el renderizador de PDF

**👟 Pista inicial :** Crea `invoicer/pdf.py` con una función que renderice una `Invoice` a un archivo PDF.

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

El `SimpleDocTemplate` maneja el diseño de la página. La `Table` con `TableStyle` crea una tabla de partidas profesional con colores de fila alternados, números alineados a la derecha y un encabezado oscuro. Los elementos `Spacer` añaden espacio de respiración entre las secciones. `Paragraph` con etiquetas HTML (`<b>`) añade texto en negrita sin necesidad de definiciones de estilo separadas.

**🎯 Resultado esperado :** `render_invoice(invoice, "INV-001.pdf")` crea un archivo PDF con el número de factura, la información del cliente, la tabla de partidas y los totales.

**🩹 Si sale mal :** Si el PDF está vacío, la lista `elements` puede estar vacía cuando se llama a `doc.build()`. Si la tabla no se renderiza, revisa que `Table` y `TableStyle` estén importados de `reportlab.platypus`.

### 2.2 Verifica la generación de PDF

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

**🎯 Resultado esperado :** Ambas afirmaciones pasan; el PDF existe y es más grande que 1 KB.

**🩹 Si sale mal :** Si el archivo tiene 0 bytes, `doc.build(elements)` puede haber fallado silenciosamente — revisa los errores de importación.

### 2.3 Verifica el renderizado de PDF

**✅ Lista de verificación**

- ✅ `render_invoice` crea un archivo PDF con el número de factura correcto.
- ✅ El PDF incluye las partidas, el subtotal, el impuesto y el total.
- ✅ El PDF es un archivo válido con un tamaño no trivial.

**🤔 Pregunta(s) socrática(s)**

- Si quisieras añadir el logotipo de tu empresa a la factura, ¿dónde lo colocarías en la canalización de renderizado? ¿Qué elemento de ReportLab usarías?
- El PDF se renderiza una vez. Si los datos de la factura cambian, tendrías que regenerarlo. ¿Cómo implementarías un modo de "vista previa" que muestre la factura en la terminal antes de guardarla?

## Paso 3: Haz seguimiento del estado de pago

Las facturas pasan por un ciclo de vida: borrador → enviada → pagada (o vencida). Hacer seguimiento de esto significa almacenar los datos de la factura de forma persistente y actualizar el estado conforme llegan los pagos.

### 3.1 Construye el rastreador

**👟 Pista inicial :** Crea `invoicer/tracker.py` con funciones para guardar, cargar y actualizar facturas.

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

El almacenamiento JSON es simple pero efectivo: cada factura es un archivo llamado `{invoice_number}.json`. La función `save_invoice` convierte la jerarquía de dataclasses en un diccionario plano que se serializa limpiamente. `load_invoice` reconstruye los objetos desde JSON. Este patrón de un archivo por factura es fácil de controlar con versiones, respaldar e inspeccionar a mano.

**🎯 Resultado esperado :** `save_invoice(invoice)` crea `invoices/INV-001.json`. `load_invoice("INV-001")` devuelve un objeto `Invoice` idéntico.

**🩹 Si sale mal :** Si `load_invoice` falla con un `KeyError`, la estructura JSON no coincide con el código de reconstrucción — revisa los nombres de los campos.

### 3.2 Verifica el rastreador

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

**🎯 Resultado esperado :** Todas las afirmaciones pasan; la factura hace un viaje de ida y vuelta (round-trip) a través de JSON correctamente.

**🩹 Si sale mal :** Si `loaded.total` es incorrecto, la tasa de impuesto o las partidas no se conservaron durante la serialización.

### 3.3 Verifica el seguimiento

**✅ Lista de verificación**

- ✅ `save_invoice` crea un archivo JSON en el directorio `invoices/`.
- ✅ `load_invoice` reconstruye un objeto `Invoice` idéntico.
- ✅ `update_status` cambia el estado y persiste el cambio.

**🤔 Pregunta(s) socrática(s)**

- Si dos facturas tienen el mismo número, el segundo guardado sobrescribe al primero. ¿Cómo detectarías y prevenirías los números de factura duplicados?
- Los archivos JSON funcionan para un solo usuario. ¿Cómo migrarías a una base de datos (SQLite, PostgreSQL) sin cambiar el modelo `Invoice`?

## Paso 4: Construye el CLI y el informe resumen

El CLI lo conecta todo: crear facturas desde la línea de comandos, listar las facturas existentes, revisar el estado de pago y generar informes resumen.

### 4.1 Construye el CLI

**👟 Pista inicial :** Crea `invoicer/cli.py` con comandos para crear, listar y reportar facturas.

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

El comando `create` acepta las partidas como una cadena JSON — compacta para la línea de comandos pero flexible para facturas complejas. El comando `list` muestra una tabla de todas las facturas con las partidas vencidas marcadas con `*`. El comando `report` agrega los totales por estado.

**🎯 Resultado esperado :** `uv run python -m invoicer.cli create --number INV-001 --client "Acme" --items '[{"desc":"Work","qty":10,"rate":150}]' --tax 0.1` crea un PDF y guarda los datos de la factura.

**🩹 Si sale mal :** Si el análisis JSON falla, la cadena de partidas no es JSON válido — usa comillas dobles para las claves y los valores.

### 4.2 Prueba de humo de extremo a extremo

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

**🎯 Resultado esperado :** Todas las afirmaciones pasan; los datos de la factura hacen un viaje de ida y vuelta correctamente y el PDF se genera.

**🩹 Si sale mal :** Si `loaded.total` no coincide, `tax_rate` no se conservó durante la serialización JSON.

### 4.3 Verifica la canalización del CLI

**✅ Lista de verificación**

- ✅ `create` guarda los datos de la factura y genera un archivo PDF.
- ✅ `list` muestra todas las facturas con su estado y total.
- ✅ `report` agrega los totales pendientes, pagados y vencidos.

**🤔 Pregunta(s) socrática(s)**

- El CLI guarda las partidas como una cadena JSON en la línea de comandos. ¿Cómo añadirías una opción `--from-csv` que lea las partidas de una hoja de cálculo?
- Si añadieras integración de correo electrónico, ¿cómo enviarías el PDF como adjunto usando `smtplib` de Python?

## ⚠️ Errores comunes

- **Confusión entre la tasa de impuesto decimal y porcentual.** `tax_rate=0.1` significa 10%. Un error común es pasar `10` en lugar de `0.1`, lo que aplica un impuesto del 1000%. Documenta siempre el formato esperado y valida el rango (0.0 a 1.0).
- **Olvidar revisar `is_overdue` contra el estado.** Una factura solo está vencida si su estado es `SENT`, no `DRAFT` ni `PAID`. La propiedad `is_overdue` maneja esto, pero si revisas las fechas de vencimiento directamente, marcarás los borradores como vencidos.
- **Sobrescribir los archivos de factura silenciosamente.** `save_invoice` escribe en `{invoice_number}.json` sin comprobar si el archivo existe. Añade una indicación de confirmación o numeración de versiones para prevenir sobrescrituras accidentales.
- **Problemas de codificación de PDF con caracteres especiales.** El `Paragraph` de ReportLab maneja HTML básico, pero los caracteres especiales (nombres con acentos, símbolos de moneda) pueden necesitar codificación explícita. Usa siempre UTF-8.
- **No validar las cantidades de las partidas.** Una cantidad negativa produciría un total negativo, que parece un reembolso en lugar de un cargo. Valida que `quantity > 0` al crear partidas.

## Lo que acabas de construir

Un generador de facturas que modela los datos de factura como objetos de Python validados, renderiza PDFs profesionales con totales calculados y tablas con estilo, hace seguimiento del estado de pago a través de un ciclo de vida (borrador → enviada → pagada) y genera informes resumen del ingreso pendiente. El almacenamiento de un archivo por factura es simple, auditable y fácil de migrar a una base de datos más adelante.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/invoice-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/invoice-generator) en el repositorio del curso tiene una versión más rica con más opciones de estilo de PDF, facturas de muestra y el CLI conectado de principio a fin. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Añade integración de correo electrónico que envíe la factura PDF como adjunto usando `smtplib` de Python.
- Construye un programador de facturas recurrentes que genere y envíe facturas semanal o mensualmente.
- Implementa un portal para clientes: una interfaz web simple donde los clientes puedan ver sus facturas y marcarlas como pagadas.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa y apta para principiantes sobre cómo añadir el tuyo mediante una **pull request**, incluso si nunca has usado git: hacer un fork del repositorio, crear una rama, hacer commit de tus archivos y abrir la PR, paso a paso. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓