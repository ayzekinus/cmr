import express from 'express';
import cors from 'cors';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// Dosya yolu ayarlari (ES Module icin)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Asset URL'leri (Otomatik indirilecek)
const FONT_URL = 'https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf';
const PDF_URL = 'https://raw.githubusercontent.com/goktugy/cmr-template/main/cmr-blank.pdf';

app.use(cors());
app.use(express.json());
// 'public' klasorundeki dosyalari (index.html) disari ac
app.use(express.static(path.join(__dirname, 'public')));

// PDF Olusturma Endpoint'i
app.post('/api/create-cmr', async (req, res) => {
    try {
        const data = req.body;
        
        // 1. Font ve Sablonu Indir
        const [fontBuffer, pdfBuffer] = await Promise.all([
            fetch(FONT_URL).then(r => r.arrayBuffer()),
            fetch(PDF_URL).then(r => r.arrayBuffer())
        ]);

        // 2. PDF Hazirla
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        pdfDoc.registerFontkit(fontkit);
        const customFont = await pdfDoc.embedFont(fontBuffer);
        const page = pdfDoc.getPages()[0];

        const draw = (text, x, y, size = 9) => {
            if (!text) return;
            page.drawText(String(text).toUpperCase(), { x, y, size, font: customFont, color: rgb(0,0,0) });
        };

        // --- Verileri Yaz ---
        // Gonderici
        if(data.sender) {
            draw(data.sender.name, 40, 770);
            draw(data.sender.address, 40, 755);
            draw(data.sender.city, 40, 740);
        }
        // Alici
        if(data.consignee) {
            draw(data.consignee.name, 40, 690);
            draw(data.consignee.address, 40, 675);
            draw(data.consignee.city, 40, 660);
        }
        // Yerler
        draw(data.delivery, 40, 620);
        draw(data.pickup, 40, 590);
        
        // Tasiyici
        if(data.carrier) {
            draw(data.carrier.name, 300, 770);
            draw(data.carrier.address, 300, 755);
        }

        // Mallar
        if(data.goods && Array.isArray(data.goods)) {
            let startY = 480;
            data.goods.forEach(item => {
                draw(item.marks, 40, startY);
                draw(item.nature, 110, startY);
                draw(item.weight, 400, startY);
                startY -= 15;
            });
        }
        
        // Tarih
        draw(new Date().toLocaleDateString('tr-TR'), 40, 100);

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=cmr_belgesi.pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("PDF Hatasi:", error);
        res.status(500).json({ error: "PDF olusturulamadi" });
    }
});

app.listen(PORT, () => {
    console.log(`Server calisiyor: port ${PORT}`);
});
