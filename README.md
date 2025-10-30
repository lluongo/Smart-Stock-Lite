# SmartStock Lite

Una aplicación web moderna y profesional para la gestión inteligente de inventario. Diseñada con un enfoque mobile-first, interfaz minimalista y UX simplificada.

## Características

### Pantallas Principales

1. **Login**
   - Autenticación de usuario
   - Diseño moderno con logo y branding
   - Validación de formularios

2. **Dashboard**
   - Vista general del inventario
   - KPIs principales (Rotación, Cobertura, Productos en riesgo)
   - Gráficos de tendencias
   - Acciones recomendadas (Reordenar, Transferir, Liquidar)

3. **Cargar Datos**
   - Subida de archivos CSV/Excel
   - Tres tipos de archivos (TODOS OBLIGATORIOS):
     - `stock`: Inventario por depósito con columnas específicas
     - `participacion`: Porcentaje de participación por sucursal (debe sumar 100%)
     - `prioridad`: Orden de distribución por tipología (define qué productos se distribuyen primero)
   - Validación estricta en tiempo real
   - Previsualización de datos con paginación
   - Detección automática de archivos incorrectos

4. **Distribución** ⭐ REDISEÑADO v2.0
   - Motor de distribución automática con **Algoritmo de Hamilton + 12 Reglas de Negocio**
   - Cálculo automático al cargar los 3 archivos
   - **3 tabs de resultados:**
     - **Distribución Final**: Transferencias individuales (1 origen → 1 destino)
     - **Resumen Sucursales**: Totales y desviaciones por local
     - **✨ Análisis por Local (NUEVO)**: Curvas completas, sobrestock, acciones sugeridas
   - Validación de Check Sum (100% distribución)
   - Estadísticas en tiempo real
   - Exportación a Excel con **5 hojas** (incluye "Análisis por Local")

5. **Revisión y Exportación**
   - Resumen de movimientos
   - Indicadores de totales
   - Exportación a CSV y XLS
   - Opciones de ajuste

### Navegación

- Menú lateral responsive con iconos
- Soporte mobile con menú hamburguesa
- Información de usuario
- Botón de cerrar sesión

## Tecnologías Utilizadas

- **React 19.1.1** - Framework de UI
- **Vite 7.1.12** - Build tool y dev server
- **Tailwind CSS 4** - Framework de estilos
- **React Router** - Navegación
- **Recharts** - Gráficos
- **Lucide React** - Iconos
- **PapaParse 5.5.3** - Parser de CSV
- **SheetJS (xlsx)** - Exportación a Excel con múltiples hojas

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/lluongo/Smart-Stock-Lite.git
cd Smart-Stock-Lite
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

4. Abrir en el navegador:
```
http://localhost:5173
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter

## Estructura del Proyecto

```
Smart-Stock-Lite/
├── public/
│   └── ejemplos/        # Archivos CSV de ejemplo
│       ├── ejemplo_stock.csv
│       ├── ejemplo_participacion.csv
│       └── ejemplo_prioridad.csv
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── Layout.jsx
│   │   └── Sidebar.jsx
│   ├── contexts/        # Context API
│   │   └── AppContext.jsx
│   ├── pages/           # Páginas de la aplicación
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CargarDatos.jsx
│   │   ├── Distribucion.jsx      ⭐ Motor Hamilton + R1-R8
│   │   ├── Revision.jsx
│   │   └── Configuracion.jsx
│   ├── services/        # Lógica de negocio
│   │   ├── distributionService.js  ⭐ Algoritmo Hamilton + R1-R8
│   │   └── fileValidation.js       ⭐ Validación estricta
│   ├── App.jsx          # Componente principal y rutas
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Diseño

### Colores

- **Primario (Verde)**: `#22c55e` - Acciones positivas y principales
- **Secundario (Celeste)**: `#0ea5e9` - Acciones secundarias
- **Amarillo**: `#eab308` - Advertencias
- **Rojo**: `#ef4444` - Alertas y acciones críticas
- **Gris**: Texto y fondos neutrales

