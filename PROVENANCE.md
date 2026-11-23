# Procedencia y estado legal

Este repositorio es un **fork propio** de
[`tealcavalon/xuione_decoded`](https://github.com/tealcavalon/xuione_decoded)
(código "decoded" / descompilado de **XUI.one**, versión **1.5.13**).

## Cadena de procedencia

| Capa | Qué es | Licencia original declarada |
|------|--------|-----------------------------|
| Producto base | XUI.one 1.5.13 (panel IPTV comercial) | Propietaria (XUI.one / los dueños originales) |
| Repo `tealcavalon/xuione_decoded` | Volcado de código *decodificado* del producto | Apache 2.0 (incluía el archivo `LICENSE` de Apache) |
| **Este fork (`IUX-ZONE`)** | Copia fiel del código + documentación y scripts añadidos | **Libre License 2.0 (USA)** — ver `LICENSE` |

## Aviso honesto sobre la licencia

- El repositorio origen venía con un archivo `LICENSE` de **Apache 2.0**. Ese
  texto se conserva íntegro en `LICENSE.apache-upstream` solo como referencia.
- **"Libre License 2.0 (USA)" no es una licencia estándar** (no aparece en la
  lista SPDX). Se redactó y se aplica en este fork por decisión de quien mantiene
  `IUX-ZONE`, y ampara la **distribución y el material añadido** (documentación,
  scripts, organización).
- Aplicar una licencia a código que uno **no** es dueño del copyright **no**
  transfiere ni anula los derechos de los autores originales del código
  decodificado. Por tanto, el derecho real sobre el código fuente de XUI.one
  sigue correspondiendo a sus dueños. **Verifica tus derechos antes de
  redistribuir este material.**

## Qué se cambió y qué NO

- ✅ Se copió el código fuente (`decoded/`, `opc/`) **sin modificarlo**.
- ✅ Se añadió: `README.md`, carpeta `docs/`, carpeta `scripts/` y este archivo.
- ✅ Se sustituyó el `LICENSE` por *Libre License 2.0 (USA)* (decisión del fork).
- ❌ No se alteró la lógica del código, ni se quitó ninguna protección/comprobación
  del original.

## Estado de funcionalidad (leer `docs/esquema-bd.md`)

El código fuente está completo, pero **no incluye el esquema de la base de datos**
(no hay ningún `CREATE TABLE` ni `install.sql` en el repositorio). El asistente
`setup.php` solo sirve para *migrar* desde una instalación previa (Xtream UI, ZapX,
StreamCreed, Xtream Codes v2) o crear el usuario admin; **no crea las tablas desde
cero**. Para que el panel funcione de verdad hay que aportar el esquema de BD.
