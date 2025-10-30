# 📚 Documentación Completa: Reglas de Negocio - Distribución Inteligente de SKUs

**Versión:** 2.0
**Fecha:** 2025-10-30
**Sistema:** Smart Stock Lite - Distribución Inter-Local
**Algoritmo Base:** Hamilton (Mayor Resto) + 12 Reglas de Negocio

---

## 🎯 Objetivo del Sistema

Distribuir automáticamente el stock disponible entre sucursales aplicando un **Modelo de 3 Niveles** que garantiza:

1. **Precisión Matemática:** 100% del stock distribuido sin pérdidas
2. **Sentido Comercial:** Curvas completas, capacidad real, sin fragmentación
3. **Eficiencia Logística:** Mínimos movimientos, optimización de transferencias

---

## 📊 Modelo de 3 Niveles

### Nivel 1: Matemático
**Objetivo:** Garantizar precisión numérica absoluta

- Algoritmo de Hamilton (Mayor Resto)
- Check Sum 100% (totalOriginal === totalDistribuido)
- Registro de residuos para ajustes futuros
- Sin pérdida de unidades en redondeos

### Nivel 2: Comercial
**Objetivo:** Mantener sentido de negocio retail

- Priorizar curvas completas sobre talles sueltos
- Enviar al menos 1 curva completa por SKU
- Eliminar microasignaciones ineficientes (<3 unidades)
- Detectar y gestionar sobrestock (>3 curvas completas)
- Respetar capacidad y rotación de cada local

### Nivel 3: Logístico
**Objetivo:** Optimizar costos y tiempos de transferencia

- Unificar movimientos (una transferencia grande > varias chicas)
- Locales grandes (>8% UTA) no distribuyen salvo sobrestock
- Limpiar curvas rotas entre tiendas
- Transferencias inter-locales inteligentes (evitar enviar y recibir simultáneamente)
- Stock cero en depósito (todo en tiendas)

---

## 🔢 Reglas de Negocio Implementadas

---

## 📍 CROSS - Reglas de Distribución Cross-Selling (R1-R3)

### **CROSS-R1: Distribución Base según % UTA**

**Descripción:** Distribuir el stock inicial de manera proporcional a la participación en ventas de cada sucursal.

**Criterio:**
Aplicar el algoritmo de Hamilton (Mayor Resto) utilizando el % UTA de cada sucursal.

**% UTA (Unidad de Tratamiento de Artículos):**
Participación de cada local en las ventas totales del periodo analizado.

**Fórmula:**
```
Unidades_Local = Total_SKU × (% UTA_Local / 100)
```

**Algoritmo de Hamilton:**
1. Calcular cuota exacta: `cuota = cantidad × (%UTA / 100)`
2. Asignar parte entera: `asignado = floor(cuota)`
3. Calcular residuo: `residuo = cuota - asignado`
4. Ordenar locales por: Mayor residuo → Mayor %UTA → Orden alfabético
5. Distribuir unidades faltantes a los primeros N locales

**Ejemplo:**
```
SKU: JEANS_1_38 (50 unidades)
- Unicenter (25% UTA) → 12.5 → 12 + 1 residuo prioritario = 13 unidades
- Palermo (20% UTA) → 10.0 → 10 unidades
- Abasto (15% UTA) → 7.5 → 7 + 1 residuo = 8 unidades
- DOT (10% UTA) → 5.0 → 5 unidades
...resto según residuos
Total: 50 unidades (check sum OK)
```

**Motivo en Transferencia:**
```
"Distribución según % UTA (Hamilton)"
"Curva completa (7 talles) - JEANS_1"
```

**Logs Generados:**
```
[CROSS-R1] ✅ Distribución según % UTA (aplicada por Hamilton)
[HAMILTON] Distribución base calculada: 245 asignaciones
```

---

### **CROSS-R2: Validar y Completar Curvas**

**Descripción:** Retirar curvas incompletas que no alcanzan el umbral mínimo y redistribuir al local con mayor participación.

**Criterio:**
- **Curva completa:** 100% de los talles presentes (7/7 talles)
- **Curva incompleta válida:** ≥70% de los talles (5/7 talles)
- **Curva rota:** <70% de los talles (1-4/7 talles)

