# IUX-ZONE Panel v3.0 — «XUI.One Edition»

**Un solo panel** con el **estilo de XUI.one modernizado** sobre el **motor TVLister 24/7**
(Node.js 22 + React + SQLite). Todo en una sola aplicación, un solo login, una sola interfaz.

## Qué es

| Capa | De dónde sale |
|---|---|
| **Estilo y estructura** (shell) | XUI.one: sidebar oscura agrupada por módulos (*Principal / Streams / Infraestructura / Sistema*), barra activa azul, topbar con edición «XUI.One Edition», login centrado con logo, terminología XUI (Usuarios/MAG/Enigma2, Bouquets, Resellers, VOD…) |
| **Motor completo** (backend + UI de cada módulo) | TVLister 24/7 v2.6.67: streams, playout 24/7 (YouTube incluido), VOD con Jellyfin/TMDB, resellers con créditos, EPG, ingesta RTMP/SRT/MNF, Flussonic 23.12, CATV/UDP WK2500, WebTV, balancers edge, Access Codes |
| **Puente con XUI.one real** | Importador nativo de la BD `xui` (líneas, streams, VOD) + reutilización de los ffmpeg de XUI + modo coexistencia de puertos |

## Módulos del menú (equivalencia XUI.one → IUX-ZONE)

| Sección | Módulos |
|---|---|
| **Principal** | Dashboard · Usuarios, MAG & Enigma2 · Resellers & Créditos |
| **Streams** | Canales en Vivo · Canales 24/7 (Playout) · VOD Películas & Series · Bouquets & Categorías · EPG & Reportes |
| **Infraestructura** | Nodos Cabecera DVB · Ingesta RTMP/SRT/MNF · Flussonic 23.12 · Salida CATV/UDP WK2500 · Servidores & Seguridad |
| **Sistema** | Importar XUI.one (BD) · Motor FFmpeg · Access Codes |

## Instalación

```bash
sudo bash instalar_panel.sh
```

- **Servidor limpio**: el panel sirve en `80/443` directamente.
- **Servidor con XUI.one** (`/home/xui` detectado): modo seguro — no toca apt/MariaDB/nginx;
  corre en `127.0.0.1:8095` tras el nginx de XUI y reutiliza sus ffmpeg.
- El instalador compila la interfaz (`npm run build`) en el servidor con Node 22 aislado incluido
  en el paquete (no instala nada global). También hay `dist/` precompilado incluido por comodidad.

## Acceso y operación

```bash
systemctl status tvlister24-7      # servicio
tvlister-admin                     # administración (ffmpeg, jellyfin, tls, catv…)
journalctl -u tvlister24-7 -f      # logs
```

1. Entra al panel → crea el admin inicial (primer arranque) → **Importar XUI.one · BD**
   para traer líneas/streams/VOD desde tu XUI (solo lectura; usuario `tvlister_ro` sugerido).
2. Dashboard para monitoreo, Canales 24/7 para playout, VOD para Jellyfin/TMDB, WebTV para clientes.

## Estructura del paquete

```
PANEL_UNICO_IUXZONE/
├── LEEME_PANEL_UNICO.md     ← esta guía
├── instalar_panel.sh        ← instalador unificado (idempotente)
└── panel/                   ← fuente completa del panel (IUX-ZONE v3.0.0)
    ├── src/                 ← UI React con estilo XUI.one (Layout, Login, páginas)
    ├── server/              ← backend Node/Express + importador XUI + stream engine
    ├── scripts/             ← instaladores, tvlister-admin, tests
    ├── dist/                ← UI precompilada (el instalador la regenera)
    └── package.json         ← v3.0.0 (name: iux-zone-panel)
```

## Créditos y licencias

- Estilo «XUI.One Edition»: inspirado en la interfaz del panel comercial XUI.one (línea 1.5.13).
- Motor: TVLister 24/7 (repo `TalaveraSama/tvlister24-7`, rama `arena/85cc9902`, v2.6.67).
- El código PHP decodificado de XUI.one (Apache-2.0) NO se incluye en este panel: es 100 % Node.js.
