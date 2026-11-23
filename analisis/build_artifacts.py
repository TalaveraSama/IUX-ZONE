#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera los artefactos de comparación entre la instalación original (Drive)
y el repo tealcavalon/xuione_decoded (1.5.13)."""

import os, stat as _s

REPO = "/tmp/xuione_decoded/decoded"
OPC = "/tmp/xuione_decoded/opc"
OUT = "/home/user/IUX-ZONE/analisis"

# ---------------------------------------------------------------
# ÁRBOL ORIGINAL (transcrito de los listados de Google Drive)
# formato: ruta relativa dentro de xui/ -> tamaño en bytes ('D' = carpeta)
# ---------------------------------------------------------------
ORIG = {}

def add(prefix, entries):
    for name, size in entries:
        ORIG[prefix + name] = size

ROOT = [
    ("install", 19551), ("xui.tar.gz", 662955652), ("database.sql", 7793154),
    ("license", 2729), ("service", 2658), ("status", 357218),
    ("tools", 41286), ("update", 1034),
]

ADMIN = [
    ("api.php",765572),("archive.php",22127),("asns.php",7113),("backups.php",11725),
    ("bouquet.php",38662),("bouquet_order.php",7996),("bouquet_sort.php",38524),
    ("bouquets.php",13018),("cache.php",35703),("channel_order.php",30911),
    ("client_logs.php",8191),("code.php",17752),("codes.php",7857),
    ("created_channel.php",62246),("created_channel_mass.php",26473),
    ("created_channels.php",16614),("credit_logs.php",6511),("dashboard.php",121631),
    ("edit_profile.php",12922),("enigma.php",42314),("enigma_mass.php",25637),
    ("enigmas.php",17206),("epg.php",12689),("epg_view.php",40968),("epgs.php",12002),
    ("episode.php",58799),("episodes.php",30459),("episodes_mass.php",35386),
    ("fingerprint.php",19575),("footer.php",914609),("functions.php",13772),
    ("group.php",51357),("groups.php",10503),("header.php",163656),("hmac.php",8824),
    ("hmacs.php",6850),("index.php",1208),("ip.php",5121),("ips.php",8452),
    ("isp.php",7315),("isps.php",6481),("license.php",30312),("license_info.php",24477),
    ("line.php",70980),("line_activity.php",13383),("line_ips.php",11810),
    ("line_mass.php",27296),("lines.php",17008),("live_connections.php",25143),
    ("login.php",22519),("login_logs.php",4368),("logout.php",947),("mag.php",44029),
    ("mag_events.php",4102),("mag_mass.php",32984),("mags.php",17212),
    ("mass_delete.php",66017),("modals.php",44467),("movie.php",72093),
    ("movie_mass.php",33228),("movies.php",33609),("mysql_syslog.php",4161),
    ("ondemand.php",12149),("package.php",65310),("packages.php",9705),
    ("panel_logs.php",3799),("player.php",16099),("plex.php",11516),
    ("plex_add.php",44991),("post.php",283746),("process_monitor.php",52047),
    ("profile.php",50958),("profiles.php",10705),("provider.php",26643),
    ("providers.php",19236),("proxies.php",28198),("proxy.php",46531),
    ("queue.php",3291),("quick_tools.php",48267),("radio.php",45511),
    ("radio_mass.php",23361),("radios.php",18774),("record.php",28284),
    ("resize.php",17177),("restream_logs.php",6832),("review.php",92723),
    ("rtmp_ip.php",10089),("rtmp_ips.php",8278),("rtmp_monitor.php",23302),
    ("serie.php",45692),("series.php",12365),("series_mass.php",15121),
    ("server.php",84574),("server_install.php",26564),("server_order.php",6839),
    ("server_view.php",52797),("servers.php",39494),("session.php",6508),
    ("settings.php",215990),("settings_plex.php",22087),("settings_watch.php",24343),
    ("setup.php",41716),("stream.php",107168),("stream_categories.php",22146),
    ("stream_category.php",11719),("stream_errors.php",6094),("stream_mass.php",45226),
    ("stream_rank.php",11473),("stream_review.php",51657),("stream_tools.php",12635),
    ("stream_view.php",95666),("streams.php",34487),("table.php",1276350),
    ("theft_detection.php",11777),("ticket.php",5115),("ticket_view.php",6806),
    ("tickets.php",9872),("topbar.php",103773),("user.php",23581),
    ("user_logs.php",6472),("user_mass.php",19539),("useragent.php",7357),
    ("useragents.php",7130),("users.php",14261),("watch.php",9277),
    ("watch_add.php",53537),("watch_output.php",7378),
]

CRONS = [
    ("activity.php",15328),("backups.php",19399),("cache.php",55605),
    ("cache_engine.php",121371),("certbot.php",17197),("cleanup.php",42087),
    ("epg.php",89191),("errors.php",20046),("license.php",14578),
    ("lines_logs.php",9536),("plex.php",89664),("providers.php",28814),
    ("root_mysql.php",19284),("root_signals.php",128047),("series.php",8470),
    ("servers.php",46397),("stats.php",10896),("streams.php",51165),
    ("streams_logs.php",8757),("tmdb.php",87231),("tmdb_popular.php",19804),
    ("tmp.php",7578),("users.php",83321),("vod.php",30018),("watch.php",65569),
]

CLI = [
    ("archive.php",25208),("balancer.php",82269),("binaries.php",16759),
    ("cache_handler.php",16935),("certbot.php",29514),("created.php",27038),
    ("delay.php",34715),("llod.php",54023),("loopback.php",47714),
    ("migrate.php",139754),("monitor.php",90202),("ondemand.php",23430),
    ("plex_item.php",149425),("proxy.php",54122),("queue.php",20802),
    ("record.php",55821),("scanner.php",32400),("signals.php",27186),
    ("startup.php",18480),("thumbnail.php",11672),("tools.php",40407),
    ("update.php",24791),("watch_item.php",170564),("watchdog.php",26949),
]

INCLUDES_TOP = [
    ("admin.php",720179),("admin_api.php",928757),("pdo.php",10812),
    ("reseller_api.php",177154),("streaming.php",147944),("ts.php",27665),
    ("xui.php",801515),
]

LIBS = [
    ("Dropbox.php",32910),("iptables.php",18305),("m3u.php",18075),
    ("m3u_v2.php",24843),("mobiledetect.php",51116),("tmdb.php",20210),
    ("tmdb_release.php",16100),("XmlStringStreamer.php",19616),
]

API_ADMIN = [("index.php",185046)]

RESELLER = [
    ("api.php",155668),("created_channels.php",8216),("dashboard.php",39515),
    ("edit_profile.php",13783),("enigma.php",45726),("enigmas.php",20513),
    ("epg_view.php",42044),("episodes.php",13020),("footer.php",209977),
    ("functions.php",9611),("header.php",36559),("index.php",732),
    ("line.php",45378),("line_activity.php",17554),("lines.php",18779),
    ("live_connections.php",26124),("login.php",20687),("logout.php",987),
    ("mag.php",47195),("mags.php",20498),("modals.php",26051),("movies.php",9778),
    ("post.php",25195),("radios.php",9029),("resize.php",17173),
    ("session.php",6526),("streams.php",9437),("table.php",315701),
    ("ticket.php",6336),("ticket_view.php",6926),("tickets.php",8414),
    ("topbar.php",25267),("user.php",30197),("user_logs.php",11188),
    ("users.php",9606),
]

PLAYER = [
    ("episodes.php",48568),("footer.php",29325),("functions.php",106221),
    ("header.php",11233),("index.php",36203),("listings.php",38288),
    ("live.php",19477),("login.php",19583),("logout.php",1033),
    ("movie.php",36284),("movies.php",42392),("profile.php",21918),
    ("resize.php",19387),("series.php",40980),
]

WWW = [
    ("api.php",75638),("constants.php",48013),("enigma2.php",89137),
    ("epg.php",27098),("index.html",635),("init.php",6217),
    ("player_api.php",178834),("playlist.php",23121),("probe.php",23070),
    ("progress.php",4356),("xplugin.php",30935),
]

WWW_ADMIN = [
    ("api.php",26255),("index.php",2138),("live.php",44046),
    ("proxy_api.php",16873),("thumb.php",12911),("timeshift.php",35814),
    ("vod.php",21678),
]

WWW_STREAM = [
    ("auth.php",81412),("index.php",2130),("init.php",34945),("key.php",2039),
    ("live.php",62144),("rtmp.php",17761),("segment.php",14017),
    ("subtitle.php",7010),("thumb.php",5271),("timeshift.php",40122),
    ("vod.php",39441),
]

MINISTRA = [
    ("account.js",14414),("account_menu.js",206),("alert.js",6225),
    ("anecdote.js",15468),("app_skeleton.js",1478),("apps.js",6084),
    ("audioclub.js",40261),("blocking.js",2575),("cityinfo.js",3424),
    ("context_menu.js",13213),("course.cbr.js",4628),("course.nbu.js",4596),
    ("demo.js",1631),("downloads.js",24219),("downloads_dialog.js",28063),
    ("duration_input.js",2994),("dvb.js",11296),("epg.js",29452),
    ("epg.recorder.js",8196),("epg.reminder.js",9478),("epg.simple.js",31364),
    ("game.mastermind.js",14164),("global.js",24388),("horoscope.js",6144),
    ("image.viewer.js",3993),("index.html",9590),("infoportal.js",236),
    ("internet.js",2207),("JsHttpRequest-debug.js",35116),("JsHttpRequest.js",23826),
    ("karaoke.js",16654),("keydown.keycodes.js",1476),("keydown.observer.js",3231),
    ("layer.base.js",8313),("layer.bottom_menu.js",7155),("layer.input.js",18255),
    ("layer.list.js",13805),("layer.modal_form.js",23924),("layer.sclub_info.js",6721),
    ("layer.scrollbar.js",2033),("layer.search_box.js",38738),("layer.setting.js",8632),
    ("layer.sidebar.js",8985),("layer.simple.js",1316),("layer.vclub_info.js",6878),
    ("load_bar.js",3265),("logout.js",1750),("magiccast.js",931),
    ("main_menu.js",17807),("media_browser.js",60851),("password_input.js",4380),
    ("player.js",201022),("portal.php",270498),("pvr.js",2612),
    ("pvr_local.js",24177),("radio.js",24890),("records.js",12207),
    ("remotepvr.js",10257),("reset.js",14),("sclub.js",64871),
    ("series_switch.js",4001),("service_management.js",22821),
    ("settings.common.js",4319),("settings.js",2610),("settings.localization.js",8603),
    ("settings.network_status.js",3843),("settings.parent.js",3158),
    ("settings.playback.js",5553),("settings.update.js",5499),("speedtest.js",2867),
    ("time_shift.js",28763),("time_shift_local.js",3840),("traceroute.js",4774),
    ("tv.js",77458),("tv_archive.js",12476),("usbdisk.js",5416),("vclub.js",64838),
    ("version.js",20),("watchdog.js",11544),("weather.current.js",4003),
    ("weather.day.js",6138),("widget.audio.js",7707),("widget.radio.js",6955),
    ("xpcom.common.js",98491),("xpcom.webkit.js",2548),("youtube.js",2294),
]

BIN_TOP = [
    ("blkid",88176),("daemons.sh",697),("free-sans.ttf",714456),
    ("guess",8110352),("network",13608),("youtube",1840122),
]
CONFIG = [("rclone.conf",86)]

add("", ROOT)
add("admin/", ADMIN); ORIG["admin/assets/"] = "D"
add("crons/", CRONS); add("includes/cli/", CLI); add("includes/", INCLUDES_TOP)
ORIG["includes/api/"] = "D"; ORIG["includes/langs/"] = "D"; ORIG["includes/python/"] = "D"
add("includes/api/admin/", API_ADMIN); ORIG["includes/api/reseller/"] = "D"
add("includes/libs/", LIBS); ORIG["includes/libs/TMDb/"] = "D"; ORIG["includes/libs/resources/"] = "D"
add("reseller/", RESELLER); add("player/", PLAYER)
ORIG["player/css/"] = "D"; ORIG["player/fonts/"] = "D"; ORIG["player/img/"] = "D"
ORIG["player/js/"] = "D"; ORIG["player/libs/"] = "D"
add("www/", WWW); add("www/admin/", WWW_ADMIN); add("www/stream/", WWW_STREAM)
ORIG["www/images/"] = "D"; add("ministra/", MINISTRA)
ORIG["ministra/external/"] = "D"; ORIG["ministra/template/"] = "D"
add("bin/", BIN_TOP)
ORIG["bin/certbot/"] = "D"; ORIG["bin/ffmpeg_bin/"] = "D"; ORIG["bin/install/"] = "D"
ORIG["bin/maxmind/"] = "D"; ORIG["bin/nginx/"] = "D"; ORIG["bin/nginx_rtmp/"] = "D"
ORIG["bin/php/"] = "D"; ORIG["bin/redis/"] = "D"
ORIG["content/"] = "D"; ORIG["signals/"] = "D"; ORIG["tmp/"] = "D"; ORIG["config/"] = "D"

# validaciones de recuento
assert len(ADMIN) == 127, len(ADMIN)
assert len(CRONS) == 25, len(CRONS)
assert len(CLI) == 24, len(CLI)
assert len(RESELLER) == 35, len(RESELLER)
assert len(PLAYER) == 14, len(PLAYER)
assert len(WWW) == 11, len(WWW)
assert len(WWW_ADMIN) == 7, len(WWW_ADMIN)
assert len(WWW_STREAM) == 11, len(WWW_STREAM)
assert len(MINISTRA) == 86, len(MINISTRA)

# ---------------------------------------------------------------
# árbol del repo decoded
# ---------------------------------------------------------------
repo_files = []
for root, dirs, files in os.walk(REPO):
    for f in files:
        p = os.path.relpath(os.path.join(root, f), REPO)
        repo_files.append(p.replace(os.sep, "/"))
repo_set = set(repo_files)

# ---------------------------------------------------------------
# 1) arbol_original.txt
# ---------------------------------------------------------------
with open(os.path.join(OUT, "arbol_original.txt"), "w") as fh:
    fh.write("ÁRBOL DE LA INSTALACIÓN ORIGINAL (carpeta Drive 'xui' = contenido de xui.tar.gz)\n")
    fh.write("Formato: ruta relativa | tamaño en bytes ('D' = carpeta)\n")
    fh.write("=" * 78 + "\n")
    for path in sorted(ORIG):
        fh.write(f"{path}|{ORIG[path]}\n")
    nf = sum(1 for v in ORIG.values() if v != "D")
    fh.write(f"\nTotal entradas: {len(ORIG)} ({nf} archivos)\n")

# ---------------------------------------------------------------
# 2) comparación por conjuntos (solo rutas comparables con el repo)
# ---------------------------------------------------------------
GRUPOS = [
    ("admin", "admin/", [n for n, _ in ADMIN]),
    ("crons", "crons/", [n for n, _ in CRONS]),
    ("includes/cli", "includes/cli/", [n for n, _ in CLI]),
    ("includes/libs", "includes/libs/", [n for n, _ in LIBS]),
    ("includes/api/admin", "includes/api/admin/", [n for n, _ in API_ADMIN]),
    ("includes (raíz)", "includes/", [n for n, _ in INCLUDES_TOP]),
    ("reseller", "reseller/", [n for n, _ in RESELLER]),
    ("player", "player/", [n for n, _ in PLAYER]),
    ("www", "www/", [n for n, _ in WWW]),
    ("www/admin", "www/admin/", [n for n, _ in WWW_ADMIN]),
    ("www/stream", "www/stream/", [n for n, _ in WWW_STREAM]),
    ("ministra", "ministra/", [n for n, _ in MINISTRA]),
]

lines = []
lines.append("COMPARACIÓN DE ESTRUCTURA: instalación original vs tealcavalon/xuione_decoded (decoded/)")
lines.append("=" * 92)
lines.append(f"{'grupo':<20} {'original':>8} {'repo':>6} {'coinciden':>10}   detalle")
lines.append("-" * 92)
solo_orig_total, solo_repo_total = [], []
for nombre, prefijo, archivos in GRUPOS:
    orig = {prefijo + f for f in archivos}
    repo = {p for p in repo_set if p.startswith(prefijo)}
    if nombre == "ministra":
        repo = set()  # el repo no tiene ministra en absoluto
    so = sorted(orig - repo)
    sr = sorted(repo - orig)
    ok = "SÍ" if not so and not sr else "NO"
    det = ""
    if so:
        det += f" | solo original: {', '.join(so)}"
    if sr:
        det += f" | solo repo: {', '.join(sr)}"
    solo_orig_total += [f"{nombre}: {x}" for x in so]
    solo_repo_total += [f"{nombre}: {x}" for x in sr]
    lines.append(f"{nombre:<20} {len(orig):>8} {len(repo):>6} {ok:>10}{det}")
lines.append("-" * 92)
lines.append("")
lines.append("ARCHIVOS QUE EXISTEN EN EL ORIGINAL Y FALTAN EN EL REPO (código):")
lines.extend("  " + x for x in solo_orig_total) if solo_orig_total else lines.append("  (ninguno)")
lines.append("")
lines.append("ARCHIVOS QUE EXISTEN EN EL REPO Y NO EN EL ORIGINAL:")
lines.extend("  " + x for x in solo_repo_total) if solo_repo_total else lines.append("  (ninguno)")
with open(os.path.join(OUT, "diff_estructura.txt"), "w") as fh:
    fh.write("\n".join(lines) + "\n")

# ---------------------------------------------------------------
# 3) tamaños: original (encoded) vs decoded vs opc
# ---------------------------------------------------------------
rows = ["ruta;tam_original_encoded;tam_repo_decoded;tam_repo_opc;ratio_enc_vs_opc"]
for rel in sorted(repo_files):
    enc = os.path.getsize(os.path.join(REPO, rel))
    opcp = os.path.join(OPC, rel)
    opc = os.path.getsize(opcp) if os.path.exists(opcp) else None
    orig = ORIG.get(rel)
    ratio = (f"{orig/opc:.3f}" if (isinstance(orig, int) and opc) else "")
    rows.append(f"{rel};{orig if orig is not None else '?'};{enc};{opc if opc else '?'};{ratio}")
with open(os.path.join(OUT, "tamanos_original_vs_repo.csv"), "w") as fh:
    fh.write("\n".join(rows) + "\n")

# resumen de ratios enc/opc
ratios = []
for rel in repo_files:
    orig = ORIG.get(rel)
    opcp = os.path.join(OPC, rel)
    if isinstance(orig, int) and os.path.exists(opcp):
        opc = os.path.getsize(opcp)
        ratios.append((orig / opc, rel))
ratios.sort()
print("ARCHIVOS COMPARADOS enc/opc:", len(ratios))
if ratios:
    vals = [r for r, _ in ratios]
    print(f"ratio enc/opc  min={min(vals):.3f}  mediana={sorted(vals)[len(vals)//2]:.3f}  max={max(vals):.3f}")
    print("\nOUTLIERS (<0.35 o >0.65):")
    for r, rel in ratios:
        if r < 0.35 or r > 0.65:
            print(f"  {r:.3f}  {rel}  (orig={ORIG[rel]}, opc={os.path.getsize(os.path.join(OPC, rel))})")
print("\nOK artefactos generados en", OUT)