### Tipografía

- Familia: System UI (native font stack)
- Tamaños: Escala modular para jerarquía clara
- Peso: Regular (400), Medium (500), Bold (700)

### Componentes

- Bordes redondeados suaves (`rounded-lg`, `rounded-xl`)
- Sombras sutiles (`shadow-sm`, `shadow-md`)
- Animaciones de transición suaves
- Espaciado consistente

## Flujo de Usuario

### Flujo de Distribución Automática ⭐

1. **Login** → Ingresar credenciales
2. **Cargar Datos** → Subir 3 archivos OBLIGATORIOS:
   - **Stock**: Inventario por depósito
   - **Participación**: Porcentaje por sucursal (debe sumar 100%)
   - **Prioridad**: Orden de distribución por tipología
3. **Distribución** → El motor calcula automáticamente:
   - Ordena productos por prioridad (menor número = primero)
   - Aplica Algoritmo de Hamilton con triple desempate
   - Ejecuta reglas R1-R8 secuencialmente
   - Genera 4 hojas de resultados
   - Valida check sum al 100%
4. **Exportar** → Descargar Excel completo con:
   - Distribución final detallada
   - Transferencias propuestas
   - Resumen por sucursal
   - Log de trazabilidad completo

## Formato de Archivos

Los archivos de ejemplo están disponibles en `public/ejemplos/`

### 1. Stock (stock.csv) - OBLIGATORIO

Inventario por depósito con 9 columnas requeridas:

```csv
Coddep,Deposito,Color,NombreColor,Medida,Cantidad,TIPOLOGIA,ORIGEN,TEMPORADA
001,Depósito Central,AZ,Azul,M,15,Remera,Nacional,Verano
001,Depósito Central,AZ,Azul,L,20,Remera,Nacional,Verano
002,Depósito Norte,RJ,Rojo,S,10,Pantalon,Importado,Continuo
```

**Columnas requeridas:**
- `Coddep`: Código de depósito
- `Deposito`: Nombre del depósito
- `Color`: Código de color
- `NombreColor`: Nombre descriptivo del color
- `Medida`: Talle/medida (S, M, L, XL, 38, 40, etc.)
- `Cantidad`: Unidades disponibles (entero)
- `TIPOLOGIA`: Tipo de producto (Remera, Pantalon, Buzo, etc.)
- `ORIGEN`: Origen del producto (Nacional, Importado, etc.)
- `TEMPORADA`: Temporada (Verano, Invierno, Continuo, etc.)

**Nota:** El SKU se genera automáticamente como: `TIPOLOGIA_Color_Medida`

### 2. Participación (participacion.csv) - OBLIGATORIO

Porcentaje de participación por sucursal. **DEBE SUMAR EXACTAMENTE 100%** (tolerancia ±0.5%)

```csv
sucursal,participacion
Sucursal_001,35.5
Sucursal_002,25.0
Sucursal_003,20.0
Sucursal_004,19.5
```

**Columnas requeridas:**
- `sucursal`: Nombre o código de sucursal
- `participacion`: Porcentaje de participación (puede ser decimal 0.35 o porcentaje 35)

**Validaciones:**
- ✅ Acepta: valores entre 99.5% y 100.5%
- ❌ Rechaza: valores fuera del rango (ej: 95%, 105%, 109%)
- El sistema detecta automáticamente formato decimal vs porcentaje

### 3. Prioridad (prioridad.csv) - OBLIGATORIO

Orden en que se distribuyen las tipologías. **Menor número = mayor prioridad**

```csv
prioridad,tipologia
1,Remera
2,Pantalon
3,Buzo
4,Campera
5,Short
```

**Columnas requeridas:**
- `prioridad`: Número entero (1 = máxima prioridad, 2 = segunda, etc.)
- `tipologia`: Tipo de producto (debe coincidir con TIPOLOGIA del archivo Stock)

