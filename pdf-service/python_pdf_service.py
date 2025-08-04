from flask import Flask, send_file, make_response, request
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors

app = Flask(__name__)

@app.route('/pdf', methods=['GET', 'POST'])
def generate_pdf():
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    if request.method == 'POST':
        data = request.get_json()
        y = height - 50
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, y, f"Factura #{data.get('invoiceNumber', '')}")
        y -= 30
        p.setFont("Helvetica", 10)
        p.drawString(50, y, f"Cliente: {data.get('clientName', '')}")
        y -= 15
        if data.get('clientIdentification'):
            p.drawString(50, y, f"Cédula/RIF: {data.get('clientIdentification', '')}")
            y -= 15
        if data.get('clientAddress'):
            p.drawString(50, y, f"Dirección: {data.get('clientAddress', '')}")
            y -= 15
        if data.get('clientPhone'):
            p.drawString(50, y, f"Teléfono: {data.get('clientPhone', '')}")
            y -= 15
        if data.get('clientEmail'):
            p.drawString(50, y, f"Email: {data.get('clientEmail', '')}")
            y -= 15
        p.drawString(50, y, f"Fecha: {data.get('invoiceDate', '')}")
        y -= 25
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Items:")
        y -= 20
        # Tabla de items
        items = data.get('items', [])
        table_data = [["Descripción", "Cantidad", "Precio Unitario", "Total"]]
        for item in items:
            table_data.append([
                item.get('description', ''),
                str(item.get('quantity', '')),
                f"{item.get('unitPrice', 0):.2f}",
                f"{item.get('total', 0):.2f}"
            ])
        table = Table(table_data, colWidths=[2.5*inch, 1*inch, 1.2*inch, 1.2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.black),
            ('ALIGN', (1,1), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
        ]))
        table.wrapOn(p, width, height)
        table_height = 18 * (len(table_data))
        table.drawOn(p, 50, y - table_height)
        y = y - table_height - 20
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, f"Subtotal: {data.get('subtotal', 0):.2f}")
        y -= 15
        p.drawString(50, y, f"Impuesto: {data.get('tax', 0):.2f}")
        y -= 15
        p.drawString(50, y, f"Total: {data.get('totalAmount', 0):.2f}")
        y -= 20
        if data.get('notes'):
            p.setFont("Helvetica", 10)
            p.drawString(50, y, f"Notas: {data.get('notes', '')}")
            y -= 15
        p.setFont("Helvetica-Oblique", 8)
        p.drawString(50, 30, "Generado por TransportSys (Python)")
    else:
        # GET: demo PDF
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 750, "Hola desde Python")
    p.showPage()
    p.save()
    buffer.seek(0)
    response = make_response(send_file(buffer, mimetype='application/pdf', as_attachment=True, download_name='python-test.pdf'))
    response.headers['Content-Disposition'] = 'attachment; filename=python-test.pdf'
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 