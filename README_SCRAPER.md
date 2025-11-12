# 🏠 PropTech AI - Local Scraper

## ¿Por qué local?

Los sitios de inmuebles (MercadoLibre, ZonaProp, Properati) bloquean IPs de datacenters (AWS, Vercel, etc.). **El scraper funciona perfecto desde tu máquina local** porque usa IP residencial.

## 🚀 Uso Rápido

```bash
# Scrape 20 departamentos en venta en Capital Federal
node scripts/scrape-local.js properati --limit 20

# Scrape 50 casas en alquiler (con imágenes a R2)
node scripts/scrape-local.js properati --type casas_alquiler_caba --limit 50

# Scrape rápido sin descargar imágenes
node scripts/scrape-local.js properati --limit 30 --skip-images
```

## 📋 Tipos Disponibles

- `departamentos_venta_caba` - Departamentos en venta en Capital Federal (default)
- `casas_venta_caba` - Casas en venta en Capital Federal
- `departamentos_alquiler_caba` - Departamentos en alquiler en Capital Federal
- `casas_alquiler_caba` - Casas en alquiler en Capital Federal

## ⚙️ Configuración

### 1. Variables de Entorno (.env.local)

Asegúrate de tener estas variables configuradas:

```env
# Database (REQUERIDO)
DATABASE_URL=postgresql://...

# R2 Storage (OPCIONAL - para imágenes)
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
R2_BUCKET_NAME=property-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# ImageKit CDN (OPCIONAL - para optimización)
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
```

### 2. Instalar Dependencias

```bash
npm install
```

## 🎯 Características

✅ **Scraping desde IP residencial** (tu máquina local)
✅ **Descarga y sube imágenes a R2** (Cloudflare)
✅ **Integración con ImageKit** para optimización
✅ **UPSERT automático** (evita duplicados)
✅ **Rate limiting** (300ms entre requests)
✅ **Logging detallado** con emojis
✅ **Manejo de errores robusto**
✅ **Skip images** para testing rápido

## 📊 Output

```
🏠 PropTech AI - Local Scraper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Source: Properati Argentina
🏷️  Type: departamentos_venta_caba
📊 Limit: 20
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Fetching: https://www.properati.com.ar/s/capital-federal/departamento/venta
✅ Found 38 listings, processing 20

  📷 Uploading image...
  ✅ [1/20] Inserted: Departamento En Venta En Capital Federal - Palermo
  📷 Uploading image...
  ✅ [2/20] Inserted: Hermoso Departamento 2 Ambientes Con Balcón
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Inserted: 18
🔄 Updated:  2
❌ Errors:   0
⏱️  Duration: 12.34s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔄 Automatización (Opcional)

### Opción 1: CRON Local (macOS/Linux)

```bash
# Editar crontab
crontab -e

# Agregar job (cada 6 horas)
0 */6 * * * cd /path/to/real-estate && node scripts/scrape-local.js properati --limit 50 >> logs/scraper.log 2>&1
```

### Opción 2: LaunchAgent (macOS)

Crear `~/Library/LaunchAgents/com.proptech.scraper.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.proptech.scraper</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/real-estate/scripts/scrape-local.js</string>
        <string>properati</string>
        <string>--limit</string>
        <string>50</string>
    </array>
    <key>StartInterval</key>
    <integer>21600</integer>  <!-- 6 hours -->
    <key>StandardOutPath</key>
    <string>/path/to/real-estate/logs/scraper.log</string>
    <key>StandardErrorPath</key>
    <string>/path/to/real-estate/logs/scraper-error.log</string>
</dict>
</plist>
```

Luego:
```bash
launchctl load ~/Library/LaunchAgents/com.proptech.scraper.plist
```

## 🐛 Troubleshooting

### "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### "Database connection failed"
Verifica que `DATABASE_URL` esté en `.env.local` y sea accesible desde tu máquina.

### "R2 upload failed"
Es opcional. Si no tienes R2 configurado, las imágenes usarán las URLs originales.

### "403 Forbidden"
Properati podría estar bloqueando temporalmente. Espera unos minutos y reintenta.

## 📈 Próximos Pasos

1. Corre el scraper: `node scripts/scrape-local.js properati --limit 20`
2. Verifica los datos en: https://prop-tech-ai.vercel.app
3. Configura CRON para actualizaciones automáticas (opcional)
4. Expande a más tipos de propiedades
5. Agrega más fuentes (ZonaProp, Argenprop via local scraping)

## 💡 Tips

- **Primera vez:** Usa `--limit 10` para probar
- **Testing:** Usa `--skip-images` para ir más rápido
- **Producción:** Scrape 50-100 propiedades cada 6 horas
- **Multiple tipos:** Corre el script varias veces con diferentes `--type`

## 🎯 Roadmap

- [ ] Agregar más ciudades (Córdoba, Rosario, Mendoza)
- [ ] Scraper para ZonaProp (HTML parsing)
- [ ] Scraper para Argenprop (HTML parsing)
- [ ] Detección automática de duplicados cross-source
- [ ] Geocoding automático con Nominatim
- [ ] Generación de descripciones con IA

---

**¿Preguntas?** Revisa los logs en la consola o abre un issue en GitHub.
