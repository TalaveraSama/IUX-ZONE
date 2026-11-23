# Esquema de BD esperado (checklist para el instalador oficial)

Lista de tablas que el código decodificado de XUI.one 1.5.13 referencia.
Se obtuvo analizando todas las sentencias SQL del directorio `decoded/`.
Sirve como **checklist** para verificar que el esquema del instalador oficial
(`XUI_1.5.13.zip` / `install`) cubre todo lo que el panel usa.

> El repositorio `xuione_decoded` NO incluye el esquema (no hay `CREATE TABLE` ni `.sql`).
> Por eso el panel no arranca hasta importar este esquema (ver `docs/esquema-bd.md`).

**Total de tablas distintas referenciadas:** 86

## Tablas

- `access_codes`
- `access_output`
- `admin_settings`
- `blocked_asns`
- `blocked_ips`
- `blocked_isps`
- `blocked_uas`
- `blocked_user_agents`
- `bouquets`
- `categories`
- `crontab`
- `detect_restream_logs`
- `devices`
- `divergence`
- `enigma2_actions`
- `enigma2_devices`
- `epg`
- `epg_api`
- `epg_channels`
- `epg_data`
- `epg_languages`
- `epg_sources`
- `groups`
- `hmac_keys`
- `isp_addon`
- `languages`
- `lines`
- `lines_activity`
- `lines_divergence`
- `lines_live`
- `lines_logs`
- `login_logs`
- `mag_claims`
- `mag_devices`
- `mag_events`
- `mag_logs`
- `member_groups`
- `members`
- `ondemand_check`
- `output_devices`
- `output_formats`
- `packages`
- `panel_logs`
- `profiles`
- `providers`
- `providers_streams`
- `queue`
- `recordings`
- `reg_users`
- `rtmp_ips`
- `series`
- `series_episodes`
- `servers`
- `servers_stats`
- `settings`
- `signals`
- `stream_categories`
- `stream_servers`
- `streaming_servers`
- `streams`
- `streams_arguments`
- `streams_categories`
- `streams_episodes`
- `streams_errors`
- `streams_logs`
- `streams_options`
- `streams_series`
- `streams_servers`
- `streams_stats`
- `streams_sys`
- `streams_types`
- `tickets`
- `tickets_replies`
- `transcoding_profiles`
- `user_activity`
- `user_output`
- `users`
- `users_credits_logs`
- `users_groups`
- `users_logs`
- `users_packages`
- `watch_categories`
- `watch_folders`
- `watch_logs`
- `watch_refresh`
- `webplayer_data`
