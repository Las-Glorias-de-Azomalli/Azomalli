Ayúdame a construir el flujo de completar un pedido. Considera los archivos @README.md, @TESTS_README.md para el contexto necesario del proyecto.

Considera las pantallas de Figma (implementalas en el proyecto).

Pop-up de personalización: https://www.figma.com/design/nLH5BqQIaC1RCN2sDFFRpv/Azomalli?node-id=25-154&t=e6w8z2y5wCNUjEcA-4
Carrito: https://www.figma.com/design/nLH5BqQIaC1RCN2sDFFRpv/Azomalli?node-id=15-10487&t=e6w8z2y5wCNUjEcA-4
Calendario para agendar pedido: https://www.figma.com/design/nLH5BqQIaC1RCN2sDFFRpv/Azomalli?node-id=81-1413&t=e6w8z2y5wCNUjEcA-4

En este caso el flujo solo admite pago en efectivo y el pedido se almacena en relación con el usuario logeado. Considera los atributos en formato JSONB en la tabla de producto indican que se pueden elegir una de diferentes opciones. Al completar el pedido el atributo correspondiente se agrega con la opción seleccionada en la tabla DetallePedido.
Incluye también los endpoints correspondientes para el funcionamiento de estas pantallas y el flujo correcto de completar un pedido. Finalmente agrega las pruebas correspondientes de acuerdo con los detaln @TESTS_README.md.