# ACPI — Asistente de Cruce Peatonal para Invidentes

### Guía para conocer el sistema

> **En una frase:** ACPI es una pulsera que vibra para avisarle a una persona ciega o con baja visión si está bien parada frente al cruce y si ya puede cruzar la calle.

---

## 1. El problema que queremos resolver

Cruzar una calle parece un gesto automático. Para una persona con discapacidad visual no lo es. En un cruce cualquiera hay que resolver, sin ver, tres preguntas al mismo tiempo:

1. **¿Estoy mirando hacia donde debo cruzar?** Basta con quedar unos grados torcido al bajar del andén para terminar caminando en diagonal hacia el centro de la intersección.
2. **¿Ya puedo cruzar?** No todos los semáforos tienen sonido. Y los que lo tienen a veces están dañados, apagados de noche o tapados por el ruido del tráfico.
3. **¿Cuánto tiempo me queda?** Saber que la luz cambió no es lo mismo que saber cuántos segundos faltan.

Hoy esas respuestas dependen del oído, de la memoria del barrio o de que alguien se ofrezca a ayudar. ACPI las convierte en algo que se **siente en la muñeca**, de forma privada, inmediata y sin depender de nadie más.

---

## 2. Cómo funciona, en una idea

El sistema tiene **dos aparatos que se hablan entre sí**:

- Uno se queda **en el poste del semáforo**. Sabe hacia dónde apunta el cruce y en qué momento del ciclo está la luz.
- El otro va **en la muñeca de la persona**. Sabe hacia dónde está mirando ella.

El de la pulsera compara las dos direcciones. Si coinciden —si la persona está enfrentada al cruce— avisa con una vibración. Si no, avisa con otra distinta, que indica hacia qué lado girar.

```
   🚦 POSTE                      ⌚ PULSERA                 📱 CELULAR            ☁️ PANEL
"el cruce va hacia allá"  →  "tú estás mirando acá"  →  voz, mapa y registro  →  estadísticas
"faltan 12 segundos"         vibra para corregir        de cada cruce            de la ciudad
```

Todo lo importante ocurre **entre el poste y la pulsera**. El celular y el panel de datos son acompañantes: si el celular se queda sin batería o no hay señal de internet, **la pulsera sigue funcionando igual**.

---

## 3. Los componentes, uno por uno

### 3.1 🚦 La baliza del semáforo

**Qué es:** una cajita que se instala fija en el poste del semáforo o en la esquina del cruce.

**Qué hace:** tiene una brújula adentro, así que apenas se instala ya sabe hacia dónde apunta el paso peatonal que vigila. Además lleva la cuenta del ciclo del semáforo: cuánto lleva la luz actual y cuánto le falta para cambiar.

**Qué anuncia:** dos veces por segundo lanza al aire un mensaje muy corto, como un faro. Dice tres cosas: *"el cruce va en esta dirección"*, *"ahora mismo se puede / no se puede pasar"* y *"quedan tantos segundos"*.

**Detalles que suelen preguntar en la feria:**

- **No necesita internet.** Habla por radio directamente con las pulseras que estén cerca. No pasa por wifi, ni por una compañía de celular, ni por un servidor.
- **No sabe quién está escuchando.** Emite su mensaje al aire sin dirigirlo a nadie: no registra pulseras, no guarda datos de personas, no las cuenta. Es como un letrero, no como una cámara.
- **Un mismo cruce puede tener varias balizas**, una por cada sentido de paso; cada una lleva su propio identificador para no confundirse con la de al lado.
- En el prototipo que se muestra en la exposición, dos LEDs (verde y rojo) simulan el semáforo real para que se pueda ver el ciclo completo en pocos segundos.

---

### 3.2 ⌚ La pulsera

Es el corazón del sistema y la única pieza que la persona usuaria lleva encima. Por dentro tiene cinco partes que vale la pena mirar por separado.

#### a) La brújula

Un sensor magnético que, igual que la aguja de una brújula de excursionista, sabe hacia dónde apunta la muñeca respecto al norte.