**Acción:**
1. Identificar sucursales con curvas rotas (<70%)
2. Retirar todas las unidades de esa curva rota
3. Redistribuir al local con mayor % UTA
4. Registrar motivo específico

**Ejemplo:**
```
JEANS_4 en Palermo: tiene solo 4 de 7 talles (57%)
Acción: Retirar 4 unidades de Palermo
        Asignar 4 unidades a Unicenter (mayor UTA)
Motivo: "CROSS-R2: Redistribución por curva rota (<70%) desde Palermo"
```

**¿Qué es una curva completa?**

Una curva completa es el conjunto estándar de talles de un SKU según su tipología:

| Tipología | Talles de Curva Completa |
|-----------|--------------------------|
| JEANS | 36, 38, 40, 42, 44, 46, 48 (7 talles) |
| REMERAS | XS, S, M, L, XL, XXL (6 talles) |
| VESTIDOS | 1, 2, 3, 4 (4 talles) |
| ZAPATILLAS | 35, 36, 37, 38, 39, 40, 41, 42 (8 talles) |

**Detección automática:**
El sistema agrupa por `TIPOLOGIA + Color` y detecta todos los talles disponibles.

**Motivo en Transferencia:**
```
"Curva completa (7 talles) - JEANS_1"
"Curva incompleta 86% (6/7 talles) - JEANS_4"
"CROSS-R2: Redistribución por curva rota (<70%) desde Palermo"
```

**Logs Generados:**
```
[CROSS-R2] Curva incompleta detectada en Palermo: JEANS_4_AZUL (57%)
[CROSS-R2] Retiradas 4 unidades de JEANS_4_38 en Palermo (curva rota)
[CROSS-R2] Redistribuidas 4 unidades de JEANS_4_38 a Unicenter (mayor participación)
[CROSS-R2] Total redistribuido: 12 ajustes, 47 unidades
```

---

### **CROSS-R3: Asignar Sobrantes al Local con Mayor Participación**

**Descripción:** Los sobrantes o excedentes no asignados se envían automáticamente al local con mayor % UTA.

**Criterio:**
- Local con mayor participación = Mayor % UTA
- Recibe stock no asignado por otras reglas
- Actúa como "colchón" para garantizar distribución completa

**Ejemplo:**
```
Sobrante: 5 unidades de JEANS_Z_40 (sin curva clara)
Acción: Asignar 5 unidades a Unicenter (30% UTA, el mayor)
```

**Motivo en Transferencia:**
```
"Asignación a local con mayor participación (30% UTA)"
```

**Logs Generados:**
```
[CROSS-R3] Local con mayor participación: Unicenter (30.00%)
[CROSS-R3] ✅ Sobrantes asignados al local con mayor UTA
```

---

## 🏪 INTERLOCAL - Reglas de Distribución Inter-Local (R4-R9)

### **INTERLOCAL-R4: Restricción de Locales Grandes**

**Descripción:** Los locales con alta participación (>8% UTA) no distribuyen su stock propio a otros, salvo que tengan sobrestock de más de 3 curvas completas.

**Umbral:** 8% UTA

**Criterio:**
- **Local grande:** % UTA > 8%
- **No distribuye:** Su stock propio se queda en el local
- **Excepción:** Si tiene sobrestock (≥3 curvas completas del mismo SKU) → puede redistribuir excedente

**Ejemplo:**
```
Unicenter: 25% UTA → Local grande
- Tiene 2 curvas de JEANS_1 → NO redistribuye (se queda su stock)
- Tiene 4 curvas de JEANS_5 → SÍ redistribuye 1 curva (sobrestock)
```

**¿Por qué?**
Los locales grandes tienen alta rotación y necesitan mantener su stock para no generar quiebres.

**Motivo en Transferencia:**
```
"Local grande: Stock propio retenido (25% UTA)"
"Sobrestock: Redistribución de excedente (4 curvas → 3 curvas)"
```

**Logs Generados:**
```
[INTERLOCAL-R4] Locales grandes identificados: Unicenter, Palermo, DOT
[INTERLOCAL-R4] Unicenter marcado como local grande - restricción de transferencias aplicada
```

---

### **INTERLOCAL-R5: Prioridad de Completar Curvas**

**Descripción:** Los productos con mayor prioridad comercial se procesan primero, asegurando que los SKUs críticos obtengan las mejores asignaciones.

