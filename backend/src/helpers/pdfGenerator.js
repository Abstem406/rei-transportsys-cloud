const puppeteer = require('puppeteer');

async function generateFacturaPdf(factura) {
    let browser;
    try {
        // Puedes personalizar el HTML aquí, pero para prueba dejamos el mínimo
        const htmlContent = `<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body>hola</body></html>`;

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        return pdfBuffer;
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { generateFacturaPdf };