# Powerbank kudeatzailea

Gida honek proiektua beste ordenagailu batean klonatu, dependentziak instalatu
eta hiru atalak martxan jartzeko pausoak azaltzen ditu.

## Aurrebaldintzak

Instalatu ordenagailuan:

- Git.
- PostgreSQL zerbitzaria.
- Python 3.14 edo berriagoa.
- `uv` Python pakete-kudeatzailea.
- Node.js eta npm (Angular 22rekin bateragarriak).

`uv` instalatzeko Python erabil dezakezu:

```powershell
py -m pip install uv
```

## Proiektua eskuratzea

PowerShell terminal batean:

```powershell
git clone https://github.com/umendibe/powerbank_kudeatzailea.git
Set-Location powerbank_kudeatzailea\ERRONKA1
```

Ondorengo komandoak `ERRONKA1` karpetatik exekutatzekoak dira.

## Datu-basea prestatzea

Backendak PostgreSQL erabiltzen du. Konexio lehenetsia
`backend/database/database.py` fitxategian dago:

```text
postgresql://postgres:postgres@localhost:5432/powerbank_erreserba
```

Sortu `powerbank_erreserba` izeneko datu-basea, edo aldatu fitxategi horretako
konexio-helbidea zure PostgreSQL erabiltzaile, pasahitz eta zerbitzariaren
arabera. PostgreSQLren `psql` erabilgarri badago:

```powershell
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE powerbank_erreserba;"
```

Backenda abiaraztean, SQLAlchemyk ereduen araberako taulak eta PostgreSQL enum
motak sortzen ditu falta badira. Eragiketa horrek **ez du daturik edo
erabiltzaile lehenetsirik** sortzen. Datu-base hutsean saio-hasiera eta
erreserbak erabiltzeko, beharrezko hasierako datuak (adibidez, rolak eta
administratzaile-kontua) aparte sortu behar dira.

Taulak automatikoki sortzeak ez ditu lehendik dauden taulak eguneratzen edo
migratzen. Eskema zahar bat baduzu, dagokion migrazioa berrikusi eta beharrezkoa
bada exekutatu; `backend/migrations/001_multiudalerria.py` ez da datu-base huts
bat sortzeko migrazioa.

## Backenda abiaraztea

Ireki terminal bat eta exekutatu:

```powershell
Set-Location .\backend
uv sync
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

APIaren dokumentazioa hemen egongo da: <http://127.0.0.1:8000/docs>.

## Administrazio-atala abiaraztea

Ireki bigarren terminal bat:

```powershell
Set-Location .\administrazio_atala
npm ci
npm start
```

Ireki <http://localhost:4200>.

Administrazio-atalak `src/app/api-config.ts` fitxategian `/api/alokaziosistema`
helbidea erabiltzen du, eta `/api/` eskaerak backendera bidaltzen dituen proxy
bat behar du. Biltegiak ez du garapeneko proxy-konfiguraziorik. Tokiko
garapenean, proxy hori konfiguratu edo `API_BASE` aldi baterako
`http://127.0.0.1:8000/alokaziosistema` helbidera aldatu behar da.

## Atal publikoa abiaraztea

Ireki hirugarren terminal bat. HTML fitxategiak HTTP zerbitzari batekin zerbitzatu
behar dira; ez ireki `index.html` fitxategia zuzenean `file://` bidez.

```powershell
Set-Location .\atal_publikoa
```

VSCode-ko LiveServer extensioarekin ireki .html fitxategiak.

## Laburpena

Erabiltzeko, PostgreSQL zerbitzaria eta datu-baseko eskema prestatu, backenda
8000 portuan abiarazi, eta nahi den interfazea martxan jarri. Administrazio-atala
4200 portuan eta atal publikoa 5500 portuan erabil daitezke.

## Datu basean rolen INSERT-a

```sql
INSERT INTO rolak(id_rol, rol_izena) VALUES 
(1, 'Admin'),
(2, 'Erabiltzaile'),
(3, 'Udalerria')
```