**Criterio:**
- Leer archivo **Prioridad** (TIPOLOGIA → número de prioridad)
- Ordenar SKUs: **Menor número = Mayor prioridad**
- Prioridad 1 se procesa antes que prioridad 2, etc.
- Sin prioridad asignada = 999 (se procesa al final)

**Archivo Prioridad (ejemplo):**
```csv
TIPOLOGIA, PRIORIDAD
JEANS, 1
REMERAS, 2
VESTIDOS, 3
ZAPATILLAS, 4
```

**Ejemplo:**
```
JEANS (prioridad 1) → Se distribuye primero
REMERAS (prioridad 2) → Se distribuye después
CAMPERAS (sin prioridad) → Se distribuye al final (prioridad 999)
```

**Impacto:**
Los productos prioritarios obtienen las mejores ubicaciones (locales top UTA) antes que los de menor prioridad.

**Motivo en Transferencia:**
```
"Prioridad 1: JEANS - Producto crítico"
"Prioridad 999: ACCESORIOS - Producto estándar"
```

**Logs Generados:**
```
[INTERLOCAL-R5] ✅ Orden de prioridad ya aplicado (productos críticos procesados primero)
[ORDEN] Productos ordenados por prioridad: primero JEANS (1)
```

---

### **INTERLOCAL-R6: Optimizar Movimientos**

**Descripción:** Unificar y consolidar transferencias para minimizar costos logísticos.

**Criterio:**
- **Preferir:** 1 transferencia de 10 unidades
- **Evitar:** 10 transferencias de 1 unidad
- Agrupar transferencias del mismo origen → destino
- Reducir cantidad de movimientos totales

**Ejemplo:**
```
Antes:
- Abasto → Unicenter: JEANS_1_38 (2 unidades)
- Abasto → Unicenter: JEANS_1_40 (3 unidades)
- Abasto → Unicenter: JEANS_1_42 (1 unidad)

Después (optimizado):
- Abasto → Unicenter: JEANS_1 (6 unidades totales en 1 envío)
```

**Motivo en Transferencia:**
```
"Movimiento consolidado: 6 unidades de JEANS_1"
```

**Logs Generados:**
```
[INTERLOCAL-R6] ✅ Optimización de movimientos (se aplicará en generación de transferencias)
```

---

### **INTERLOCAL-R7: Limpiar Curvas Rotas Existentes**

**Descripción:** Identificar y limpiar curvas muy fragmentadas (<50% de talles) redistribuyendo al local con mayor participación.

**Criterio:**
- **Curva muy rota:** <50% de los talles presentes
- **Acción:** Retirar todos los talles de esa curva
- **Redistribuir:** Al local con mayor % UTA

**Diferencia con CROSS-R2:**
- CROSS-R2: Umbral 70% (más estricto)
- INTERLOCAL-R7: Umbral 50% (limpieza profunda)

**Ejemplo:**
```
JEANS_3 en Flores: tiene solo 2 de 7 talles (29%)
Acción: Retirar 2 unidades de Flores
        Asignar 2 unidades a Unicenter (mayor UTA)
Motivo: "INTERLOCAL-R7: Limpieza de curva rota (<50%) desde Flores"
```

**Motivo en Transferencia:**
```
"Talles sueltos 29% (2/7 talles) - JEANS_3"
"INTERLOCAL-R7: Limpieza de curva rota (<50%) desde Flores"
```

**Logs Generados:**
```
[INTERLOCAL-R7] Curva rota limpiada: JEANS_3_NEGRO en Flores
[INTERLOCAL-R7] Limpieza completada: 8 ajustes, 23 unidades redistribuidas
```

---

### **INTERLOCAL-R8: Analizar Categoría + Prioridad**

**Descripción:** Trazabilidad de la distribución por categoría y prioridad para análisis posterior.

**Criterio:**
- Agrupar SKUs por prioridad
- Registrar cantidad de SKUs por cada nivel de prioridad
- Facilitar análisis de qué tipologías están mejor/peor distribuidas

**Ejemplo:**
```
Prioridad 1 (JEANS): 45 SKUs distribuidos
Prioridad 2 (REMERAS): 78 SKUs distribuidos
Prioridad 3 (VESTIDOS): 32 SKUs distribuidos
```

