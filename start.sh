#!/bin/bash

# Script de Inicio Rápido para Real Estate Scraper
# Este script ejecuta todo en el orden correcto

echo "╔════════════════════════════════════════════════════════╗"
echo "║     SISTEMA DE SCRAPING INMOBILIARIO - ARGENTINA      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Función para mostrar el menú
show_menu() {
    echo "¿Qué quieres hacer?"
    echo ""
    echo "  1) 🚀 Primera configuración (si es tu primera vez)"
    echo "  2) 🔐 Configurar MercadoLibre OAuth"
    echo "  3) 🏠 Scraping de propiedades"
    echo "  4) ⚙️  Procesar propiedades pendientes"
    echo "  5) 📊 Ver monitor en tiempo real"
    echo "  6) 🗄️  Consultar base de datos"
    echo "  7) 🧹 Limpiar datos antiguos"
    echo "  8) 🐳 Iniciar/Detener PostgreSQL"
    echo "  9) ❌ Salir"
    echo ""
}

# Función para primera configuración
first_setup() {
    echo "🚀 Iniciando primera configuración..."
    echo ""

    # Instalar dependencias
    echo "📦 Instalando dependencias..."
    npm install

    # Crear .env si no existe
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "✅ Archivo .env creado"
    fi

    # Iniciar PostgreSQL
    echo "🐘 Iniciando PostgreSQL..."
    docker-compose up -d postgres
    sleep 5

    # Ejecutar migraciones
    echo "🗄️ Configurando base de datos..."
    node database/migrate.js

    echo ""
    echo "✅ Configuración inicial completa!"
    echo ""
    echo "Ahora necesitas:"
    echo "1. Editar .env con tus credenciales de MercadoLibre"
    echo "2. Ejecutar opción 2 para configurar OAuth"
    echo ""
    read -p "Presiona Enter para continuar..."
}

# Función para configurar OAuth
setup_oauth() {
    echo "🔐 Configurando MercadoLibre OAuth..."
    echo ""
    echo "Se abrirá tu navegador para autenticarte."
    echo "Después de autenticarte, los tokens se guardarán automáticamente."
    echo ""
    read -p "Presiona Enter para continuar..."
    node src/auth/mercadolibre-auth.js
}

# Función para scraping
run_scraping() {
    echo "🏠 Opciones de Scraping"
    echo ""
    echo "  1) Prueba rápida (10 propiedades)"
    echo "  2) Scraping normal (100 propiedades)"
    echo "  3) Scraping completo (sin límite)"
    echo "  4) Scraping con filtros personalizados"
    echo ""
    read -p "Selecciona una opción: " scrape_option

    case $scrape_option in
        1)
            echo "Ejecutando prueba rápida..."
            node src/jobs/manual/scrape-mercadolibre.js --limit 10
            ;;
        2)
            echo "Ejecutando scraping normal..."
            node src/jobs/manual/scrape-mercadolibre.js --limit 100
            ;;
        3)
            echo "⚠️  Esto puede tardar mucho tiempo y consumir tu límite de API"
            read -p "¿Estás seguro? (s/n): " confirm
            if [ "$confirm" = "s" ]; then
                node src/jobs/manual/scrape-mercadolibre.js
            fi
            ;;
        4)
            echo "Configuración personalizada:"
            read -p "Límite de propiedades: " limit
            read -p "Tipo (apartment/house/land): " type
            read -p "Operación (sale/rent): " operation
            read -p "Precio mínimo USD: " min_price
            read -p "Precio máximo USD: " max_price

            cmd="node src/jobs/manual/scrape-mercadolibre.js"
            [ ! -z "$limit" ] && cmd="$cmd --limit $limit"
            [ ! -z "$type" ] && cmd="$cmd --property-type $type"
            [ ! -z "$operation" ] && cmd="$cmd --operation $operation"
            [ ! -z "$min_price" ] && cmd="$cmd --min-price $min_price"
            [ ! -z "$max_price" ] && cmd="$cmd --max-price $max_price"

            echo "Ejecutando: $cmd"
            eval $cmd
            ;;
        *)
            echo "Opción inválida"
            ;;
    esac

    echo ""
    read -p "Presiona Enter para continuar..."
}

# Función para procesar propiedades
process_properties() {
    echo "⚙️ Procesando propiedades pendientes..."
    echo ""
    node src/pipeline/processor.js
    echo ""
    read -p "Presiona Enter para continuar..."
}

# Función para monitor
run_monitor() {
    echo "📊 Iniciando monitor en tiempo real..."
    echo "Presiona Ctrl+C para salir del monitor"
    echo ""
    sleep 2
    node monitor.js
}

