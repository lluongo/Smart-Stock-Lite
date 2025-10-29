# Archivos de Ejemplo para SmartStock Lite

Esta carpeta contiene archivos CSV de ejemplo que puedes usar para probar el Motor de Distribución Inter-local.

## Archivos Incluidos

### 1. `ejemplo_stock.csv`
Contiene datos de inventario por producto, talle, color y local.

**Estructura:**
- SKU: Identificador del producto
- Talle: S, M, L, XL
- Color: Color del producto
- Local Centro, Local Norte, Local Sur, Local Oeste: Cantidad en cada local

### 2. `ejemplo_participacion.csv`
Define el porcentaje de participación en ventas de cada local.

**Estructura:**
- Local: Nombre del local
- % VTA: Porcentaje de participación en ventas totales

### 3. `ejemplo_prioridad.csv`
Establece la prioridad y capacidad de cada producto.

**Estructura:**
- SKU: Identificador del producto
- Prioridad: Alta, Media, Baja
- Capacidad: Capacidad máxima recomendada
- Categoria: Clasificación del producto

## Cómo Usar

1. Ve a la sección **Cargar Datos** en la aplicación
2. Arrastra o selecciona cada archivo en su sección correspondiente:
   - `ejemplo_stock.csv` → Stock
   - `ejemplo_participacion.csv` → Participación
   - `ejemplo_prioridad.csv` → Prioridad
3. Espera a que se validen los archivos
4. Haz clic en **Confirmar Carga**
5. Ve a **Distribución Inter-local** para ver los resultados del motor

## Escenarios de Prueba

Los datos de ejemplo incluyen varios escenarios interesantes:

- **Curvas rotas**: P001 y P002 tienen talles faltantes en algunos locales
- **Sobrestock**: P003 tiene exceso en Local Centro
- **Stock bajo**: P005 tiene muy poco stock en Local Centro
- **Distribución desigual**: P006 tiene más stock en Local Oeste

El motor aplicará automáticamente las reglas de negocio R1-R7 para optimizar la distribución.