**Logs Generados:**
```
[INTERLOCAL-R8] Prioridad 1: 45 SKUs
[INTERLOCAL-R8] Prioridad 2: 78 SKUs
[INTERLOCAL-R8] Prioridad 3: 32 SKUs
```

**Uso:**
Permite identificar si categorías críticas están bien cubiertas en todos los locales.

---

### **INTERLOCAL-R9: Acumular UTA**

**Descripción:** Registrar la participación total acumulada por sucursal para validación y análisis.

**Criterio:**
- Sumar % UTA de todas las sucursales
- Validar que la suma = 100%
- Registrar para trazabilidad

**Ejemplo:**
```
UTA acumulada:
- Unicenter: 25.50%
- Palermo: 18.75%
- DOT: 12.30%
- Abasto: 10.25%
- ...
Total: 100.00% ✅
```

**Logs Generados:**
```
[INTERLOCAL-R9] UTA acumulada por sucursal:
  Unicenter: 25.50%
  Palermo: 18.75%
  ...
  Total: 100.00%
```

---

## 🛒 COMERCIAL - Reglas Comerciales Avanzadas (R10-R12)

### **COMERCIAL-R10: Garantizar al Menos 1 Curva Completa por SKU**

**Descripción:** Si ninguna sucursal tiene una curva completa de un SKU, asignar 1 unidad de cada talle al local con mayor % UTA.

**Criterio:**
- Verificar si existe al menos 1 curva completa (100% talles) en alguna sucursal
- Si ninguna sucursal tiene curva completa → asignar al top UTA
- Asignar 1 unidad de cada talle faltante

**¿Por qué?**
Garantiza que al menos un local tenga el set completo de talles para mostrar a los clientes.

**Ejemplo:**
```
VESTIDOS_8:
- Palermo tiene: S, M (2/4 talles)
- DOT tiene: L (1/4 talles)
- Flores tiene: XL (1/4 talles)
→ Ninguna sucursal tiene curva completa

Acción:
- Asignar a Unicenter (top UTA): S, M, L, XL (curva completa)
- Motivo: "COMERCIAL-R10: Curva completa mínima garantizada - VESTIDOS_8"
```

**Motivo en Transferencia:**
```
"COMERCIAL-R10: Curva completa mínima garantizada - VESTIDOS_8"
```

**Logs Generados:**
```
[COMERCIAL-R10] 📍 Verificando curvas completas mínimas por SKU
[COMERCIAL-R10] Curva completa garantizada: VESTIDOS_8_ROJO en Unicenter
[COMERCIAL-R10] ✅ Ajustes realizados: 12 asignaciones mínimas
```

---

### **COMERCIAL-R11: Eliminar Microasignaciones**

**Descripción:** Retirar asignaciones menores a 3 unidades y redistribuir al local con mayor participación.

**Umbral:** 3 unidades

**Criterio:**
- Identificar asignaciones de 1 o 2 unidades
- Retirar de ese local
- Redistribuir al local con mayor % UTA

**¿Por qué?**
Las microasignaciones generan:
- Costos logísticos desproporcionados
- Complejidad en inventario
- Baja rotación (1-2 unidades se venden lento)

**Ejemplo:**
```
JEANS_7_40 en Quilmes: 2 unidades

Acción:
- Retirar 2 unidades de Quilmes
- Asignar 2 unidades a Unicenter (mayor UTA)
- Motivo: "COMERCIAL-R11: Redistribución de microasignación desde Quilmes (2 unidades)"
```

**Motivo en Transferencia:**
```
"COMERCIAL-R11: Redistribución de microasignación desde Quilmes (2 unidades)"
```

**Logs Generados:**
```
[COMERCIAL-R11] 📍 Eliminando microasignaciones <3 unidades
[COMERCIAL-R11] Microasignación retirada: JEANS_7_40 en Quilmes (2 unidades)
[COMERCIAL-R11] ✅ 15 microasignaciones eliminadas y redistribuidas a Unicenter
```

---

### **COMERCIAL-R12: Reasignar si Top UTA Completo**

**Descripción:** Si el local con mayor % UTA ya tiene una curva completa y excedente, reasignar el excedente al segundo local con mayor participación.

**Criterio:**
- Identificar local top UTA
- Verificar si tiene curva completa (100% talles)
- Si tiene más de 1 unidad por talle → reasignar excedente al segundo UTA

