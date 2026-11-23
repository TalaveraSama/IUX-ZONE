# Servicios y puertos de la fusión

## Mapa de puertos

| Puerto | Servicio | Dueño | Notas |
|---|---|---|---|
| 80 / 443 | nginx de XUI.One (web + streams cliente) | **XUI** | maestro; sirve `/admin`, `/player_api`, `/stream`, y opcionalmente proxifica TVLister |
| 25465 etc. | puertos admin/API configurables de XUI | XUI | según `settings` del panel |
| 8880 (típico) | RTMP de XUI (nginx_rtmp) | XUI | configurado en el panel |
| 6379 | Redis de XUI | XUI | bind local, con contraseña (instalador XUI) |
| 3306 | MariaDB | XUI | bind `*` en el `my.cnf` de XUI — recomendado restringir a LAN/firewall |
| **8095** | **TVLister 24/7** (HTTP interno) | **TVLister** | `127.0.0.1:8095` cuando hay XUI; 80/443 solo si TVLister vive solo |
| 1935 etc. | ingest RTMP/SRT/RTSP de TVLister | TVLister | solo si se activa ingest standalone; en coexistencia usar rutas del 80/443 de XUI |

## Servicios systemd resultantes

```text
xuione.service        ← XUI.One (/home/xui/service start)  [instalado por ./install]
tvlister24-7.service  ← TVLister (/opt/tvlister24-7, Node 22 aislado en .runtime/node)
```

Ambos conviven; ninguno depende del otro para arrancar. Orden recomendado de arranque tras un
reboot: `xuione` primero (deja nginx/ffmpeg listos), `tvlister24-7` después (su wrapper de
ffmpeg revalida los binarios de XUI al arrancar).

## Comandos de control

```bash
# XUI.One
/home/xui/service {start|stop|restart|reload}
/home/xui/status

# TVLister 24/7
systemctl {status|restart|stop} tvlister24-7
tvlister-admin          # menú de administración del panel moderno
journalctl -u tvlister24-7 -f
```

## Firewall sugerido (coexistencia)

- Abierto al público: 80, 443, puertos de broadcast/streaming de XUI (los del panel).
- 8095: solo localhost; el acceso externo va por el proxy del nginx de XUI.
- 3306: restringir a localhost/LAN (ya que el `my.cnf` de XUI hace bind a `*`).
