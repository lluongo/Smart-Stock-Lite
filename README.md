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

5. **Revisión y Exportación**
   - Resumen de movimientos
   - Indicadores de totales
   - Exportación a CSV
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
├── public/              # Archivos estáticos
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
│   │   ├── Revision.jsx
│   │   └── Configuracion.jsx
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

1. **Login** → Ingresar credenciales
2. **Dashboard** → Ver resumen y KPIs
3. **Cargar Datos** → Subir archivos CSV
4. **Distribución** → Revisar y ajustar sugerencias
5. **Revisión** → Confirmar y exportar

## Formato de Archivos

### Stock (stock.csv)
```csv
producto,tienda1,tienda2,tienda3
Producto A,150,200,180
Producto B,320,280,300
```

### Participación (participacion.csv)
```csv
tienda,porcentaje
tienda1,35
tienda2,40
tienda3,25
```

### Prioridad (prioridad.csv)
```csv
producto,prioridad
Producto A,1
Producto B,2
Producto C,3
```

## Próximas Funcionalidades

- [ ] Autenticación real con backend
- [ ] Integración con API REST
- [ ] Persistencia de datos
- [ ] Notificaciones en tiempo real
- [ ] Exportación a múltiples formatos
- [ ] Panel de configuración completo
- [ ] Modo oscuro
- [ ] Reportes avanzados

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