**¿Por qué?**
Balancea la distribución entre los locales más importantes, evitando concentración excesiva.

**Ejemplo:**
```
JEANS_2:
- Unicenter (top UTA 25%): tiene 3 unidades de cada talle (curva completa con excedente)
- Palermo (segundo UTA 18%): tiene 1 unidad de cada talle

Acción:
- Dejar 1 unidad de cada talle en Unicenter (curva completa)
- Reasignar 2 unidades de cada talle a Palermo
- Motivo: "COMERCIAL-R12: Excedente reasignado desde Unicenter (curva completa presente)"
```

**Motivo en Transferencia:**
```
"COMERCIAL-R12: Excedente reasignado desde Unicenter (curva completa presente)"
```

**Logs Generados:**
```
[COMERCIAL-R12] 📍 Verificando si top UTA está completo para reasignar excedente
[COMERCIAL-R12] Excedente reasignado: JEANS_2_40 de Unicenter a Palermo (2 unidades)
[COMERCIAL-R12] ✅ Reasignaciones realizadas: 18
```

---

## 🔄 Orden de Ejecución de Reglas

El sistema aplica las reglas en este orden específico:

```
1. HAMILTON (Base matemática)
   ↓
2. CROSS-R1 (Distribución por % UTA)
   ↓
3. CROSS-R2 (Validar curvas completas - umbral 70%)
   ↓
4. CROSS-R3 (Sobrantes al top UTA)
   ↓
5. INTERLOCAL-R4 (Marcar locales grandes >8% UTA)
   ↓
6. INTERLOCAL-R5 (Aplicar prioridades)
   ↓
7. INTERLOCAL-R6 (Optimizar movimientos)
   ↓
8. INTERLOCAL-R7 (Limpiar curvas rotas - umbral 50%)
   ↓
9. INTERLOCAL-R8 (Analizar categoría + prioridad)
   ↓
10. INTERLOCAL-R9 (Acumular UTA)
   ↓
11. COMERCIAL-R10 (Garantizar ≥1 curva completa)
   ↓
12. COMERCIAL-R11 (Eliminar microasignaciones <3)
   ↓
13. COMERCIAL-R12 (Reasignar si top UTA completo)
   ↓
14. CHECK SUM (Validación final: total original = total distribuido)
   ↓
15. GENERACIÓN DE TRANSFERENCIAS INTELIGENTES
```

---

## 📊 Tabla de Análisis por Local

El sistema genera automáticamente una tabla con métricas clave por sucursal:

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| **Local** | Nombre de la sucursal | Unicenter |
| **% UTA** | Participación en ventas | 25.50% |
| **Stock Actual** | Unidades totales asignadas | 1,247 |
| **Curvas Completas** | Cantidad de curvas 100% completas | 8 |
| **Curvas Incompletas** | Cantidad de curvas parciales (50-99%) | 3 |
| **Sobrestock** | SÍ si tiene ≥3 curvas completas | NO |
| **Acción Sugerida** | Recomendación automática | ✅ Óptimo: Mantener distribución |
| **Local Grande** | Badge si >8% UTA | Sí |

### Acciones Sugeridas Automáticas:

| Acción | Criterio | Significado |
|--------|----------|-------------|
| ✅ **Óptimo** | Tiene curvas completas bien balanceadas | Mantener distribución actual |
| ⚡ **Completar curvas** | Tiene curvas incompletas (50-99%) | Enviar talles faltantes |
| ⚠️ **Sobrestock** | Tiene ≥3 curvas completas | Redistribuir excedentes a otros locales |
| 📦 **Vacío** | No tiene curvas asignadas | Requiere asignación inicial |

---

## 🚨 Validaciones del Sistema

### Check Sum (Validación Crítica)

**Criterio:**
```javascript
totalOriginal === totalDistribuido
```

**Acción si falla:**
- Sistema marca ERROR en logs
- Muestra diferencia en unidades
- Bloquea exportación hasta corregir

**Ejemplo:**
```
✅ CHECKSUM OK: Original 19101, Distribuido 19101
❌ CHECKSUM ERROR: Original 19101, Distribuido 18530 (faltan 571 unidades)
```

### Validaciones Adicionales:

