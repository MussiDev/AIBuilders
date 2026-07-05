# PRD — App de Finanzas Personales + Gastos Compartidos (2 en 1)

| Campo | Valor |
|---|---|
| Versión | 1.1 |
| Fecha | 2026-06-23 |
| Autor | Joako (jmussi@mutualamr.org.ar) |
| Estado | Borrador |

---

## 1. Contexto

Las personas que gestionan sus finanzas personales suelen usar una herramienta para su presupuesto individual y otra distinta para dividir gastos con su pareja, roommates o grupos de viaje. Esto genera doble carga de datos, inconsistencias y falta de una visión unificada de "cuánto gasté yo realmente".

Esta webapp resuelve ambos problemas en un solo producto: permite a una persona llevar el control de sus **finanzas personales** (ingresos, egresos, presupuestos, saldos) y, a la vez, administrar **gastos compartidos** dentro de grupos, calculando automáticamente quién le debe a quién. La clave diferencial es que un gasto compartido impacta automáticamente en las finanzas personales del usuario por la **parte que le corresponde**, evitando la doble carga.

**Público objetivo:** individuos de 20 a 45 años con conocimientos digitales básicos que comparten gastos recurrentes (convivientes, parejas, grupos de amigos/viajes).

**Alcance del MVP:** webapp responsive (mobile-first), un solo idioma (español) y una sola moneda por usuario en la primera versión.

---

## 2. Objetivos

- **O1.** Ofrecer una vista unificada de las finanzas personales del usuario (ingresos, egresos y saldo) que incluya su parte de los gastos compartidos.
- **O2.** Permitir crear grupos de gastos compartidos y dividir gastos entre miembros con cálculo automático de deudas (balances quién-debe-a-quién).
- **O3.** Eliminar la doble carga: un gasto compartido genera automáticamente el movimiento personal correspondiente a la parte del usuario.
- **O4.** Lograr que un usuario nuevo registre su primer gasto (personal o compartido) en menos de 2 minutos desde el alta.
- **O5.** Entregar reportes simples (por categoría y por período) que ayuden a entender en qué se gasta.

**Métricas de éxito (post-lanzamiento):**
- ≥ 60% de usuarios activos registran al menos un gasto por semana.
- ≥ 40% de usuarios crean o se unen a al menos un grupo compartido.
- Tiempo medio de alta hasta primer gasto < 2 minutos.

---

## 3. Requisitos Funcionales (RF)

Cada RF es atómico y verificable.

### Cuenta y autenticación
- **RF-01.** El sistema debe permitir registrar una cuenta con email y contraseña.
- **RF-02.** El sistema debe validar que el email tenga formato válido al registrarse.
- **RF-03.** El sistema debe impedir el registro con un email ya existente.
- **RF-04.** El sistema debe permitir iniciar sesión con email y contraseña.
- **RF-05.** El sistema debe permitir cerrar sesión.
- **RF-06.** El sistema debe permitir recuperar la contraseña mediante un enlace enviado por email.
- **RF-07.** El sistema debe permitir al usuario definir su moneda por defecto al crear la cuenta.

### Finanzas personales
- **RF-08.** El sistema debe permitir registrar un movimiento de tipo ingreso con monto, fecha y categoría.
- **RF-09.** El sistema debe permitir registrar un movimiento de tipo egreso con monto, fecha y categoría.
- **RF-10.** El sistema debe permitir editar un movimiento personal existente.
- **RF-11.** El sistema debe permitir eliminar un movimiento personal existente.
- **RF-12.** El sistema debe permitir adjuntar una nota de texto opcional a cada movimiento.
- **RF-13.** El sistema debe calcular y mostrar el saldo personal como la suma de ingresos menos la suma de egresos.
- **RF-14.** El sistema debe permitir gestionar (crear, editar, eliminar) categorías de movimientos.
- **RF-15.** El sistema debe ofrecer un conjunto de categorías predefinidas al crear la cuenta.
- **RF-16.** El sistema debe permitir filtrar la lista de movimientos por rango de fechas.
- **RF-17.** El sistema debe permitir filtrar la lista de movimientos por categoría.

