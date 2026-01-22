import express from 'express';
import cors from 'cors';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- AYARLAR ---
// Eğer elinde gerçek bir CMR PDF şablonu linki varsa buraya yaz.
// Link çalışmazsa sistem otomatik olarak beyaz kağıt üzerine yazar.
const PDF_TEMPLATE_URL = 'https://raw.githubusercontent.com/goktugy/cmr-template/main/cmr-blank.pdf'; 

app.use(cors());
app.use(express.json());

// --- 1. WEB ARAYÜZÜ (FRONTEND) ---
const HTML_PAGE = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profesyonel CMR Oluşturucu</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #e9ecef; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #2c3e50; margin-bottom: 30px; }
        h3 { border-bottom: 2px solid #eee; padding-bottom: 10px; color: #e67e22; margin-top: 30px; }
        
        .row { display: flex; gap: 20px; flex-wrap: wrap; }
        .col { flex: 1; min-width: 250px; }
        
        label { display: block; font-weight: 600; margin-bottom: 5px; font-size: 13px; color: #555; }
        input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; font-size: 14px; }
        textarea { resize: vertical; height: 80px; }
        
        .goods-row { background: #f8f9fa; padding: 10px; margin-bottom: 10px; border-radius: 5px; display: flex; gap: 10px; }
        .goods-row input { margin: 0; }
        
        button { width: 100%; padding: 15px; background: #27ae60; color: white; border: none; font-size: 18px; font-weight: bold; border-radius: 5px; cursor: pointer; margin-top: 30px; transition: background 0.3s; }
        button:hover { background: #219150; }
        button:disabled { background: #95a5a6; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="container">
        <h1>CMR Belgesi Oluştur</h1>
        <form id="cmrForm">
            
            <div class="row">
                <div class="col">
                    <h3>1. Gönderici (Sender)</h3>
                    <textarea id="sender" placeholder="Ad, Adres, Ülke..."></textarea>
                </div>
                <div class="col">
                    <h3>2. Alıcı (Consignee)</h3>
                    <textarea id="consignee" placeholder="Ad, Adres, Ülke..."></textarea>
                </div>
            </div>

            <div class="row">
                <div class="col">
                    <h3>16. Taşıyıcı (Carrier)</h3>
                    <textarea id="carrier" placeholder="Firma Adı, Adres, Kaşe..."></textarea>
                </div>
            </div>

            <div class="row">
                <div class="col">
                    <h3>3. Teslim Yeri (Place of Delivery)</h3>
                    <input type="text" id="deliveryPlace" placeholder="Şehir, Ülke">
                </div>
                <div class="col">
                    <h3>4. Yükleme Yeri (Place of taking over)</h3>
                    <input type="text" id="pickupPlace" placeholder="Şehir, Ülke, Tarih">
                </div>
            </div>

            <h3>6-12. Malların Tanımı (Goods)</h3>
            <div id="goodsContainer">
                <div class="goods-row">
                    <input type="text" class="marks" placeholder="Marka/No (Örn: Palet 1)" style="flex:1">
                    <input type="text" class="nature" placeholder="Malın Cinsi" style="flex:2">
                    <input type="text" class="packages" placeholder="Koli Adeti" style="flex:1">
                    <input type="text" class="weight" placeholder="Brüt Kg" style="flex:1">
                </div>
                <div class="goods-row">
                    <input type="text" class="marks" placeholder="Marka/No" style="flex:1">
                    <input type="text" class="nature" placeholder="Malın Cinsi" style="flex:2">
                    <input type="text" class="packages" placeholder="Adet" style="flex:1">
                    <input type="text" class="weight" placeholder="Kg" style="flex:1">
                </div>
                <div class="goods-row">
                    <input type="text" class="marks" placeholder="Marka/No" style="flex:1">
                    <input type="text" class="nature" placeholder="Malın Cinsi" style="flex:2">
                    <input type="text" class="packages" placeholder="Adet" style="flex:1">
                    <input type="text" class="weight" placeholder="Kg" style="flex:1">
                </div>
            </div>

            <div class="row">
                <div class="col">
                    <h3>13. Talimatlar (Instructions)</h3>
                    <textarea id="instructions" placeholder="Gümrük, sigorta vb. talimatlar"></textarea>
                </div>
                <div class="col">
                    <h3>18. Çekinceler (Reservations)</h3>
                    <textarea id="reservations" placeholder="Sürücü notları, hasar vb."></textarea>
                </div>
            </div>

            <div class="row">
                <div class="col">
                    <h3>23. İmza ve Tarih</h3>
                    <input type="text" id="signPlace" placeholder="Düzenlenen Yer">
                    <input type="date" id="signDate">
                </div>
            </div>

            <button type="submit">CMR PDF İNDİR</button>
        </form>
    </div>

    <script>
        // Bugünün tarihini ayarla
        document.getElementById('signDate').valueAsDate = new Date();

        document.getElementById('cmrForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "PDF Oluşturuluyor...";
            btn.disabled = true;

            // Mal Listesini Topla
            const goodsRows = document.querySelectorAll('.goods-row');
            const goodsData = [];
            goodsRows.forEach(row => {
                const marks = row.querySelector('.marks').value;
                const nature = row.querySelector('.nature').value;
                const packages = row.querySelector('.packages').value;
                const weight = row.querySelector('.weight').value;
                if(marks || nature || weight) {
                    goodsData.push({ marks, nature, packages, weight });
                }
            });

            // Tüm veriyi hazırla
            const data = {
                sender: document.getElementById('sender').value,
                consignee: document.getElementById('consignee').value,
                carrier: document.getElementById('carrier').value,
                deliveryPlace: document.getElementById('deliveryPlace').value,
                pickupPlace: document.getElementById('pickupPlace').value,
                instructions: document.getElementById('instructions').value,
                reservations: document.getElementById('reservations').value,
                signPlace: document.getElementById('signPlace').value,
                signDate: document.getElementById('signDate').value,
                goods: goodsData
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
                    a.href = url; 
                    a.download = 'cmr_belgesi.pdf';
                    document.body.appendChild(a); a.click(); a.remove();
                } else { 
                    alert('Hata oluştu.'); 
                }
            } catch(e) { alert('Hata: ' + e); }
            
            btn.innerText = originalText;
            btn.disabled = false;
        });
    </script>
</body>
</html>
`;

// --- 2. BACKEND (PDF OLUŞTURMA) ---
app.get('/', (req, res) => res.send(HTML_PAGE));

app.post('/api/create-cmr', async (req, res) => {
    try {
        const data = req.body;
        let pdfDoc;

        // Şablon yüklemeyi dene, yoksa boş sayfa aç
        try {
            const response = await fetch(PDF_TEMPLATE_URL);
            if (!response.ok) throw new Error("Şablon yok");
            const buffer = await response.arrayBuffer();
            pdfDoc = await PDFDocument.load(buffer);
        } catch (err) {
            console.log("Şablon yüklenemedi, boş sayfa kullanılıyor.");
            pdfDoc = await PDFDocument.create();
            pdfDoc.addPage([595.28, 841.89]); // A4
        }

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.getPages()[0];
        
        // Türkçe karakter temizleme fonksiyonu (Helvetica için)
        const clean = (text) => {
            if(!text) return "";
            return String(text)
                .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
                .replace(/ş/g, 's').replace(/Ş/g, 'S')
                .replace(/ı/g, 'i').replace(/İ/g, 'I')
                .replace(/ç/g, 'c').replace(/Ç/g, 'C')
                .replace(/ö/g, 'o').replace(/Ö/g, 'O')
                .replace(/ü/g, 'u').replace(/Ü/g, 'U')
                .toUpperCase();
        };

        const draw = (text, x, y, size = 9, maxWidth = 200) => {
            if(!text) return;
            // Basit satır kaydırma (Word wrap) simülasyonu yapılabilir ama
            // şimdilik tek satır basıyoruz.
            page.drawText(clean(text), { x, y, size, font, color: rgb(0,0,0) });
        };

        // --- KOORDİNATLAR (A4 CMR Şablonuna Göre Tahmini) ---
        // Şablon varsa bu koordinatlar kutuların içine denk gelir.
        // Şablon yoksa beyaz sayfada düzgün durur.

        // 1. Gönderici
        draw(data.sender, 40, 760);

        // 2. Alıcı
        draw(data.consignee, 40, 680);

        // 3. Teslim Yeri
        draw(data.deliveryPlace, 40, 620);

        // 4. Yükleme Yeri
        draw(data.pickupPlace, 40, 590);

        // 16. Taşıyıcı (Genelde sağ üst veya sağ ortadadır)
        draw(data.carrier, 300, 760);

        // 6-12. Mallar (Tablo)
        let y = 500;
        // Başlıklar (Eğer boş sayfa ise anlaşılsın diye)
        if(pdfDoc.getPageCount() === 1) { // Basit kontrol
             draw("MARKA | CINS | ADET | KILO", 40, y + 15, 8);
        }
        
        if (data.goods && Array.isArray(data.goods)) {
            data.goods.forEach(item => {
                draw(item.marks, 40, y);      // Marka
                draw(item.nature, 120, y);    // Cins
                draw(item.packages, 350, y);  // Adet
                draw(item.weight, 450, y);    // Kilo
                y -= 20; // Bir alt satıra geç
            });
        }

        // 13. Talimatlar
        draw(data.instructions, 40, 400);

        // 18. Çekinceler (Sağ taraf)
        draw(data.reservations, 300, 400);

        // 23. İmza Yeri ve Tarih
        draw(data.signPlace + " - " + data.signDate, 40, 100);

        // Footer / Bilgi
        page.drawText("Bu belge dijital olarak oluşturulmuştur.", {
            x: 40, y: 20, size: 7, font, color: rgb(0.5, 0.5, 0.5)
        });

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=cmr.pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (e) {
        console.error(e);
        res.status(500).send("Hata");
    }
});

app.listen(PORT, () => console.log(`Uygulama hazır: http://localhost:${PORT}`));
