🌐 ClanLedger/Sistema de gestión financiera personal y familiar
Aplicación web enfocada en la administración de finanzas personales y familiares, permitiendo el control de ingresos, gastos, cuentas y presupuestos mediante una interfaz visual, clara y centralizada.

👥 Integrantes

Juan David Alvarado Rocha – 1202673
Stefany Latorre Oyola – 1202615
Esteban Ahumedo Marchena - 1202635

🎯 1. Objetivo General

Desarrollar una plataforma web que permita gestionar de forma integral las finanzas personales y familiares, facilitando el registro, visualización y análisis de ingresos, gastos, cuentas y presupuestos. El sistema busca solucionar la desorganización financiera mediante una herramienta intuitiva que combine simplicidad, visualización clara de datos y soporte multiusuario.

🌍 2. Contexto de Uso

l sistema está diseñado para:
Familias que necesitan controlar gastos compartidos
Usuarios individuales que desean organizar sus finanzas personales
Personas que buscan simplicidad, evitando hojas de cálculo complejas

2 Se utilizará desde navegador web, donde el usuario podrá:
Visualizar un dashboard financiero
Registrar transacciones
Gestionar cuentas (ahorro, crédito, efectivo)
Crear presupuestos y reportes
Administrar miembros del grupo familiar

📋 3. Requerimientos del Sistema

3.1 Requerimientos Funcionales

RF01: Registrar ingresos y gastos manualmente
RF02: Clasificar transacciones por categorías
RF03: Crear y gestionar múltiples cuentas (ahorro, crédito, efectivo)
RF04: Permitir múltiples usuarios (familia)
RF05: Asignar roles (admin / miembro)
RF06: Visualizar dashboard con gráficos financieros
RF07: Generar reportes por período, categoría o usuario
RF08: Crear presupuestos por categoría
RF09: Mostrar alertas (gastos altos, presupuestos excedidos)
RF10: Permitir activar/desactivar notificaciones
RF11: Permitir eliminar datos con confirmación
RF12: Registrar miembros con colores personalizados

3.2 Requerimientos No Funcionales

RNF01: Interfaz minimalista y fácil de usar
RNF02: Tiempo de respuesta menor a 2 segundos
RNF03: Compatible con Chrome, Edge y Firefox
RNF04: Diseño responsive
RNF05: Código modular (HTML, CSS, JS separados)
RNF06: Confirmación en acciones críticas (como eliminar datos)
RNF07: Escalable para futuro backend

🧠 4. Diagramas UML

Diagrama de Casos de Uso
Representa las acciones principales que puede realizar el usuario dentro del sistema, como registrar transacciones, crear cuentas, gestionar miembros, visualizar reportes y eliminar datos.

Diagrama de Secuencia
Muestra el flujo de interacción entre el usuario y el sistema, por ejemplo:

Usuario -- clic en “Nueva Cuenta” -- sistema abre modal -- usuario llena datos -- sistema valida -- sistema guarda -- dashboard se actualiza

🎨 5. URL del Prototipo

(https://www.figma.com/design/m4D9usRLkRsEvhctAsS9bN/Mockup-Web-y-App?node-id=155-864&t=6mUXTtTOaD7sSM2F-1)

🗄️ 6. Diseño de Base de Datos

Tablas principales:
👤 Miembros
id
nombre
rol
color
💳 Cuentas
id
nombre
tipo
balance
miembro_id
💸 Transacciones
id
monto
tipo (ingreso/gasto)
categoría
fecha
cuenta_id
miembro_id
📊 Presupuestos
id
categoría
límite
periodo

🧩 7. Documentación del Sistema
Estructura de Carpetas
/css → estilos visuales
/js → lógica e interacciones
/assets → imágenes, iconos

CSS: define diseño UI basado en Figma (cards, botones, modales)
JS: maneja modales, botones, selección de colores, etc.
Assets: logos, iconos (como el marranito con el logo)

🚀 8. Instalación y Ejecución
Descargar el proyecto
Abrir en Visual Studio
Ejecutar ajustes.html o login.html

El sistema ClanLedger se diferencia por:
Enfoque multiusuario familiar
Interfaz minimalista tipo dashboard
Visualización clara con gráficos
Combinación de lo mejor de:
Moneyspire (estructura)
Fintonic (UX)
Excel (flexibilidad)