**Comportamiento:**
- Los productos se procesan en orden de prioridad (1 primero, 2 después, etc.)
- Tipologías sin prioridad asignada se procesan al final (prioridad 999)
- Si dos tipologías tienen la misma prioridad, se ordenan alfabéticamente

## Motor de Distribución Automática

### Algoritmo de Hamilton (Mayor Resto)

Distribuye unidades enteras según porcentajes sin dejar residuo.

**Proceso:**
1. Calcula cuotas exactas: `cantidad × (participación / 100)`
2. Asigna partes enteras a cada sucursal
3. Calcula unidades faltantes
4. Distribuye faltantes con triple desempate:
   - **1º** Mayor residuo decimal
   - **2º** Mayor participación
   - **3º** Orden alfabético por sucursal

**Ejemplo:**
- Producto: 10 unidades
- Participaciones: Suc_A=35%, Suc_B=32%, Suc_C=33%
- Cuotas exactas: A=3.5, B=3.2, C=3.3
- Partes enteras: A=3, B=3, C=3 (total 9)
- Faltante: 1 unidad
- Residuos: A=0.5, B=0.2, C=0.3
- **Resultado: A=4, B=3, C=3** (A tiene mayor residuo)

### Reglas de Negocio (12 Reglas Implementadas)

El motor aplica secuencialmente **12 reglas** organizadas en 3 grupos:

#### 📍 CROSS (Reglas 1-3)
- **CROSS-R1:** Distribución base según % UTA (Hamilton)
- **CROSS-R2:** Validar curvas completas (umbral 70%)
- **CROSS-R3:** Sobrantes al local con mayor participación

#### 🏪 INTERLOCAL (Reglas 4-9)
- **INTERLOCAL-R4:** Restricción locales grandes (>8% UTA)
- **INTERLOCAL-R5:** Prioridad completar curva (productos críticos primero)
- **INTERLOCAL-R6:** Optimizar movimientos (unificar transferencias)
- **INTERLOCAL-R7:** Limpiar curvas rotas (umbral 50%)
- **INTERLOCAL-R8:** Analizar categoría + prioridad (trazabilidad)
- **INTERLOCAL-R9:** Acumular UTA (validación 100%)

#### 🛒 COMERCIAL (Reglas 10-12) ⭐ NUEVO
- **COMERCIAL-R10:** Garantizar ≥1 curva completa por SKU
- **COMERCIAL-R11:** Eliminar microasignaciones <3 unidades
- **COMERCIAL-R12:** Reasignar si top UTA completo (balanceo)

**📚 Ver documentación completa:** [REGLAS_DE_NEGOCIO.md](./REGLAS_DE_NEGOCIO.md)

### Salidas del Motor

El sistema genera un archivo Excel (.xlsx) con **5 hojas:**

#### 1. Distribución Final
```
SKU | TIPOLOGIA | Color | Medida | Depósitos Origen | Sucursal Destino | Unidades | Cuota | Residuo | Regla
```

#### 2. Transferencias
```
SKU | Talle | Color | Origen | Destino | Unidades | Motivo | Regla | Prioridad | Temporada
```

#### 3. Resumen Sucursales
```
Sucursal | Total Unidades | % Esperado | % Real | Desviación | Local Grande
```

#### 4. ✨ Análisis por Local (NUEVO)
```
Local | % UTA | Stock Actual | Curvas Completas | Curvas Incompletas | Sobrestock | Acción Sugerida | Local Grande
```

**Acciones Sugeridas Automáticas:**
- ✅ **Óptimo:** Mantener distribución (curvas completas balanceadas)
- ⚡ **Completar curvas:** Enviar talles faltantes
- ⚠️ **Sobrestock:** Redistribuir excedentes (≥3 curvas completas)
- 📦 **Vacío:** Requiere asignación inicial

#### 5. Log de Trazabilidad
```
Timestamp | Regla | Mensaje | Datos
```