1. **Archivos Obligatorios:**
   - Stock (obligatorio)
   - Participación (obligatorio)
   - Prioridad (opcional, defaults a 999)

2. **Columnas Requeridas:**
   - Stock: SKU, TIPOLOGIA, Color, Medida, Deposito, Cantidad
   - Participación: Sucursal, %UTA
   - Prioridad: TIPOLOGIA, PRIORIDAD

3. **Suma % UTA = 100%:**
   - Valida que las participaciones sumen 100%
   - Alerta si hay desviación >0.5%

---

## 💡 Conceptos Clave

### 1. Curva Completa
Conjunto estándar de talles de un SKU según su tipología.
**Ejemplos:**
- JEANS: 36, 38, 40, 42, 44, 46, 48 (7 talles)
- REMERAS: XS, S, M, L, XL, XXL (6 talles)

### 2. Sobrestock
Un local tiene sobrestock cuando posee **3 o más curvas completas** del mismo SKU.
**Cálculo:**
```
Stock actual / Stock de 1 curva completa ≥ 3
```

### 3. % UTA (Unidad de Tratamiento de Artículos)
Participación de cada local en las ventas totales.
**Ejemplo:**
- Unicenter: 25% de ventas totales → 25% del stock

### 4. Local con Mayor Participación
Local que tiene el mayor % UTA.
**Usado para:**
- Recibir sobrantes (CROSS-R3)
- Redistribuciones de curvas rotas (CROSS-R2, INTERLOCAL-R7)
- Microasignaciones eliminadas (COMERCIAL-R11)

### 5. Local Grande
Local con % UTA > 8%.
**Restricción:**
- No redistribuye su stock propio (salvo sobrestock)

### 6. Microasignación
Asignación de 1 o 2 unidades a un local.
**Problema:**
- Costos logísticos altos
- Complejidad en inventario
- Baja rotación

---

## 📤 Exportación a Excel

El sistema genera un archivo Excel con **5 hojas:**

### Hoja 1: Distribución Final
Todas las asignaciones SKU por SKU.

**Columnas:**
- SKU
- TIPOLOGIA
- Color
- Medida
- Depósitos Origen
- Sucursal Destino
- Unidades
- Cuota Exacta
- Residuo
- Regla Aplicada

### Hoja 2: Transferencias
Movimientos origen → destino con motivos.

**Columnas:**
- SKU
- Talle
- Color
- Origen
- Destino
- Unidades
- Motivo
- Regla
- Prioridad
- Temporada

### Hoja 3: Resumen Sucursales
Totales y desviaciones por local.

**Columnas:**
- Sucursal
- Total Unidades
- % Esperado
- % Real
- Desviación
- Local Grande

### Hoja 4: Análisis por Local ⭐ NUEVO
Métricas de curvas y acciones sugeridas.

**Columnas:**
- Local
- % UTA
- Stock Actual
- Curvas Completas
- Curvas Incompletas
- Sobrestock
- Acción Sugerida
- Local Grande

### Hoja 5: Log de Trazabilidad
Registro completo de todas las reglas aplicadas.

**Columnas:**
- Timestamp
- Regla
- Mensaje
- Datos

---

## 🎯 Casos de Uso

### Caso 1: Stock Nuevo Llegando al Depósito

**Situación:** 500 unidades de JEANS_5 llegan al depósito central.

**Proceso:**
1. Sistema lee archivo Stock con 500 unidades en "Depósito Central"
2. Lee % UTA de cada sucursal
3. Aplica Hamilton: distribuye proporcionalmente
4. Valida curvas completas (CROSS-R2)
5. Elimina microasignaciones (COMERCIAL-R11)
6. Garantiza al menos 1 curva completa (COMERCIAL-R10)
7. Genera transferencias: Depósito Central → Sucursales

**Resultado:**
- Unicenter (25% UTA): 125 unidades (3 curvas completas)
- Palermo (18% UTA): 90 unidades (2 curvas completas)
- DOT (12% UTA): 60 unidades (1 curva completa)
- Resto distribuido proporcionalmente

---

### Caso 2: Rebalanceo Entre Locales

**Situación:** Palermo tiene sobrestock de REMERAS_2 (5 curvas), DOT tiene quiebre.