### Presupuestos
- **RF-18.** El sistema debe permitir definir un presupuesto mensual por categoría.
- **RF-19.** El sistema debe mostrar el porcentaje consumido de cada presupuesto en el mes en curso.
- **RF-20.** El sistema debe indicar visualmente cuando una categoría supera su presupuesto mensual.

### Grupos y gastos compartidos
- **RF-21.** El sistema debe permitir crear un grupo de gastos compartidos con un nombre.
- **RF-22.** El sistema debe permitir invitar a otra persona a un grupo mediante un enlace de invitación.
- **RF-23.** El sistema debe permitir a un usuario unirse a un grupo mediante un enlace de invitación válido.
- **RF-24.** El sistema debe permitir registrar un gasto compartido indicando monto, pagador, fecha y categoría.
- **RF-25.** El sistema debe permitir dividir un gasto compartido en partes iguales entre los miembros seleccionados.
- **RF-26.** El sistema debe permitir dividir un gasto compartido en montos exactos por miembro.
- **RF-27.** El sistema debe permitir dividir un gasto compartido por porcentajes asignados a cada miembro.
- **RF-28.** El sistema debe validar que la suma de las partes de un gasto compartido sea igual al monto total del gasto.
- **RF-29.** El sistema debe calcular el balance neto de cada miembro dentro del grupo (cuánto debe o le deben).
- **RF-30.** El sistema debe mostrar una liquidación sugerida (quién paga a quién y cuánto) que salde las deudas con la menor cantidad de transferencias.
- **RF-31.** El sistema debe permitir registrar un pago de saldo (settlement) entre dos miembros del grupo.
- **RF-32.** El sistema debe permitir editar un gasto compartido existente.
- **RF-33.** El sistema debe permitir eliminar un gasto compartido existente.
- **RF-34.** El sistema debe permitir salir de un grupo.

### Integración personal ↔ compartido
- **RF-35.** El sistema debe generar automáticamente un movimiento personal de egreso por la parte que le corresponde al usuario en cada gasto compartido.
- **RF-36.** El sistema debe actualizar el movimiento personal asociado cuando se edita la parte del usuario en el gasto compartido.
- **RF-37.** El sistema debe eliminar el movimiento personal asociado cuando se elimina el gasto compartido.

### Reportes y panel
- **RF-38.** El sistema debe mostrar un panel inicial con el saldo personal y el total adeudado/por cobrar en grupos.
- **RF-39.** El sistema debe mostrar un reporte de egresos agrupados por categoría para un período seleccionado.
- **RF-40.** El sistema debe permitir exportar los movimientos personales a un archivo CSV.

### Validaciones, errores y paginación (transversal)
- **RF-41.** El sistema debe rechazar el guardado de un movimiento o gasto cuyo monto sea menor o igual a cero.
- **RF-42.** El sistema debe impedir el guardado de un movimiento o gasto si falta algún campo obligatorio (monto, fecha o categoría).
- **RF-43.** El sistema debe rechazar montos con más de dos decimales en la entrada de datos.
- **RF-44.** El sistema debe paginar las listas de movimientos personales y de gastos de grupo mostrando un máximo de 50 ítems por página.
- **RF-45.** El sistema debe mostrar un mensaje de error legible para el usuario cuando una operación es rechazada por validación.
- **RF-46.** El sistema debe solicitar confirmación explícita al usuario antes de eliminar un movimiento, un gasto compartido o un grupo.
- **RF-47.** El sistema debe informar el fallo y conservar los datos ya ingresados por el usuario cuando una operación no se completa por error de red o de servidor.
- **RF-48.** El sistema debe rechazar un enlace de invitación inválido o expirado e informarlo al usuario.

---

## 4. Requisitos No Funcionales (RNF)

