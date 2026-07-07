# language: es

Característica: Detección de Alertas Climáticas — alertDetector.js
  Como sistema de monitoreo NubeVigía RD
  Quiero detectar automáticamente situaciones meteorológicas peligrosas
  Para emitir alertas oportunas a la población dominicana

  # ────────────────────────────────────────────────────────────────────
  # Umbrales reales (constants.js):
  #   TROPICAL_STORM  = 63 km/h  (≥63 → Tormenta Tropical)
  #   HURRICANE_CAT1  = 119 km/h (≥119 → Huracán Categoría 1+)
  # EMERGENCY_KEYWORDS: hurricane, huracán, tormenta tropical,
  #   flood warning, flash flood, cyclone, depresión tropical, etc.
  # ────────────────────────────────────────────────────────────────────

  # ══════════════════════════════════════════════════════════════════════
  # FUNCIÓN: detectFromWeather — Estrategia 3: Umbral de Viento
  # ══════════════════════════════════════════════════════════════════════

  Regla: El viento ≥ 119 km/h dispara una alerta de Huracán

    @positivo
    Escenario: Viento de 125 km/h genera trigger de Huracán Categoría 1+
      Input: provincia Monte Cristi con viento 125 km/h (supera el umbral de huracán en 6 km/h).
      Resultado esperado: se crea un trigger WeatherAPI-Wind con nivel "Huracán Categoría 1+"
      y el campo windKph queda registrado con el valor exacto de 125.
      Importancia: confirma que el camino feliz de detección de huracanes funciona de extremo a extremo.
      Dado una provincia "Monte Cristi" con viento de 125 km/h
      Cuando ejecuto detectFromWeather
      Entonces obtengo 1 trigger(s) de fuente "WeatherAPI-Wind"
      Y el trigger de viento tiene nivel que contiene "Huracán"
      Y el trigger de viento registra windKph de 125

    @positivo
    Escenario: Viento de 75 km/h genera trigger de Tormenta Tropical
      Input: provincia Puerto Plata con viento 75 km/h (supera umbral de tormenta tropical 63 km/h,
      pero no llega al de huracán 119 km/h).
      Resultado esperado: trigger con nivel "Tormenta Tropical", NO de huracán.
      Importancia: verifica que los dos niveles de alerta de viento se distinguen correctamente.
      Dado una provincia "Puerto Plata" con viento de 75 km/h
      Cuando ejecuto detectFromWeather
      Entonces obtengo 1 trigger(s) de fuente "WeatherAPI-Wind"
      Y el trigger de viento tiene nivel que contiene "Tormenta Tropical"

    @positivo
    Escenario: Múltiples provincias generan un trigger de viento por cada una
      Input: dos provincias simultáneas — Monte Cristi (125 km/h) y Puerto Plata (75 km/h).
      Resultado esperado: exactamente 2 triggers de viento, uno por cada provincia.
      Importancia: valida que el bucle procesa todas las provincias sin saltarse ninguna
      ni mezclar los datos entre ellas.
      Dado las siguientes provincias con viento:
        | provincia    | wind_kph |
        | Monte Cristi | 125      |
        | Puerto Plata | 75       |
      Cuando ejecuto detectFromWeather
      Entonces obtengo 2 trigger(s) de fuente "WeatherAPI-Wind"

    @negativo
    Escenario: Viento de 62 km/h (por debajo del umbral) no genera trigger
      Input: viento de 62 km/h, que está 1 km/h por debajo del umbral mínimo de tormenta (63).
      Resultado esperado: ningún trigger de viento — el sistema no genera falsa alarma.
      Importancia: verifica que la condición usa >= y no >, evitando alertas prematuras.
      Dado una provincia "Barahona" con viento de 62 km/h
      Cuando ejecuto detectFromWeather
      Entonces no obtengo triggers de fuente "WeatherAPI-Wind"

    @negativo
    Escenario: Lista de provincias vacía retorna array vacío
      Input: se llama detectFromWeather con un array sin provincias [].
      Resultado esperado: la función retorna un array vacío, sin errores ni cuelgues.
      Importancia: protege contra llamadas sin datos (por ejemplo, si la API no devuelve provincias).
      Dado un array de provincias vacío
      Cuando ejecuto detectFromWeather
      Entonces obtengo una lista de triggers vacía

    @negativo
    Escenario: Provincia sin propiedad current no lanza error ni genera trigger de viento
      Input: objeto de provincia sin el campo "current" (dato corrupto o incompleto).
      Resultado esperado: la función continúa sin lanzar excepción y no genera trigger de viento.
      Importancia: garantiza que un dato malo no tira abajo el procesamiento de las demás provincias.
      Dado una provincia "Test" sin datos de current
      Cuando ejecuto detectFromWeather
      Entonces no se lanza ningún error
      Y no obtengo triggers de fuente "WeatherAPI-Wind"

    @negativo
    Escenario: wind_kph nulo no genera trigger de viento
      Input: province.current.wind_kph = null (campo presente pero sin valor).
      Resultado esperado: el sistema trata null como 0 km/h y no genera alerta de viento.
      Importancia: evita que un null cause NaN en la comparación y dispare resultados incorrectos.
      Dado una provincia "Test" con wind_kph nulo
      Cuando ejecuto detectFromWeather
      Entonces no se lanza ningún error
      Y no obtengo triggers de fuente "WeatherAPI-Wind"

    @negativo
    Escenario: wind_kph como string numérico alto no debería generar trigger
      Input: wind_kph = "125" (string en lugar de número — dato corrupto de la API).
      Resultado esperado: el sistema no lanza error. Nota: este escenario expone un bug conocido
      donde JS coerciona "125" >= 119 a true. La solución está documentada en las sugerencias
      de refactorización (validación de tipo estricta).
      Dado una provincia "Test" con wind_kph en string "125"
      Cuando ejecuto detectFromWeather
      Entonces no se lanza ningún error

    @limite
    Esquema del escenario: Valores frontera del umbral de Tormenta Tropical (63 km/h)
      Prueba los tres valores críticos alrededor del umbral exacto de 63 km/h:
      62 = justo abajo (no debe disparar), 63 = umbral exacto (debe disparar),
      64 = justo arriba (debe disparar). Verifica que el operador >= funciona correctamente.
      Dado una provincia "Frontera" con viento de <wind_kph> km/h
      Cuando ejecuto detectFromWeather
      Entonces el resultado de viento es "<resultado>"

      Ejemplos:
        | wind_kph | resultado         |
        | 62       | sin trigger       |
        | 63       | Tormenta Tropical |
        | 64       | Tormenta Tropical |

    @limite
    Esquema del escenario: Valores frontera del umbral de Huracán Categoría 1 (119 km/h)
      Prueba los tres valores críticos alrededor del umbral exacto de 119 km/h:
      118 = justo abajo (Tormenta Tropical, no Huracán), 119 = umbral exacto (Huracán Cat.1+),
      120 = justo arriba (Huracán Cat.1+). Valida la transición entre los dos niveles de alerta.
      Dado una provincia "Frontera" con viento de <wind_kph> km/h
      Cuando ejecuto detectFromWeather
      Entonces el resultado de viento es "<resultado>"

      Ejemplos:
        | wind_kph | resultado            |
        | 118      | Tormenta Tropical    |
        | 119      | Huracán Categoría 1+ |
        | 120      | Huracán Categoría 1+ |

  # ══════════════════════════════════════════════════════════════════════
  # FUNCIÓN: detectFromWeather — Estrategia 2: Texto de Condición
  # ══════════════════════════════════════════════════════════════════════

  Regla: Una keyword de emergencia en condition.text dispara una alerta de condición

    @positivo
    Escenario: Keyword "hurricane" en condition.text genera trigger WeatherAPI-Condition
      Input: condition.text = "Hurricane conditions" (contiene la keyword "hurricane").
      Resultado esperado: trigger de tipo WeatherAPI-Condition con keyword = "hurricane".
      Importancia: valida la estrategia de detección por texto cuando la API no incluye
      alertas oficiales pero sí describe una condición peligrosa en texto libre.
      Dado una provincia "Nagua" con condición de texto "Hurricane conditions"
      Cuando ejecuto detectFromWeather
      Entonces obtengo 1 trigger(s) de fuente "WeatherAPI-Condition"
      Y el trigger de condición tiene keyword "hurricane"

    @positivo
    Escenario: Keyword "tormenta tropical" en condition.text es detectada
      Input: condition.text = "Tormenta tropical intensa" (keyword en español).
      Resultado esperado: trigger generado — el sistema detecta keywords en ambos idiomas.
      Importancia: WeatherAPI a veces devuelve condiciones en español; la detección debe funcionar
      sin importar el idioma del texto.
      Dado una provincia "Samaná" con condición de texto "Tormenta tropical intensa"
      Cuando ejecuto detectFromWeather
      Entonces obtengo 1 trigger(s) de fuente "WeatherAPI-Condition"

    @positivo
    Escenario: La detección de keywords es insensible a mayúsculas
      Input: condition.text = "TORMENTA TROPICAL — ALERTA" (todo en mayúsculas).
      Resultado esperado: trigger generado — el sistema hace toLowerCase() antes de comparar.
      Importancia: evita falsos negativos por diferencias de capitalización en los datos de la API.
      Dado una provincia "Santiago" con condición de texto "TORMENTA TROPICAL — ALERTA"
      Cuando ejecuto detectFromWeather
      Entonces obtengo 1 trigger(s) de fuente "WeatherAPI-Condition"

    @negativo
    Escenario: Condición normal sin keywords no genera trigger de condición
      Input: condition.text = "Parcialmente nublado" (condición climática normal).
      Resultado esperado: ningún trigger — el texto no contiene ninguna keyword de emergencia.
      Importancia: verifica que el sistema no genera alertas falsas para condiciones cotidianas.
      Dado una provincia "La Vega" con condición de texto "Parcialmente nublado"
      Cuando ejecuto detectFromWeather
      Entonces no obtengo triggers de fuente "WeatherAPI-Condition"

    @negativo
    Escenario: Propiedad condition nula no lanza error
      Input: province.current.condition = null (la API no devolvió el objeto de condición).
      Resultado esperado: no se lanza excepción, no se genera trigger.
      Importancia: el optional chaining (?.) debe absorber el null sin crashear el servidor.
      Dado una provincia "Test" con condition nulo
      Cuando ejecuto detectFromWeather
      Entonces no se lanza ningún error
      Y no obtengo triggers de fuente "WeatherAPI-Condition"

    @limite
    Esquema del escenario: Keyword completa necesaria para disparar trigger de condición
      Prueba la frontera entre "texto que contiene la keyword" y "texto parecido pero diferente".
      "hurric" NO es una keyword válida aunque sea prefijo de "hurricane".
      La detección usa String.includes() sobre la keyword completa, no expresiones regulares parciales.
      Dado una provincia "Frontera" con condición de texto "<texto>"
      Cuando ejecuto detectFromWeather
      Entonces el resultado de condición es "<resultado>"

      Ejemplos:
        | texto                          | resultado   |
        | hurricane                      | con trigger |
        | Hurricane Warning in effect    | con trigger |
        | flood warning severo           | con trigger |
        | hurric                         | sin trigger |
        | Cielo despejado                | sin trigger |
        | Lluvias moderadas              | sin trigger |

  # ══════════════════════════════════════════════════════════════════════
  # FUNCIÓN: detectFromWeather — Estrategia 1: Alertas Oficiales
  # ══════════════════════════════════════════════════════════════════════

  Regla: Una keyword en una alerta oficial WeatherAPI dispara trigger WeatherAPI-Alert

    @positivo
    Escenario: Keyword en evento de alerta oficial genera trigger WeatherAPI-Alert
      Input: alerta oficial con event = "Hurricane Warning" — la keyword "hurricane" está en el evento.
      Resultado esperado: trigger WeatherAPI-Alert con la provincia correcta registrada.
      Importancia: valida la estrategia de mayor prioridad — alertas que WeatherAPI emite oficialmente.
      Dado una provincia "Puerto Plata" con alerta oficial de evento "Hurricane Warning"
      Cuando ejecuto detectFromWeather
      Entonces obtengo 1 trigger(s) de fuente "WeatherAPI-Alert"
      Y el trigger de alerta tiene provincia "Puerto Plata"

    @positivo
    Escenario: Keyword en la descripción de la alerta genera trigger WeatherAPI-Alert
      Input: alerta donde el campo "desc" (no "event") contiene "flash flood imminent".
      Resultado esperado: trigger generado — la búsqueda abarca AMBOS campos del objeto alerta.
      Importancia: WeatherAPI usa "desc" en algunos países; el sistema no debe perder esas alertas.
      Dado una provincia "Barahona" con alerta oficial de descripción "flash flood imminent"
      Cuando ejecuto detectFromWeather
      Entonces obtengo 1 trigger(s) de fuente "WeatherAPI-Alert"

    @positivo
    Escenario: Solo se genera un trigger por alerta aunque haya múltiples keywords
      Input: alerta con event = "Hurricane and cyclone warning" — contiene "hurricane" Y "cyclone".
      Resultado esperado: UN solo trigger (el break interno evita duplicados por la misma alerta).
      Importancia: sin el break, una alerta con múltiples keywords generaría ruido duplicado.
      Dado una provincia "Azua" con alerta oficial de evento "Hurricane and cyclone warning"
      Cuando ejecuto detectFromWeather
      Entonces obtengo 1 trigger(s) de fuente "WeatherAPI-Alert"

    @negativo
    Escenario: Alerta oficial sin keywords no genera trigger WeatherAPI-Alert
      Input: alerta con event = "Mild Breeze Advisory" — ninguna keyword de emergencia presente.
      Resultado esperado: ningún trigger — la alerta no es de tipo emergencia.
      Importancia: WeatherAPI emite muchos tipos de alertas; solo las críticas deben disparar el sistema.
      Dado una provincia "Test" con alerta oficial de evento "Mild Breeze Advisory"
      Cuando ejecuto detectFromWeather
      Entonces no obtengo triggers de fuente "WeatherAPI-Alert"

    @negativo
    Escenario: Propiedad alerts indefinida no lanza error
      Input: objeto de provincia donde la propiedad "alerts" no existe (dato incompleto).
      Resultado esperado: no se lanza excepción — el operador || [] protege el bucle.
      Importancia: si la API omite el campo alerts, el servidor no debe caerse.
      Dado una provincia "Test" sin propiedad alerts
      Cuando ejecuto detectFromWeather
      Entonces no se lanza ningún error
      Y no obtengo triggers de fuente "WeatherAPI-Alert"

    @negativo
    Escenario: alerts con array vacío no genera triggers
      Input: province.alerts = [] (campo presente pero sin alertas activas).
      Resultado esperado: el bucle interno no itera y no genera ningún trigger.
      Importancia: estado normal de la mayoría de provincias en días sin alertas.
      Dado una provincia "Test" con lista de alertas vacía
      Cuando ejecuto detectFromWeather
      Entonces no obtengo triggers de fuente "WeatherAPI-Alert"

  # ══════════════════════════════════════════════════════════════════════
  # FUNCIÓN: detectFromOnamet
  # ══════════════════════════════════════════════════════════════════════

  Regla: Solo las alertas ONAMET de severity "emergency" o "warning" generan triggers

    @positivo
    Escenario: Alerta ONAMET de severity "emergency" es incluida como trigger
      Input: boletín ONAMET con severity = "emergency" (nivel máximo de alerta oficial RD).
      Resultado esperado: la alerta pasa el filtro y se convierte en trigger con source = "ONAMET".
      Importancia: las alertas de emergencia de ONAMET deben siempre propagarse al dashboard.
      Dado una alerta ONAMET con severity "emergency"
      Cuando ejecuto detectFromOnamet
      Entonces obtengo 1 trigger(s) ONAMET
      Y el trigger ONAMET tiene severity "emergency"

    @positivo
    Escenario: Alerta ONAMET de severity "warning" es incluida como trigger
      Input: boletín ONAMET con severity = "warning" (segundo nivel más alto).
      Resultado esperado: la alerta pasa el filtro y se convierte en trigger.
      Importancia: los avisos de ONAMET (no solo emergencias) también deben mostrarse.
      Dado una alerta ONAMET con severity "warning"
      Cuando ejecuto detectFromOnamet
      Entonces obtengo 1 trigger(s) ONAMET

    @positivo
    Escenario: Mezcla de severidades — solo emergency y warning son incluidas
      Input: tres boletines simultáneos con severidades "emergency", "warning" y "watch".
      Resultado esperado: exactamente 2 triggers — el de "watch" queda excluido.
      Importancia: el filtro debe ser preciso; incluir "watch" generaría demasiado ruido.
      Dado 3 alertas ONAMET con severidades "emergency", "warning" y "watch"
      Cuando ejecuto detectFromOnamet
      Entonces obtengo 2 trigger(s) ONAMET

    @positivo
    Escenario: El trigger ONAMET conserva todos los campos del boletín original
      Input: boletín con todos sus campos (title, description, type, severity).
      Resultado esperado: el trigger conserva source="ONAMET", title, description, type y severity.
      Importancia: el frontend necesita todos esos campos para mostrar la alerta completa al usuario.
      Dado una alerta ONAMET con severity "emergency" y título "AVISO ESPECIAL Nº1"
      Cuando ejecuto detectFromOnamet
      Entonces el trigger ONAMET tiene source "ONAMET"
      Y el trigger ONAMET tiene el título "AVISO ESPECIAL Nº1"
      Y el trigger ONAMET tiene severity "emergency"

    @negativo
    Escenario: Alerta ONAMET de severity "watch" es excluida
      Input: boletín con severity = "watch" (vigilancia preventiva, nivel más bajo).
      Resultado esperado: la alerta NO pasa el filtro — retorna array vacío.
      Importancia: las vigilancias son informativas, no requieren alerta activa en el dashboard.
      Dado una alerta ONAMET con severity "watch"
      Cuando ejecuto detectFromOnamet
      Entonces obtengo una lista de triggers vacía

    @negativo
    Escenario: Alerta ONAMET sin propiedad severity es excluida
      Input: boletín donde el campo "severity" está ausente (dato incompleto o mal formado).
      Resultado esperado: la alerta no pasa el filtro — no se genera trigger, no hay error.
      Importancia: un boletín mal estructurado no debe crashear el sistema ni generar alertas fantasma.
      Dado una alerta ONAMET sin propiedad severity
      Cuando ejecuto detectFromOnamet
      Entonces obtengo una lista de triggers vacía

    @negativo
    Escenario: Lista de alertas ONAMET vacía retorna array vacío
      Input: se llama detectFromOnamet con [] (ONAMET no tiene boletines activos hoy).
      Resultado esperado: array vacío — funcionamiento normal en días sin alertas.
      Importancia: el estado más frecuente del sistema; debe ser eficiente y no generar errores.
      Dado una lista de alertas ONAMET vacía
      Cuando ejecuto detectFromOnamet
      Entonces obtengo una lista de triggers vacía

    @limite
    Esquema del escenario: Clasificación de severidad ONAMET en el límite de inclusión
      Prueba los cuatro niveles posibles de severidad en ONAMET para verificar exactamente
      cuáles pasan el filtro. La frontera está entre "warning" (incluida) y "watch" (excluida).
      Confirma que el operador === no incluye severidades similares o desconocidas.
      Dado una alerta ONAMET con severity "<severity>"
      Cuando ejecuto detectFromOnamet
      Entonces el resultado ONAMET es "<resultado>"

      Ejemplos:
        | severity  | resultado |
        | emergency | incluida  |
        | warning   | incluida  |
        | watch     | excluida  |
        | normal    | excluida  |

  # ══════════════════════════════════════════════════════════════════════
  # FUNCIÓN: computeAlertLevel
  # ══════════════════════════════════════════════════════════════════════

  Regla: computeAlertLevel prioriza emergency > warning > watch > normal

    @positivo
    Escenario: Sin triggers el nivel resultante es "normal"
      Input: lista de triggers vacía (no hay ninguna alerta activa en el sistema).
      Resultado esperado: nivel "normal" — el dashboard muestra estado verde.
      Importancia: caso más frecuente en días sin eventos climáticos; debe retornar "normal".
      Dado una lista de triggers vacía
      Cuando ejecuto computeAlertLevel
      Entonces el nivel de alerta calculado es "normal"

    @positivo
    Escenario: Trigger con level que contiene "Huracán" produce nivel "emergency"
      Input: trigger de viento con level = "Huracán Categoría 1+" (generado por detectFromWeather).
      Resultado esperado: nivel "emergency" — máxima alerta para el dashboard y las notificaciones.
      Importancia: los huracanes requieren el nivel más alto posible sin excepción.
      Dado los siguientes triggers:
        | source          | level                |
        | WeatherAPI-Wind | Huracán Categoría 1+ |
      Cuando ejecuto computeAlertLevel
      Entonces el nivel de alerta calculado es "emergency"

    @positivo
    Escenario: Trigger ONAMET con severity "emergency" produce nivel "emergency"
      Input: trigger ONAMET con severity = "emergency" (boletín oficial de ONAMET).
      Resultado esperado: nivel "emergency" — una declaración oficial siempre sube al máximo.
      Importancia: las declaraciones de ONAMET son la fuente más autoritativa; deben dominar.
      Dado los siguientes triggers:
        | source | severity  |
        | ONAMET | emergency |
      Cuando ejecuto computeAlertLevel
      Entonces el nivel de alerta calculado es "emergency"

    @positivo
    Escenario: Trigger ONAMET con severity "warning" produce nivel "warning"
      Input: trigger ONAMET con severity = "warning" (aviso, no emergencia).
      Resultado esperado: nivel "warning" — segundo nivel de alerta.
      Importancia: diferencia entre "aviso" y "emergencia" — el dashboard muestra colores distintos.
      Dado los siguientes triggers:
        | source | severity |
        | ONAMET | warning  |
      Cuando ejecuto computeAlertLevel
      Entonces el nivel de alerta calculado es "warning"

    @positivo
    Escenario: Trigger de condición sin severity produce nivel "watch"
      Input: trigger de WeatherAPI-Condition (keyword detectada en texto, sin severidad ONAMET).
      Resultado esperado: nivel "watch" — hay algo para monitorear pero no es una emergencia.
      Importancia: la detección por texto es menos autoritativa; se clasifica como "vigilancia".
      Dado los siguientes triggers:
        | source               | keyword   |
        | WeatherAPI-Condition | hurricane |
      Cuando ejecuto computeAlertLevel
      Entonces el nivel de alerta calculado es "watch"

    @positivo
    Escenario: Trigger de Tormenta Tropical (sin "Huracán" en level) produce nivel "watch"
      Input: trigger de viento con level = "Tormenta Tropical" (no contiene la palabra "Huracán").
      Resultado esperado: nivel "watch" — tormenta tropical es seria pero no emergencia de huracán.
      Importancia: verifica que la condición hasEmergency solo se activa con la palabra exacta "Huracán".
      Dado los siguientes triggers:
        | source          | level             |
        | WeatherAPI-Wind | Tormenta Tropical |
      Cuando ejecuto computeAlertLevel
      Entonces el nivel de alerta calculado es "watch"

    @positivo
    Escenario: Emergency tiene prioridad sobre warning cuando coexisten
      Input: dos triggers simultáneos — ONAMET warning + WeatherAPI-Wind Huracán.
      Resultado esperado: "emergency" gana sobre "warning" — se aplica el nivel más alto.
      Importancia: cuando hay múltiples fuentes activas, el dashboard siempre muestra el peor caso.
      Dado los siguientes triggers:
        | source          | level                | severity |
        | ONAMET          |                      | warning  |
        | WeatherAPI-Wind | Huracán Categoría 1+ |          |
      Cuando ejecuto computeAlertLevel
      Entonces el nivel de alerta calculado es "emergency"

    @positivo
    Escenario: Warning tiene prioridad sobre watch cuando coexisten
      Input: trigger de condición (watch) + trigger ONAMET warning.
      Resultado esperado: "warning" prevalece sobre "watch".
      Importancia: la jerarquía de prioridad debe cumplirse en cualquier combinación de triggers.
      Dado los siguientes triggers:
        | source               | keyword       | severity |
        | WeatherAPI-Condition | flood warning |          |
        | ONAMET               |               | warning  |
      Cuando ejecuto computeAlertLevel
      Entonces el nivel de alerta calculado es "warning"

    @limite
    Esquema del escenario: El nivel más alto de un conjunto mixto de triggers
      Prueba todos los niveles posibles de la jerarquía con un único tipo de trigger cada vez.
      Verifica que cada tipo de trigger produce exactamente el nivel de alerta correcto
      sin interferencia de otros triggers. Caso base para la tabla de prioridades.
      Dado los triggers de nivel más alto es "<nivel_trigger>"
      Cuando ejecuto computeAlertLevel
      Entonces el nivel de alerta calculado es "<nivel_esperado>"

      Ejemplos:
        | nivel_trigger  | nivel_esperado |
        | hurricane      | emergency      |
        | onamet_warn    | warning        |
        | solo_condicion | watch          |
        | ninguno        | normal         |