Hay un truco importante: una brújula común se equivoca cuando se inclina, y una muñeca **nunca** está perfectamente horizontal. Por eso la pulsera lleva también un sensor de movimiento que le dice en qué ángulo está inclinado el brazo, y corrige la lectura con esa información. El resultado es una dirección confiable aunque la persona lleve el brazo caído, doblado o en movimiento.

#### b) El sensor de movimiento

Detecta la inclinación y los golpes del brazo. Cumple dos funciones:

- **Ayuda a la brújula** a corregirse, como se explicó arriba.
- **Filtra los gestos naturales.** Si alguien saluda, se rasca la cabeza o mueve el brazo al caminar, la dirección cambia bruscamente durante un instante. El sistema reconoce esos movimientos y los ignora, en vez de vibrar en falso. Solo confía en lecturas estables.

Esta es una de las decisiones de diseño de las que estamos más orgullosos: **una alerta equivocada es peor que ninguna alerta**, porque enseña a desconfiar del dispositivo.

#### c) Los dos motores de vibración

Dos motorcitos del tamaño de una moneda, uno a cada lado de la pulsera. Son la voz del sistema. El lenguaje es deliberadamente simple, porque tiene que entenderse en medio del ruido de una avenida y sin pensar:

| Lo que se siente | Lo que significa |
| --- | --- |
| **Dos pulsos cortos** | "Estás bien orientado. El cruce está justo al frente." |
| **Vibración del lado derecho** | "Gira un poco hacia la derecha." |
| **Vibración del lado izquierdo** | "Gira un poco hacia la izquierda." |
| **Vibración rápida e insistente en ambos** | "Alerta de pánico activada." |

La idea de fondo: **el lado que vibra es el lado hacia el que hay que girar**. No hay que memorizar códigos ni contar pulsos.

#### d) El botón de pánico

Un botón físico, fácil de encontrar al tacto. Al presionarlo, la pulsera interrumpe todo lo demás, vibra de forma inconfundible y le avisa de inmediato al celular, que puede registrar el evento y alertar a un contacto de confianza.

Está pensado para los momentos en que algo sale mal a mitad de cuadra: desorientación, un vehículo que no frenó, una obra que bloqueó el paso.

#### e) La batería y el modo de ahorro

La pulsera pasa la mayor parte del día sin hacer nada útil: no hay un semáforo en cada esquina. Por eso, cuando no detecta ninguna baliza cerca ni está conectada al celular, **se duerme**: apaga sus radios y su procesador y queda esperando.

Se despierta sola en cuanto una baliza aparece en el rango o la persona interactúa con ella. Así una carga rinde para muchos cruces en vez de gastarse escuchando un silencio.

Mientras está activa, la pulsera hace su ciclo completo —leer sensores, comparar direcciones, decidir si vibra— **dos veces por segundo**. Es lo bastante rápido para reaccionar a un giro del cuerpo y lo bastante pausado para no consumir energía de más.

---

### 3.3 📡 La conversación entre el poste y la pulsera

Merece su propio apartado porque suele ser la parte que más curiosidad genera.

El poste y la pulsera se comunican por **radio directa**, de aparato a aparato, sin intermediarios. No hay wifi, no hay red celular, no hay nube en el medio. Es el equivalente a dos radios de excursión hablando en el mismo canal.

Esto tiene tres consecuencias prácticas:

- **Es instantáneo.** El mensaje tarda milisegundos, no el tiempo de ida y vuelta a un servidor.
- **Funciona aunque se caiga internet.** En un apagón de red, en un sótano, en un barrio sin cobertura: el cruce sigue asistido.
- **No hay cuenta ni registro.** La pulsera no se "conecta" a nada: simplemente escucha lo que el poste anuncia al aire.

El mensaje que viaja es minúsculo: **cinco caracteres de información**, apenas la dirección del cruce, el estado de la luz y los segundos restantes. Pequeño a propósito, para que gaste poca energía y no se pierda entre el tráfico de radio de una ciudad.

---

### 3.4 📱 La aplicación móvil (ACPIGPS)