- **RNF-01. Rendimiento:** cada pantalla principal debe cargar su contenido en menos de 2 segundos con conexión de 10 Mbps.
- **RNF-02. Rendimiento:** el cálculo de balances de un grupo de hasta 20 miembros y 1.000 gastos debe completarse en menos de 1 segundo.
- **RNF-03. Disponibilidad:** el servicio debe tener una disponibilidad mensual ≥ 99,5%.
- **RNF-04. Seguridad:** las contraseñas deben almacenarse con hashing fuerte (bcrypt, scrypt o Argon2), nunca en texto plano.
- **RNF-05. Seguridad:** toda la comunicación cliente-servidor debe realizarse sobre HTTPS/TLS 1.2 o superior.
- **RNF-06. Seguridad:** un usuario solo debe poder acceder a datos de grupos de los que es miembro.
- **RNF-07. Privacidad:** el sistema debe cumplir con la normativa argentina de protección de datos personales (Ley 25.326).
- **RNF-08. Usabilidad:** la interfaz debe ser responsive y usable en pantallas desde 320px de ancho (mobile-first).
- **RNF-09. Accesibilidad:** la interfaz debe cumplir con WCAG 2.1 nivel AA en sus pantallas principales.
- **RNF-10. Compatibilidad:** la app debe funcionar en las dos últimas versiones estables de Chrome, Firefox, Safari y Edge.
- **RNF-11. Integridad:** todos los montos deben manejarse con aritmética decimal exacta, sin errores de redondeo por coma flotante.
- **RNF-12. Escalabilidad:** la arquitectura debe soportar al menos 10.000 usuarios registrados sin rediseño.
- **RNF-13. Mantenibilidad:** el código debe contar con cobertura de tests automatizados ≥ 70% en la lógica de cálculo de balances.
- **RNF-14. Respaldo:** los datos deben respaldarse de forma automática al menos una vez al día con retención mínima de 7 días.
- **RNF-15. Localización:** todos los textos de interfaz deben estar en español (es-AR) en el MVP.
- **RNF-16. Observabilidad:** los errores de servidor (5xx) deben registrarse con trazabilidad para diagnóstico.

---

## 5. Criterios de Aceptación (AC)

Cada AC está expresado en formato **Dado / Cuando / Entonces** y es binario (se cumple o no). Hay al menos un AC por cada RF (ver tabla de trazabilidad en §5.1).

### Cuenta y autenticación
- **AC-01 (RF-01, RF-02):** Dado un visitante en la pantalla de registro, Cuando ingresa un email con formato válido y una contraseña, y confirma, Entonces el sistema crea la cuenta y lo redirige al panel inicial.
- **AC-02 (RF-02):** Dado un visitante en la pantalla de registro, Cuando ingresa un email sin formato válido (ej. "juan@"), Entonces el sistema rechaza el registro e informa el error de formato.
- **AC-03 (RF-03):** Dado un email ya registrado, Cuando un visitante intenta registrarse con ese mismo email, Entonces el sistema rechaza el registro y muestra un mensaje de error.
- **AC-04 (RF-04):** Dado un usuario con cuenta existente, Cuando ingresa email y contraseña correctos, Entonces el sistema inicia sesión y muestra el panel inicial.
- **AC-05 (RF-04):** Dado un usuario con cuenta existente, Cuando ingresa una contraseña incorrecta, Entonces el sistema rechaza el acceso y no inicia sesión.
- **AC-06 (RF-05):** Dado un usuario con sesión iniciada, Cuando selecciona cerrar sesión, Entonces el sistema termina la sesión y lo redirige a la pantalla de inicio de sesión.
- **AC-07 (RF-06):** Dado un usuario que olvidó su contraseña, Cuando solicita recuperarla con su email registrado, Entonces el sistema envía un enlace de recuperación a ese email.
- **AC-08 (RF-07):** Dado un visitante creando una cuenta, Cuando selecciona una moneda por defecto y confirma, Entonces los montos de su cuenta se muestran en esa moneda.

