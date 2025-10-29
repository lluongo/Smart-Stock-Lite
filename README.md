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
   - Tres tipos de archivos:
     - `stock`: Stock por tienda
     - `participacion`: Porcentaje de venta por tienda
     - `prioridad`: Prioridad de distribución por producto
   - Validación en tiempo real
   - Previsualización de datos

4. **Distribución**
   - Tabla editable de productos
   - Sugerencias del sistema
   - Semáforos visuales de estado
   - Edición rápida de valores

5. **Distribución Inter-local** ⭐ NUEVO
   - Motor de optimización automática con reglas de negocio
   - Análisis de curvas completas/rotas por local
   - Detección de sobrestock y curvas faltantes
   - Redistribución inteligente según % de ventas
   - Visualización con semáforos (Verde/Amarillo/Rojo)
   - Estadísticas detalladas de movimientos
   - Exportación completa a formato XLS
   - Aplicación de reglas R1-R7

6. **Revisión y Exportación**
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

- **React 19** - Framework de UI
- **Vite** - Build tool y dev server
- **Tailwind CSS 4** - Framework de estilos
- **React Router** - Navegación
- **Recharts** - Gráficos
- **Lucide React** - Iconos
- **PapaParse** - Parser de CSV
- **SheetJS (xlsx)** - Exportación a Excel

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
│       ├── ejemplo_prioridad.csv
│       └── README.md
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
│   │   ├── Distribucion.jsx
│   │   ├── DistribucionInterlocal.jsx  ⭐ NUEVO
│   │   ├── Revision.jsx
│   │   └── Configuracion.jsx
│   ├── services/        # Lógica de negocio
│   │   ├── distributionEngine.js  ⭐ Motor de distribución
│   │   └── xlsExport.js           ⭐ Exportación XLS
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

### Flujo Básico
1. **Login** → Ingresar credenciales
2. **Dashboard** → Ver resumen y KPIs
3. **Cargar Datos** → Subir archivos CSV
4. **Distribución** → Revisar y ajustar sugerencias
5. **Revisión** → Confirmar y exportar

### Flujo Motor de Distribución Inter-local ⭐
1. **Login** → Ingresar credenciales
2. **Cargar Datos** → Subir 3 archivos: stock, participación, prioridad
3. **Distribución Inter-local** → El motor calcula automáticamente:
   - Análisis de curvas (completas/rotas)
   - Detección de sobrestock
   - Movimientos óptimos entre locales
   - Aplicación de reglas R1-R7
4. **Exportar** → Descargar dashboard completo en XLS con:
   - Movimientos propuestos
   - Análisis de curvas
   - Estadísticas detalladas

## Formato de Archivos

Los archivos de ejemplo están disponibles en `public/ejemplos/`

### Stock (stock.csv)
```csv
SKU,Talle,Color,Local Centro,Local Norte,Local Sur,Local Oeste
P001,S,Azul,5,2,0,8
P001,M,Azul,8,4,3,10
P001,L,Azul,6,5,2,7
P001,XL,Azul,3,1,0,5
```

### Participación (participacion.csv)
```csv
Local,% VTA
Local Centro,35
Local Norte,25
Local Sur,20
Local Oeste,20
```

### Prioridad (prioridad.csv)
```csv
SKU,Prioridad,Capacidad,Categoria
P001,Alta,100,Verano
P002,Alta,150,Verano
P003,Media,200,Continuo
```

## Motor de Distribución Inter-local

### Reglas de Negocio Implementadas

El motor aplica automáticamente 7 reglas de optimización:

- **R1**: Locales grandes solo mueven mercadería en caso de sobrestock
- **R2**: Sobrestock = más de 3 curvas completas o exceso de capacidad
- **R3**: Distribución proporcional según % de ventas del local
- **R4**: Prioridad máxima a completar curvas
- **R5**: Baja prioridad si un local no puede completar curva
- **R6**: Evitar movimientos que rompan curvas del donante
- **R7**: Análisis por categoría y criticidad

### Objetivos del Motor

1. **Optimizar disponibilidad** asegurando curvas completas
2. **Aumentar eficiencia** en movimientos logísticos
3. **Reducir sobrestock** y limpiar curvas rotas
4. **Priorizar ventas** y capacidad de cada local

### Salidas del Motor

El sistema genera un archivo XLS con múltiples hojas:

1. **Movimientos**: SKU, Talle, Color, Origen, Destino, Cantidad, Motivo, Prioridad, Estado
2. **Análisis de Curvas**: Estado de completitud por producto y local
3. **Estadísticas**: Métricas de eficiencia y distribución

## Funcionalidades Implementadas

- [x] Motor de Distribución Inter-local con reglas R1-R7
- [x] Análisis automático de curvas completas/rotas
- [x] Detección de sobrestock y redistribución inteligente
- [x] Exportación a formato XLS con múltiples hojas
- [x] Visualización con semáforos (Verde/Amarillo/Rojo)
- [x] Archivos CSV de ejemplo para testing
- [x] Estadísticas detalladas de movimientos

## Próximas Funcionalidades

- [ ] Autenticación real con backend
- [ ] Integración con API REST
- [ ] Persistencia de datos
- [ ] Notificaciones en tiempo real
- [ ] Panel de configuración completo
- [ ] Modo oscuro
- [ ] Reportes avanzados
- [ ] Integración con n8n para automatización

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

Desarrollado con React, Vite y Tailwind CSS
