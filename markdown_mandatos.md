Actúa como mi coach de desarrollo de software y experto en ciberseguridad. Vamos a trabajar en una práctica guiada para asegurar una ruta expuesta en mi aplicación. 

Por favor, mantente en **PLAN MODE** (modo planificación) en esta primera fase. No escribas código final ni modifiques nada hasta que revisemos y aprobemos el plan.

---

### Contexto del ejercicio
Tengo un endpoint/ruta en mi aplicación que actualmente responde sin pedir identidad/autenticación (o voy a indicarte cuál es/crear una de práctica).

---

### Pasos a ejecutar (siguiendo tus instrucciones como Coach):

1. **Auditoría de la ruta (Plan Mode):**
   - Audita el endpoint que te indicaré a continuación.
   - Propón un plan paso a paso **ANTES de tocar cualquier línea de código**.
   - Asegúrate de que el plan respete mis reglas de negocio actuales y adviérteme explícitamente si alguna propuesta podría romper la funcionalidad existente.

2. **Autenticación y Autorización:**
   - Define cómo agregar un *guard* y la validación de tokens en este endpoint usando el mecanismo estándar de mi framework/stack.
   - El objetivo es asegurar que **solo usuarios válidos y autorizados** puedan interactuar con él.

3. **Pruebas de Integración:**
   - Propón los casos de prueba de integración necesarios para confirmar que:
     a) Sin token o con token inválido devuelve un estado HTTP `401 Unauthorized`.
     b) Un usuario autorizado sí puede acceder correctamente.
   - Las pruebas no deben modificar ni romper las pruebas existentes que ya protegen el negocio.

4. **Reto Extra (Investigación / Análisis):**
   - Ayúdame a analizar el escenario "Sign out all devices": ¿sigue siendo válido un token JWT/sesión tras cambiar la contraseña? ¿Cómo se implementa la revocación activa de tokens en todos los dispositivos dentro de mi esquema actual?

---

### Mis datos del proyecto:
- **Framework / Stack técnico:** [Escribe aquí tu framework, ej. Node.js/Express, NestJS, Next.js, etc.]
- **Mecanismo de autenticación usado:** [Ej. JWT, NextAuth, Firebase Auth, etc.]
- **Endpoint a proteger / código actual de la ruta:** 
```[Pega aquí tu código o la ruta expuesta]```

Por favor, empieza confirmando que entiendes el rol y dame la auditoría inicial y el plan propuesto antes de proceder a escribir código.