### Finanzas personales
- **AC-09 (RF-08):** Dado un usuario autenticado, Cuando registra un ingreso con monto, fecha y categoría válidos, Entonces el movimiento aparece en la lista y el saldo personal aumenta en ese monto.
- **AC-10 (RF-09, RF-13):** Dado un usuario autenticado, Cuando registra un egreso con monto, fecha y categoría válidos, Entonces el movimiento aparece en la lista y el saldo personal disminuye en ese monto.
- **AC-11 (RF-10):** Dado un movimiento personal existente de $500, Cuando el usuario edita su monto a $800 y guarda, Entonces la lista muestra $800 y el saldo personal se recalcula con el nuevo monto.
- **AC-12 (RF-11, RF-46):** Dado un movimiento personal existente, Cuando el usuario lo elimina y confirma, Entonces el movimiento desaparece de la lista y el saldo se recalcula sin ese monto.
- **AC-13 (RF-12):** Dado un usuario registrando un movimiento, Cuando agrega una nota de texto y guarda, Entonces la nota queda visible al consultar el detalle del movimiento.
- **AC-14 (RF-14):** Dado un usuario autenticado, Cuando crea una categoría nueva con un nombre, Entonces la categoría queda disponible para asignar a movimientos.
- **AC-15 (RF-15):** Dado un usuario que acaba de crear su cuenta, Cuando abre el formulario de un movimiento, Entonces el sistema ofrece un conjunto de categorías predefinidas.
- **AC-16 (RF-16):** Dado un conjunto de movimientos en distintas fechas, Cuando el usuario aplica un filtro por rango de fechas, Entonces la lista muestra únicamente los movimientos dentro de ese rango.
- **AC-17 (RF-17):** Dado un conjunto de movimientos en varias categorías, Cuando el usuario filtra por una categoría, Entonces la lista muestra únicamente los movimientos de esa categoría.

### Presupuestos
- **AC-18 (RF-18, RF-19):** Dado un presupuesto mensual de $10.000 en una categoría, Cuando el usuario lleva $7.500 gastados en el mes, Entonces el sistema muestra 75% de consumo en esa categoría.
- **AC-19 (RF-20):** Dado un presupuesto mensual de $10.000 en una categoría, Cuando el gasto del mes alcanza $10.001, Entonces el sistema marca visualmente la categoría como excedida.

### Grupos y gastos compartidos
- **AC-20 (RF-21):** Dado un usuario autenticado, Cuando crea un grupo con un nombre, Entonces el grupo aparece en su lista de grupos y él figura como miembro.
- **AC-21 (RF-22, RF-23):** Dado un enlace de invitación válido, Cuando otro usuario autenticado lo abre y acepta, Entonces queda agregado como miembro del grupo.
- **AC-22 (RF-24):** Dado un miembro de un grupo, Cuando registra un gasto compartido con monto, pagador, fecha y categoría válidos, Entonces el gasto aparece en la lista del grupo.
- **AC-23 (RF-25):** Dado un gasto compartido de $1.000 dividido en partes iguales entre 4 miembros, Cuando se guarda, Entonces a cada miembro se le asigna una parte de $250.
- **AC-24 (RF-26):** Dado un gasto compartido de $1.000 con división por montos exactos de $400 y $600, Cuando se guarda, Entonces a cada miembro se le asigna exactamente su monto indicado.
- **AC-25 (RF-27):** Dado un gasto compartido dividido por porcentajes, Cuando los porcentajes asignados no suman 100%, Entonces el sistema rechaza el guardado e informa el error.
- **AC-26 (RF-28):** Dado un gasto compartido de $1.000 con división por montos exactos, Cuando la suma de las partes ingresadas es $900, Entonces el sistema rechaza el guardado e informa que las partes no suman el total.
- **AC-27 (RF-29):** Dado un grupo donde el usuario A pagó $1.000 dividido en partes iguales entre A y B, Cuando se calcula el balance, Entonces B debe $500 a A.
- **AC-28 (RF-30):** Dado un grupo con deudas cruzadas entre 3 miembros, Cuando el usuario abre la liquidación sugerida, Entonces el sistema muestra el conjunto de pagos que salda todas las deudas con la menor cantidad de transferencias posible.
- **AC-29 (RF-31):** Dado que B debe $500 a A, Cuando se registra un pago de $500 de B a A, Entonces el balance entre A y B queda en $0.
- **AC-30 (RF-32):** Dado un gasto compartido existente de $1.000, Cuando un miembro edita su monto a $1.200 y guarda, Entonces los balances del grupo se recalculan con el nuevo monto.
- **AC-31 (RF-33, RF-46):** Dado un gasto compartido existente, Cuando un miembro lo elimina y confirma, Entonces el gasto desaparece de la lista del grupo y los balances se recalculan sin él.
- **AC-32 (RF-34):** Dado un usuario miembro de un grupo con balance en $0, Cuando elige salir del grupo, Entonces deja de figurar como miembro y el grupo ya no aparece en su lista.