La app es el **acompañante** del sistema, no su cerebro. Se conecta a la pulsera por Bluetooth y cumple cuatro papeles.

**1. Traduce a palabras.** La vibración dice "gira a la derecha"; la app puede decirlo en voz alta a través del lector de pantalla del teléfono, junto con el tiempo restante del semáforo. Quien prefiera cruzar solo con la vibración, puede dejar el teléfono en el bolsillo y no perderse nada.

**2. Pone el cruce en el mapa.** Usa el GPS del teléfono para saber en qué esquina ocurrió cada cruce y cuenta los pasos dados durante el trayecto.

**3. Lleva la bitácora.** Cada cruce queda registrado como una *sesión*: cuánto se esperó, cuánto duró el cruce, si la orientación fue correcta, si se activó el botón de pánico.

**4. Sigue trabajando en segundo plano.** Aunque la pantalla se apague o la persona guarde el teléfono, la conexión con la pulsera se mantiene viva. Nadie debería tener que mirar la pantalla para cruzar una calle.

Un detalle de ingeniería que se nota en el uso: si en ese momento no hay señal, la app **guarda los datos y los envía después**, cuando vuelva la conexión. Nunca hace esperar a la persona por culpa de la red.

---

### 3.5 ☁️ El panel de datos

Es la parte del sistema que **no mira a la persona usuaria, sino a la ciudad**.

Cuando termina un cruce, la app envía un resumen: en qué punto ocurrió, cuánto se esperó, cuánto duró, si hubo desorientación o alerta. Con muchos de esos resúmenes, sumados a lo largo del tiempo, aparece un mapa que hoy prácticamente no existe:

- Qué esquinas generan más desorientación y necesitan mejor señalización.
- Dónde los tiempos de espera son excesivos para quien camina despacio.
- En qué cruces se disparan más alertas de pánico.
- Qué rutas de la ciudad se usan de verdad, frente a las que aparecen en el papel.

Es información que sirve para **argumentar frente a una alcaldía** que tal cruce necesita intervención, con datos y no con impresiones.

**Sobre la privacidad:** lo que se envía son métricas de un *cruce*, no la vida de una persona. No lleva nombre, ni teléfono, ni contactos, ni recorrido continuo: solo los puntos donde se cruzó una calle. Y si la app no está configurada para enviar nada, el sistema completo funciona igual, sin enviar nada.

---

## 4. Un cruce, paso a paso

Así se vive el sistema desde afuera:

1. **Se llega a la esquina.** La pulsera venía dormida; detecta la baliza del semáforo y despierta sola. No hay que sacar el teléfono, ni abrir una app, ni apretar nada.

2. **Se busca la orientación.** La persona se para frente al cruce. Si está torcida, vibra el lado hacia el que debe girar. Gira despacio hasta que la vibración cambia.

3. **Confirmación.** Dos pulsos cortos: está bien enfrentada al cruce. Si el teléfono está a mano, además anuncia cuántos segundos faltan.

4. **Luz de paso.** Cuando la baliza anuncia que se puede cruzar, la pulsera lo transmite. La persona inicia el cruce sabiendo que su dirección es la correcta.

5. **Durante el cruce.** La pulsera sigue comparando dos veces por segundo. Si el rumbo se desvía —por un hueco, una moto, un empujón— vuelve a indicar hacia qué lado corregir.

6. **Al otro lado.** El cruce se cierra como una sesión. La pulsera vuelve a dormirse al cabo de un rato sin balizas cerca, y el resumen del cruce sale hacia el panel cuando haya señal.

7. **Si algo sale mal**, en cualquier momento está el botón de pánico.

---

## 5. Decisiones de diseño (y por qué)

**Vibración antes que sonido.** El oído de una persona ciega es su principal herramienta para leer el tráfico. Taparlo con pitidos o audífonos sería quitarle seguridad para dárnosla nosotros. La muñeca estaba libre; el oído no.

**El cerebro va en la pulsera, no en la nube.** Todo lo que decide si vibrar o no se calcula dentro de la pulsera misma. Ni internet, ni servidor, ni celular participan en esa decisión. Un sistema de seguridad no puede depender de que haya señal.

