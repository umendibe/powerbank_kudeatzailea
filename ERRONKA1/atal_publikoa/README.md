# Atal publikoa

Powerbank alokazioaren atal publikoa HTML, Bootstrap 5.3 eta JavaScript hutsarekin
eraikita dago. Ez du konpilazio-pausarik behar: fitxategiak zuzenean zerbitzatzen
dira.

## Funtzioak

- Kargaguneen zerrenda, xehetasunak, irudiak eta karga-postuen erabilgarritasuna
  saioa hasi gabe kontsultatzeko.
- Erabiltzailearen erregistroa, saio-hasiera, saio-itxiera eta datuen kontsulta
  zein aldaketa.
- Erreserbak egitea: kargagunea, karga-postua, eguna eta hasiera-/amaiera-orduak
  aukeratu eta berretsi.
- Norberaren erreserben historikoa kontsultatzea eta etorkizuneko erreserbak
  ezeztatzea.

## Fitxategiak

- `index.html`: kargaguneen zerrenda publikoa eta xehetasunen modala.
- `login.html` / `erregistroa.html`: saio-hasiera eta erregistroa.
- `nire-kontua.html`: norberaren datuak eta erreserben historikoa.
- `erreserbak.html`: erreserba berria sortzea eta norberaren erreserbak.
- `js/common.js`: API deien, saioaren, nabigazioaren eta formatuen laguntzaileak.
- `js/erreserbak-common.js`: erreserben zerrendaren errendatzea eta ezeztatzea.
- `css/estiloak.css`: atal publikoaren estilo osagarriak.

## Martxan jartzeko

1. Abiarazi backend-a:

   ```powershell
   cd ERRONKA1/backend
   .\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

2. Zerbitzatu `atal_publikoa` karpeta HTTP bidez (adb. VS Code Live Server
   edo `python -m http.server 5500`). Ez ireki `index.html` zuzenean
   `file://` bidez, CORS-ek API deia blokea dezakeelako.

3. Ireki `http://127.0.0.1:5500/index.html`.

APIaren helbidea `js/common.js` fitxategiko `API_BASE` konstantean dago
(`http://127.0.0.1:8000/alokaziosistema`).