### Integración personal ↔ compartido
- **AC-33 (RF-35):** Dado un gasto compartido de $1.000 dividido en partes iguales entre el usuario y otro miembro, Cuando se guarda, Entonces se crea automáticamente un egreso personal de $500 en las finanzas del usuario.
- **AC-34 (RF-36):** Dado un gasto compartido con egreso personal asociado de $500, Cuando se edita la parte del usuario a $300, Entonces el egreso personal asociado se actualiza a $300.
- **AC-35 (RF-37):** Dado un gasto compartido con su egreso personal asociado, Cuando se elimina el gasto compartido, Entonces el egreso personal asociado también se elimina y el saldo personal se recalcula.

### Reportes y panel
- **AC-36 (RF-38):** Dado un usuario con movimientos personales y grupos, Cuando abre el panel inicial, Entonces el sistema muestra su saldo personal y el total adeudado/por cobrar en grupos.
- **AC-37 (RF-39):** Dado un período con egresos en varias categorías, Cuando el usuario abre el reporte por categoría de ese período, Entonces el sistema muestra el total de egresos agrupado por cada categoría.
- **AC-38 (RF-40):** Dado un usuario con movimientos personales, Cuando solicita exportar a CSV, Entonces el sistema genera un archivo descargable con todos sus movimientos.

### Validaciones, errores y paginación
- **AC-39 (RF-41):** Dado un usuario registrando un movimiento, Cuando ingresa un monto de $0 o negativo y guarda, Entonces el sistema rechaza el guardado e informa que el monto debe ser mayor a cero.
- **AC-40 (RF-42):** Dado un usuario registrando un movimiento, Cuando intenta guardar sin completar la categoría, Entonces el sistema rechaza el guardado e indica el campo obligatorio faltante.
- **AC-41 (RF-43):** Dado un usuario ingresando un monto, Cuando escribe más de dos decimales (ej. 10,999), Entonces el sistema rechaza el valor e informa el formato admitido.
- **AC-42 (RF-44):** Dado un usuario con 120 movimientos, Cuando abre la lista de movimientos, Entonces el sistema muestra como máximo 50 ítems por página y permite navegar a las siguientes.
- **AC-43 (RF-45):** Dado un usuario que intenta guardar un dato inválido, Cuando la operación es rechazada, Entonces el sistema muestra un mensaje de error legible (no un código técnico).
- **AC-44 (RF-46):** Dado un usuario en el formulario de eliminación, Cuando elige eliminar un grupo, Entonces el sistema solicita una confirmación explícita antes de ejecutar la eliminación.
- **AC-45 (RF-47):** Dado un usuario completando un formulario, Cuando ocurre un error de red al guardar, Entonces el sistema informa el fallo y conserva los datos ya ingresados en el formulario.
- **AC-46 (RF-48):** Dado un enlace de invitación expirado, Cuando un usuario intenta usarlo, Entonces el sistema rechaza el acceso al grupo e informa que la invitación no es válida.

### No funcionales verificables
- **AC-47 (RNF-06):** Dado un usuario que no es miembro de un grupo, Cuando intenta acceder a la URL de ese grupo, Entonces el sistema deniega el acceso.
- **AC-48 (RNF-08):** Dado un dispositivo con pantalla de 320px de ancho, Cuando el usuario abre cualquier pantalla principal, Entonces el contenido se muestra sin scroll horizontal y los controles son operables.

### 5.1 Trazabilidad RF ↔ AC

Todos los RF (RF-01 a RF-48) tienen al menos un AC asociado:

| RF | AC | RF | AC | RF | AC |
|---|---|---|---|---|---|
| RF-01 | AC-01 | RF-17 | AC-17 | RF-33 | AC-31 |
| RF-02 | AC-01, AC-02 | RF-18 | AC-18 | RF-34 | AC-32 |
| RF-03 | AC-03 | RF-19 | AC-18 | RF-35 | AC-33 |
| RF-04 | AC-04, AC-05 | RF-20 | AC-19 | RF-36 | AC-34 |
| RF-05 | AC-06 | RF-21 | AC-20 | RF-37 | AC-35 |
| RF-06 | AC-07 | RF-22 | AC-21 | RF-38 | AC-36 |
| RF-07 | AC-08 | RF-23 | AC-21 | RF-39 | AC-37 |
| RF-08 | AC-09 | RF-24 | AC-22 | RF-40 | AC-38 |
| RF-09 | AC-10 | RF-25 | AC-23 | RF-41 | AC-39 |
| RF-10 | AC-11 | RF-26 | AC-24 | RF-42 | AC-40 |
| RF-11 | AC-12 | RF-27 | AC-25 | RF-43 | AC-41 |
| RF-12 | AC-13 | RF-28 | AC-26 | RF-44 | AC-42 |
| RF-13 | AC-10 | RF-29 | AC-27 | RF-45 | AC-43 |
| RF-14 | AC-14 | RF-30 | AC-28 | RF-46 | AC-44 |
| RF-15 | AC-15 | RF-31 | AC-29 | RF-47 | AC-45 |
| RF-16 | AC-16 | RF-32 | AC-30 | RF-48 | AC-46 |

---

## 6. Fuera de Alcance (MVP)

- Soporte multi-moneda y conversión de divisas dentro de un mismo grupo o cuenta.
- Integración con bancos, tarjetas o APIs de open banking (importación automática de transacciones).
- Aplicaciones móviles nativas (iOS / Android); el MVP es solo webapp responsive.
- Pagos reales o liquidaciones a través de pasarelas (MercadoPago, transferencias automáticas).
- Gastos recurrentes automáticos y recordatorios programados.
- Reportes avanzados, proyecciones, metas de ahorro y análisis predictivo.
- Roles y permisos granulares dentro de los grupos (admin vs. miembro con distintos privilegios).
- Modo offline y sincronización.
- Internacionalización a otros idiomas.
- Adjuntar imágenes/fotos de comprobantes (solo notas de texto en el MVP).

---

## 7. Riesgos

| ID | Riesgo | Impacto | Prob. | Mitigación |
|---|---|---|---|---|
| R1 | Errores de redondeo en la división de gastos generan balances que no cuadran | Alto | Media | Usar aritmética decimal exacta (RNF-11) y asignar los centavos residuales de forma determinística a un miembro. |
| R2 | El algoritmo de liquidación sugerida es complejo y puede arrojar resultados subóptimos | Medio | Media | Acotar a heurística "greedy" documentada; cubrir con tests (RNF-13). |
| R3 | Baja adopción por fricción en el alta o en invitar a otros miembros | Alto | Media | Onboarding < 2 min (O4) e invitación por enlace simple (RF-22). |
| R4 | Inconsistencia entre gasto compartido y movimiento personal asociado tras ediciones | Alto | Media | Transacciones atómicas y tests de integración para RF-35/36/37. |
| R5 | Filtración de datos financieros sensibles | Alto | Baja | HTTPS, hashing de contraseñas, control de acceso por grupo (RNF-04/05/06). |
| R6 | Conflictos de edición concurrente sobre el mismo gasto de grupo | Medio | Media | Bloqueo optimista por versión y mensaje de conflicto al guardar. |
| R7 | Crecimiento de datos degrada el cálculo de balances | Medio | Baja | Objetivo de rendimiento definido (RNF-02) y pruebas de carga. |
| R8 | Ambigüedad legal sobre el tratamiento de datos personales | Medio | Baja | Cumplimiento Ley 25.326 (RNF-07) y política de privacidad clara. |

---

## 8. Dependencias

- **Servicio de email transaccional** para verificación de cuenta y recuperación de contraseña (RF-06).
- **Proveedor de hosting / infraestructura cloud** con soporte HTTPS y respaldos automáticos (RNF-03, RNF-05, RNF-14).
- **Motor de base de datos** con soporte de tipos decimales exactos y transacciones (RNF-11, RF-35/36/37).
- **Mecanismo de autenticación** (propio o proveedor de identidad) para gestión de sesiones y tokens.
- **Librería/algoritmo de minimización de transferencias** para la liquidación sugerida (RF-30).
- **Definición de moneda y formato regional** (es-AR) para presentación de montos (RNF-15).
- Disponibilidad del equipo de diseño para los flujos de onboarding y panel principal (O4, RF-38).