**Preferimos callar antes que equivocarnos.** Ante una lectura dudosa —brazo en movimiento, señal inestable— el sistema no vibra. Una alerta falsa destruye la confianza, y sin confianza el dispositivo se queda en el cajón.

**El teléfono es opcional.** Cualquier función esencial se puede usar sin sacar el celular del bolsillo. La app agrega comodidad y memoria, no permiso para funcionar.

**Pensado para instalarse sobre lo que ya existe.** La baliza se monta en el poste actual sin rediseñar el semáforo, sin obra civil y sin cablear la esquina.

---

## 6. Preguntas frecuentes

**¿Reemplaza al bastón o al perro guía?**
No, y no pretende hacerlo. El bastón detecta lo que hay en el suelo a un paso de distancia; ACPI resuelve la orientación y el momento del cruce. Son herramientas complementarias.

**¿Sirve en un cruce sin baliza instalada?**
La función de orientación asistida necesita la baliza en el poste. En un cruce sin instalar, la pulsera no tiene con qué compararse.

**¿Y si el celular se queda sin batería?**
La pulsera sigue funcionando: orientación, vibraciones y botón de pánico son independientes del teléfono. Solo se pierden la voz, el mapa y el registro.

**¿Y si no hay internet?**
El cruce funciona exactamente igual. Los datos del panel se envían más tarde, cuando vuelva la señal.

**¿Cuánto dura la batería de la pulsera?**
Depende de cuántos cruces se hagan al día, porque la pulsera duerme cuando no hay semáforos cerca. Ese modo de ahorro es justamente lo que permite pensarla como un dispositivo de uso diario y no de un par de horas.

**¿La pulsera me rastrea?**
La pulsera no tiene GPS. La ubicación la aporta el teléfono, y solo en el momento de un cruce, para marcar en qué esquina ocurrió. No hay seguimiento continuo del recorrido.

**¿Funciona de noche o con lluvia?**
Sí. Nada del sistema depende de la luz ni de la visibilidad: se basa en campo magnético y radio.

**¿Se puede usar con varios semáforos cerca?**
Sí. Cada baliza se identifica y anuncia su propia dirección de cruce, de modo que la pulsera sabe a cuál está respondiendo.

**¿Hay que aprender a usarla?**
El lenguaje son cuatro señales, y la más importante —*el lado que vibra es el lado hacia el que giro*— es intuitiva. La curva de aprendizaje son minutos, no semanas.

---

## 7. Glosario sin tecnicismos

| Término | En palabras simples |
| --- | --- |
| **Baliza** | La cajita instalada en el poste del semáforo. |
| **Pulsera** | El aparato que se lleva en la muñeca. El que decide. |
| **Rumbo / orientación** | Hacia dónde está mirando algo, como en una brújula. |
| **Retroalimentación háptica** | Información entregada por vibración en vez de sonido o imagen. |
| **Sesión de cruce** | El registro de un cruce completo, de la espera hasta el otro andén. |
| **Modo de ahorro** | El estado dormido de la pulsera cuando no hay semáforos cerca. |
| **En el borde** | Que las decisiones se calculan en el propio aparato, sin consultar internet. |

---

## 8. En qué punto está el proyecto

ACPI es un **prototipo funcional** en desarrollo: las piezas existen, se comunican entre sí y el cruce asistido se puede demostrar completo, de principio a fin. Lo que sigue es lo que decide si una idea se vuelve un producto:

- Pruebas de campo con personas ciegas y con baja visión, en calles reales.
- Una carcasa cómoda, resistente al agua y que se pueda poner y quitar sin ver.
- Conversaciones con las entidades de movilidad para instalar balizas en cruces reales.

Esa etapa de pruebas con usuarios no es un trámite final: es la que va a cambiar el diseño. Los patrones de vibración, los tiempos y las tolerancias de este prototipo son nuestra mejor hipótesis, y la calle es la que tiene la última palabra.

---

*¿Te interesa el proyecto, quieres probarlo o aportar? Escríbenos.*
