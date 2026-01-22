import express from 'express';
import cors from 'cors';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'; // Fontkit sildik, StandardFonts ekledik
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- AYAR: Eğer elinde gerçek bir CMR PDF linki varsa buraya yapıştır ---
// Eğer link çalışmazsa sistem otomatik olarak boş sayfa oluşturur.
const PDF_URL = 'https://raw.githubusercontent.com/goktugy/cmr-template/main/cmr-blank.pdf'; 

app.use(cors());
app.use(express.json());

// HTML Kodunu direkt buraya gömüyoruz (Dosya yolu hatasını önlemek için)
const HTML_PAGE = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMR Oluşturucu</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        input { width: 100%; padding: 10px; margin: 5px 0 15px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;}
        button { width: 100%; padding: 15px; background: #28a745; color: white; border: none; font-size: 16px; cursor: pointer; }
        button:hover { background: #218838; }
        h1 { text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>CMR Belgesi Oluştur</h1>
        <form id="cmrForm">
            <label>Gönderici Firma</label>
            <input type="text" id="sender" value="Örnek İhracat Ltd. Şti.">
            
            <label>Alıcı Firma</label>
            <input type="text" id="consignee" value="Global Import GmbH">
            
            <label>Teslim Yeri</label>
            <input type="text" id="delivery" value="Munich, Germany">

            <button type="submit">PDF OLUŞTUR VE İNDİR</button>
        </form>
    </div>
    <script>
        document.getElementById('cmrForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "İşleniyor...";
            btn.disabled = true;
            
            const data = {
                sender: { name: document.getElementById('sender').value, address: "Istanbul", city: "TR" },
                consignee: { name: document.getElementById('consignee').value, address: "Munich", city: "DE" },
                delivery: document.getElementById('delivery').value,
                pickup: "Istanbul",
                goods: [{ marks: "1", nature: "Test Yükü", weight: "100" }]
            };

            try {
                const res = await fetch('/api/create-cmr', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                
                if(res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'cmr_belgesi.pdf';
                    document.body.appendChild(a); a.click(); a.remove();
                } else { 
                    alert('Hata oluştu! Lütfen sayfayı yenileyip tekrar deneyin.'); 
                }
            } catch(e) { alert('Bağlantı hatası: ' + e); }
            
            btn.innerText = originalText;
            btn.disabled = false;
        });
    </script>
</body>
</html>
`;

// Ana Sayfa Rotası
app.get('/', (req, res) => res.send(HTML_PAGE));

// PDF Oluşturma Rotası
app.post('/api/create-cmr', async (req, res) => {
    try {
        const data = req.body;
        let pdfDoc;
        let pdfBytes;

        // 1. PDF Şablonunu İndirmeyi Dene
        try {
            const response = await fetch(PDF_URL);
            
            // Eğer link bozuksa (404) veya hata verirse 'catch'e düşür
            if (!response.ok) throw new Error("Şablon indirilemedi");
            
            const buffer = await response.arrayBuffer();
            pdfDoc = await PDFDocument.load(buffer);
        
        } catch (err) {
            console.log("⚠️ Şablon URL'si çalışmadı, sıfırdan boş sayfa oluşturuluyor.");
            // Şablon yüklenemezse SIFIRDAN PDF oluştur (Çökmemesi için)
            pdfDoc = await PDFDocument.create();
            pdfDoc.addPage([595.28, 841.89]); // A4 Boyutu
        }

        // 2. Standart Font Kullan (İndirme derdi yok)
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.getPages()[0];

        // Yazı Yazma Fonksiyonu
        const draw = (text, x, y) => {
            if(text) {
                // Türkçe karakterleri basitçe temizle (Helvetica Türkçe desteklemez)
                // Gerçek projede font yüklemek gerekir ama şimdilik çökmemesi için:
                const safeText = String(text)
                    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
                    .replace(/ş/g, 's').replace(/Ş/g, 'S')
                    .replace(/ı/g, 'i').replace(/İ/g, 'I');

                page.drawText(safeText.toUpperCase(), { 
                    x, y, size: 10, font: font, color: rgb(0,0,0) 
                });
            }
        };

        // --- Verileri Yerleştir ---
        // Şablon yoksa koordinatlar boş kağıtta rastgele durabilir ama kod çalışır.
        
        // Gönderici
        draw(data.sender?.name, 40, 770);
        draw("Gonderici Adresi: " + data.sender?.address, 40, 755);

        // Alıcı
        draw(data.consignee?.name, 40, 690);
        draw("Alici Adresi: " + data.consignee?.address, 40, 675);

        // Teslim Yeri
        draw("Teslim Yeri: " + data.delivery, 40, 620);
        
        // Tarih
        draw("Tarih: " + new Date().toLocaleDateString(), 40, 100);

        // Eğer şablon yüklenemediyse uyarı notu ekle
        if(pdfDoc.getPageCount() === 1 && !req.body.isTemplateLoaded) {
             page.drawText("(Not: Sablon yuklenemedigi icin bos sayfaya yazildi)", { x: 40, y: 50, size: 8, font });
        }

        // 3. PDF'i Kaydet ve Gönder
        const pdfOutput = await pdfDoc.save();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=cmr.pdf');
        res.send(Buffer.from(pdfOutput));

    } catch (e) {
        console.error("KRİTİK HATA:", e);
        res.status(500).send("PDF oluşturulurken sunucu hatası.");
    }
});

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