### Validaciones y Check Sum

El sistema valida que:
- ✅ Todos los archivos tengan el formato correcto
- ✅ Participación sume 100% (±0.5%)
- ✅ Prioridad contenga todas las tipologías necesarias
- ✅ Total distribuido = Total original (check sum 100%)

**Indicador de Check Sum:**
- 🟢 Verde: 100% (perfecto)
- 🟡 Amarillo: 99-101% (aceptable)
- 🔴 Rojo: <99% o >101% (error)

## Funcionalidades Implementadas

- [x] Motor de Distribución Automática con Algoritmo Hamilton
- [x] Implementación completa de **12 reglas de negocio** (CROSS + INTERLOCAL + COMERCIAL)
- [x] **Modelo de 3 Niveles:** Matemático, Comercial, Logístico
- [x] **Análisis por Local:** Curvas asignadas, sobrestock, acciones sugeridas
- [x] **Transferencias Inteligentes:** Evita enviar y recibir del mismo local
- [x] Validación estricta de archivos CSV (formato, columnas, sumas)
- [x] Orden de distribución por prioridad
- [x] Check sum al 100%
- [x] Exportación a Excel con **5 hojas**
- [x] Trazabilidad completa de operaciones
- [x] Interfaz unificada de distribución con **3 tabs**
- [x] Archivos de ejemplo actualizados
- [x] Previsualización con paginación para archivos grandes
- [x] **Documentación completa de 50+ páginas** ([REGLAS_DE_NEGOCIO.md](./REGLAS_DE_NEGOCIO.md))

## Cambios Recientes (v2.0)

### ✅ Modelo de 3 Niveles Implementado (NUEVO 2025-10-30)
- **12 Reglas de Negocio:** CROSS (R1-R3) + INTERLOCAL (R4-R9) + COMERCIAL (R10-R12)
- **Nuevo Tab "Análisis por Local":** Métricas de curvas, sobrestock, acciones sugeridas
- **Transferencias Inteligentes:** Evita que un local envíe y reciba simultáneamente
- **Documentación Completa:** Ver [REGLAS_DE_NEGOCIO.md](./REGLAS_DE_NEGOCIO.md) (50+ páginas)

### ✅ Nuevas Reglas Comerciales (R10-R12)
- **COMERCIAL-R10:** Garantizar ≥1 curva completa por SKU
- **COMERCIAL-R11:** Eliminar microasignaciones <3 unidades
- **COMERCIAL-R12:** Reasignar si top UTA tiene curva completa con excedente

### ✅ Eliminación de Duplicados
- Removida opción "Distribución Inter-local" del menú
- Unificada en una sola función "Distribución"

### ✅ Validación Estricta
- Participación debe sumar 100% (tolerancia ±0.5%)
- Archivo rechazado si no cumple
- Mensaje claro con suma actual y diferencia

### ✅ Prioridad Obligatoria
- Archivo de prioridad ahora es OBLIGATORIO
- Columna cambiada: `producto` → `tipologia`
- Define orden de distribución (menor número = primero)

### ✅ Mejoras en UX
- Descripciones actualizadas en todos los archivos
- Instrucciones claras sobre formatos requeridos
- Ejemplos mejorados con casos reales
- Validaciones en tiempo real
- Nueva tabla "Análisis por Local" con métricas comerciales

## Próximas Funcionalidades

- [ ] Autenticación real con backend
- [ ] Integración con API REST
- [ ] Persistencia de datos
- [ ] Notificaciones en tiempo real
- [ ] Panel de configuración avanzado
- [ ] Modo oscuro
- [ ] Reportes avanzados y analytics
- [ ] Integración con n8n para automatización
- [ ] Simulación de escenarios "What-if"
- [ ] Historial de distribuciones

## Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Autor

**SmartStock Lite** - Gestión inteligente de inventario

---

Desarrollado con React 19, Vite 7 y Tailwind CSS 4