# Función para consultar base de datos
query_database() {
    echo "🗄️ Consultas rápidas a la base de datos"
    echo ""
    echo "  1) Contar propiedades totales"
    echo "  2) Ver últimas 10 propiedades"
    echo "  3) Estadísticas por tipo de propiedad"
    echo "  4) Propiedades por ciudad"
    echo "  5) Conectar a psql (consola SQL)"
    echo ""
    read -p "Selecciona una opción: " query_option

    DB_URL="postgresql://postgres:postgres@localhost:5432/real_estate_cordoba"

    case $query_option in
        1)
            psql $DB_URL -c "SELECT COUNT(*) as total_propiedades FROM properties;"
            ;;
        2)
            psql $DB_URL -c "SELECT title, price, currency, city, created_at FROM properties ORDER BY created_at DESC LIMIT 10;"
            ;;
        3)
            psql $DB_URL -c "SELECT property_type, operation_type, COUNT(*) as cantidad, ROUND(AVG(price_usd)) as precio_promedio_usd FROM properties GROUP BY property_type, operation_type ORDER BY cantidad DESC;"
            ;;
        4)
            psql $DB_URL -c "SELECT city, COUNT(*) as cantidad FROM properties WHERE city IS NOT NULL GROUP BY city ORDER BY cantidad DESC LIMIT 20;"
            ;;
        5)
            echo "Conectando a PostgreSQL..."
            echo "Escribe \\q para salir"
            psql $DB_URL
            ;;
        *)
            echo "Opción inválida"
            ;;
    esac

    echo ""
    read -p "Presiona Enter para continuar..."
}

# Función para limpiar datos
cleanup_data() {
    echo "🧹 Limpieza de datos"
    echo ""
    echo "  1) Limpiar listings procesados hace más de 30 días"
    echo "  2) Limpiar listings con errores"
    echo "  3) Detectar y marcar propiedades inactivas"
    echo "  4) Ejecutar deduplicación"
    echo ""
    read -p "Selecciona una opción: " cleanup_option

    DB_URL="postgresql://postgres:postgres@localhost:5432/real_estate_cordoba"

    case $cleanup_option in
        1)
            echo "Limpiando listings antiguos..."
            psql $DB_URL -c "SELECT * FROM cleanup_old_data(30);"
            ;;
        2)
            echo "Limpiando listings con errores..."
            psql $DB_URL -c "DELETE FROM raw_listings WHERE processing_status = 'error' AND processing_attempts > 3;"
            ;;
        3)
            echo "Detectando propiedades inactivas..."
            psql $DB_URL -c "SELECT detect_inactive_properties();"
            ;;
        4)
            echo "Ejecutando deduplicación..."
            psql $DB_URL -c "SELECT create_duplicate_clusters();"
            ;;
        *)
            echo "Opción inválida"
            ;;
    esac

    echo ""
    read -p "Presiona Enter para continuar..."
}

# Función para gestionar PostgreSQL
manage_postgres() {
    echo "🐳 Gestión de PostgreSQL"
    echo ""
    echo "  1) Iniciar PostgreSQL"
    echo "  2) Detener PostgreSQL"
    echo "  3) Reiniciar PostgreSQL"
    echo "  4) Ver logs de PostgreSQL"
    echo "  5) Ver estado"
    echo ""
    read -p "Selecciona una opción: " pg_option

    case $pg_option in
        1)
            docker-compose up -d postgres
            echo "✅ PostgreSQL iniciado"
            ;;
        2)
            docker-compose stop postgres
            echo "✅ PostgreSQL detenido"
            ;;
        3)
            docker-compose restart postgres
            echo "✅ PostgreSQL reiniciado"
            ;;
        4)
            docker-compose logs -f postgres
            ;;
        5)
            docker ps | grep postgres
            ;;
        *)
            echo "Opción inválida"
            ;;
    esac

    echo ""
    read -p "Presiona Enter para continuar..."
}

# Loop principal
while true; do
    clear
    show_menu
    read -p "Selecciona una opción (1-9): " choice

    case $choice in
        1)
            first_setup
            ;;
        2)
            setup_oauth
            ;;
        3)
            run_scraping
            ;;
        4)
            process_properties
            ;;
        5)
            run_monitor
            ;;
        6)
            query_database
            ;;
        7)
            cleanup_data
            ;;
        8)
            manage_postgres
            ;;
        9)
            echo "👋 ¡Hasta luego!"
            exit 0
            ;;
        *)
            echo "Opción inválida. Por favor selecciona 1-9."
            sleep 2
            ;;
    esac
done