**Proceso:**
1. Sistema detecta sobrestock en Palermo (≥3 curvas)
2. Marca como disponible para redistribución
3. Identifica locales con faltantes (DOT)
4. Genera transferencia: Palermo → DOT
5. Aplica COMERCIAL-R12: reasigna excedente

**Resultado:**
- Palermo: 3 curvas (stock óptimo)
- DOT: 2 curvas (recibe redistribución)

---

### Caso 3: Curvas Rotas en Múltiples Locales

**Situación:** JEANS_3 está fragmentado: Quilmes tiene talle 38, Flores tiene 40, Lomas tiene 42.

**Proceso:**
1. Sistema detecta curvas rotas <70% (CROSS-R2)
2. Retira todos los talles sueltos
3. Consolida en Unicenter (top UTA)
4. Motivo: "CROSS-R2: Redistribución por curva rota"

**Resultado:**
- Unicenter: recibe 38, 40, 42 (3 talles de 7 = aún incompleto)
- Sistema sugiere completar con stock adicional

---

## 🔍 Logs y Trazabilidad

Cada regla genera logs detallados:

```log
[INICIO] 🚀 Iniciando distribución inteligente v2.0
[PARSER] Prioridades parseadas: 8 tipologías
[ORDEN] Productos ordenados por prioridad: primero JEANS (1)
[HAMILTON] Distribución base calculada: 245 asignaciones
[CROSS-R1] ✅ Distribución según % UTA (aplicada por Hamilton)
[CROSS-R2] Curva incompleta detectada en Palermo: JEANS_4_AZUL (57%)
[CROSS-R2] Retiradas 4 unidades de JEANS_4_38 en Palermo (curva rota)
[CROSS-R2] Redistribuidas 4 unidades a Unicenter (mayor participación)
[INTERLOCAL-R4] Locales grandes identificados: Unicenter, Palermo, DOT
[COMERCIAL-R10] Curva completa garantizada: VESTIDOS_8_ROJO en Unicenter
[COMERCIAL-R11] Microasignación retirada: JEANS_7_40 en Quilmes (2 unidades)
[CHECKSUM] ✅ OK: Original 19101, Distribuido 19101
[TRANSFERENCIAS] Generadas: 387 movimientos
[FIN] ✅ Distribución completada
```

---

## 📋 Resumen de Umbrales y Constantes

| Constante | Valor | Uso |
|-----------|-------|-----|
| `UMBRAL_LOCAL_GRANDE` | 8% UTA | Define locales grandes (INTERLOCAL-R4) |
| `UMBRAL_SOBRESTOCK_CURVAS` | 3 curvas | Detecta sobrestock |
| `MINIMO_UNIDADES_ASIGNACION` | 3 unidades | Elimina microasignaciones (COMERCIAL-R11) |
| `MINIMO_CURVA_COMPLETA` | 1 curva | Garantiza mínimo por SKU (COMERCIAL-R10) |
| `UMBRAL_CURVA_VALIDA` | 70% talles | Valida curvas (CROSS-R2) |
| `UMBRAL_CURVA_ROTA` | 50% talles | Limpia curvas (INTERLOCAL-R7) |

---

## 🚀 Roadmap Futuro

### Posibles Mejoras (No Implementadas):

1. **Proximidad Geográfica:**
   - Priorizar transferencias entre locales cercanos
   - Reducir costos de envío

2. **Stock Máximo por Local:**
   - Definir capacidad física de cada sucursal
   - Validar que no se exceda espacio disponible

3. **Rotación Histórica:**
   - Analizar qué SKUs rotan más en cada local
   - Asignar preferentemente a locales con mejor rotación

4. **IA Predictiva:**
   - Predecir demanda futura
   - Ajustar distribución proactivamente

---

## 📞 Soporte

**Versión del Sistema:** 2.0
**Última Actualización:** 2025-10-30
**Algoritmo:** Hamilton + 12 Reglas de Negocio
**Autor:** Claude Code + Luis Luongo

---

## 📄 Licencia

Este documento describe el comportamiento del sistema Smart Stock Lite.
Distribución Inteligente de SKUs entre Depósitos y Sucursales.

---

**🎯 ¡Fin de la Documentación!**

Para consultas técnicas o sugerencias de mejora, revisar los logs generados en la pestaña "Log de Trazabilidad" de la exportación Excel.
