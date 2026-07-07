# Responsive Mobile — NubeVigía RD

**Fecha:** 2026-07-07  
**Versión objetivo:** v1.4.2  
**Estado:** Aprobado

---

## Contexto

La app está diseñada para desktop. En móvil (360–412px) hay scroll horizontal, botones muy pequeños y el modal de provincia no cabe en pantalla. Los dispositivos objetivo son Samsung Galaxy A52s 5G (~360px CSS) y Galaxy S21 Ultra (~412px CSS).

---

## Enfoque: Híbrido A+B

- **Tailwind breakpoints** para ajustes de layout que CSS puede manejar solo.
- **`useIsMobile()`** para cambios de comportamiento que requieren lógica JS (acordeón, modal full-screen).
- Sin componentes duplicados. Sin layouts paralelos.

---

## Nuevo: `frontend/src/hooks/useIsMobile.js`

```js
// Retorna { isMobile: boolean }
// true cuando window.innerWidth < 768px
// Escucha resize con debounce 100ms
// SSR-safe: fallback false si window no existe
```

---

## Componentes modificados

### `Header.jsx` — solo Tailwind

| Elemento | Desktop | Mobile |
|----------|---------|--------|
| Badge nivel | texto completo (`⚠ Aviso`) | solo emoji (`⚠`) |
| Timestamp | visible (`hidden sm:block`) | oculto (ya así) |
| Flag RD | visible (`hidden md:flex`) | oculto (ya así) |
| Botones | refresh + campana + toggle | igual, sin cambios |

El header ya tiene bastante de esto — los ajustes son mínimos.

---

### `Dashboard.jsx` — solo Tailwind

El sidebar (`AlertPanel` + `ReportPanel` + créditos) actualmente aparece debajo del contenido en mobile por el `grid-cols-1 lg:grid-cols-4`. Se agrega `order` para que suba encima del dashboard cardinal en mobile:

```
Mobile:           Desktop (lg):
1. StatsOverview  1. StatsOverview
2. AlertPanel     2. CardinalDashboard (3/4) | AlertPanel (1/4)
3. ReportPanel
4. CardinalDashboard
```

Clases: `order-first lg:order-last` en el aside, `order-last lg:order-first` en la section.

---

### `CardinalDashboard.jsx` — hook + Tailwind

**Barra de controles:**
- `flex-col gap-2 sm:flex-row sm:items-center` — apila verticalmente en mobile
- Botón GPS: `w-full sm:w-auto` en mobile

**Acordeón (mobile only):**
- `openQuadrants` → `Set` con los qid abiertos, inicializado con `['norte']`
- `toggleQuadrant(qid)` abre/cierra
- En mobile, pasa `isOpen` y `onToggle` a cada `CardinalQuadrant`
- En desktop (`!isMobile`), todos abiertos, sin pasar props de acordeón

---

### `CardinalQuadrant.jsx` — hook + Tailwind

**Cabecera (siempre visible en mobile):**
- Zona + flecha + temp promedio + badge "Tu zona" si aplica
- Botón de toggle acordeón (chevron ▼/▲) alineado a la derecha
- Touch target mínimo: `min-h-[44px]`

**Contenido (colapsable en mobile):**
- Oculto con `hidden` cuando `!isOpen && isMobile`
- Animación de apertura: `transition-all duration-200`

**Filas de provincia en mobile:**
- Ocultar: barra de calor, columna de viento
- Mostrar: nombre + emoji condición + temp°C + mini-dots pronóstico
- Touch target fila: `min-h-[44px] py-2`

**Filas en desktop:** sin cambios.

---

### `ProvinceModal.jsx` — hook + Tailwind

| Propiedad | Desktop | Mobile |
|-----------|---------|--------|
| Posición | `p-4` centrado | `inset-0 p-0` full-screen |
| Border radius | `rounded-2xl` | `rounded-none` |
| Max width | `1000px` | `100vw` |
| Max height | `90vh` | `100dvh` |
| Pronóstico 3 días | fila horizontal | columna vertical |
| Padding interno | `px-6 py-4` | `px-4 py-3` |
| Botón cerrar | esquina superior derecha | barra fija abajo (`fixed bottom-0`) |

En mobile el botón de cerrar (`×`) pasa a una barra sticky al fondo para no tapar contenido.

---

### `StatsOverview.jsx` — solo Tailwind

Verificar que el grid de estadísticas nacionales use `grid-cols-2 sm:grid-cols-4` para no quedar en 4 columnas apretadas en 360px.

---

## Breakpoints utilizados

| Clase Tailwind | Ancho mínimo | Uso |
|----------------|--------------|-----|
| (base) | 0px | Mobile — 360–412px |
| `sm:` | 640px | Tablet pequeña |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |

`useIsMobile()` usa `< 768px` alineado con el breakpoint `md:`.

---

## Fuera de alcance

- Gestos táctiles (swipe entre cuadrantes)
- PWA / instalación en home screen
- Orientación landscape específica
- Optimización de imágenes para móvil
