69111d69110
<   `mac_filter` varchar(50) DEFAULT NULL,
69114,69115c69113
<   KEY `user_id` (`user_id`),
<   FULLTEXT KEY `search` (`mac_filter`,`public_ip`)
---
>   KEY `user_id` (`user_id`)
69292,69293c69290
<   KEY `is_e2` (`is_e2`),
<   FULLTEXT KEY `search` (`username`,`admin_notes`,`reseller_notes`,`last_ip`,`contact`)
---
>   KEY `is_e2` (`is_e2`)
69295a69293,69294
> /*!40000 ALTER TABLE `lines` DISABLE KEYS */;
> /*!40000 ALTER TABLE `lines` ENABLE KEYS */;
69328,69335d69326
< CREATE TABLE IF NOT EXISTS `lines_divergence` (
<   `id` int(11) NOT NULL AUTO_INCREMENT,
<   `uuid` varchar(32) DEFAULT NULL,
<   `divergence` float DEFAULT NULL,
<   PRIMARY KEY (`id`) USING BTREE,
<   UNIQUE KEY `uuid` (`uuid`) USING BTREE
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
< 
69357a69349
>   `init` tinyint(4) DEFAULT '1',
69495d69486
<   `mac_filter` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
69498,69499c69489
<   KEY `mac` (`mac`),
<   FULLTEXT KEY `search` (`mac_filter`,`ip`)
---
>   KEY `mac` (`mac`)
69541,69557d69530
< CREATE TABLE IF NOT EXISTS `ondemand_check` (
<   `id` int(11) NOT NULL AUTO_INCREMENT,
<   `stream_id` int(11) DEFAULT NULL,
<   `server_id` int(11) DEFAULT NULL,
<   `status` int(1) DEFAULT NULL,
<   `source_id` int(4) DEFAULT NULL,
<   `source_url` varchar(1024) DEFAULT NULL,
<   `video_codec` varchar(50) DEFAULT NULL,
<   `audio_codec` varchar(50) DEFAULT NULL,
<   `resolution` varchar(50) DEFAULT NULL,
<   `response` int(11) DEFAULT NULL,
<   `fps` int(11) DEFAULT NULL,
<   `errors` mediumtext DEFAULT NULL,
<   `date` int(11) DEFAULT NULL,
<   PRIMARY KEY (`id`) USING BTREE
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
< 
69580,69581c69553,69554
< 	(7, 'Enigma 2 OE 1.6 Auto Script', 'enigma216_script', 'iptv.sh', 'USERNAME="{USERNAME}";PASSWORD="{PASSWORD}";bouquet="{BOUQUET_NAME}";directory="/etc/enigma2/iptv.sh";url="{SERVER_URL}playlist/$USERNAME/$PASSWORD/enigma16?output={OUTPUT_KEY}";rm /etc/enigma2/userbouquet."$bouquet"__tv_.tv;wget -O /etc/enigma2/userbouquet."$bouquet"__tv_.tv $url;if ! cat /etc/enigma2/bouquets.tv | grep -v grep | grep -c $bouquet > /dev/null;then echo "[+] Creating IPTV folder...";cat /etc/enigma2/bouquets.tv | sed -n 1p > /etc/enigma2/new_bouquets.tv;echo \'#SERVICE 1:7:1:0:0:0:0:0:0:0:FROM BOUQUET "userbouquet.\'$bouquet\'__tv_.tv" ORDER BY bouquet\' >> /etc/enigma2/new_bouquets.tv; cat /etc/enigma2/bouquets.tv | sed -n \'2,$p\' >> /etc/enigma2/new_bouquets.tv;rm /etc/enigma2/bouquets.tv;mv /etc/enigma2/new_bouquets.tv /etc/enigma2/bouquets.tv;fi;rm /usr/bin/enigma2_pre_start.sh;echo "Writing to file...";echo "/bin/sh "$directory" > /dev/null 2>&1 &" > /usr/bin/enigma2_pre_start.sh;chmod 777 /usr/bin/enigma2_pre_start.sh;wget -qO - "http://127.0.0.1/web/servicelistreload?mode=2";wget -qO - "http://127.0.0.1/web/servicelistreload?mode=2"; read -p "Press enter to complete setup and reboot";;', '', '', 2, 'wget -O /etc/enigma2/iptv.sh {DEVICE_LINK} && chmod 777 /etc/enigma2/iptv.sh && /etc/enigma2/iptv.sh'),
< 	(8, 'Enigma 2 OE 2.0 Auto Script', 'enigma22_script', 'iptv.sh', 'USERNAME="{USERNAME}";PASSWORD="{PASSWORD}";bouquet="{BOUQUET_NAME}";directory="/etc/enigma2/iptv.sh";url="{SERVER_URL}playlist/$USERNAME/$PASSWORD/dreambox?output={OUTPUT_KEY}";rm /etc/enigma2/userbouquet."$bouquet"__tv_.tv;wget -O /etc/enigma2/userbouquet."$bouquet"__tv_.tv $url;if ! cat /etc/enigma2/bouquets.tv | grep -v grep | grep -c $bouquet > /dev/null;then echo "[+] Creating IPTV folder...";cat /etc/enigma2/bouquets.tv | sed -n 1p > /etc/enigma2/new_bouquets.tv;echo \'#SERVICE 1:7:1:0:0:0:0:0:0:0:FROM BOUQUET "userbouquet.\'$bouquet\'__tv_.tv" ORDER BY bouquet\' >> /etc/enigma2/new_bouquets.tv; cat /etc/enigma2/bouquets.tv | sed -n \'2,$p\' >> /etc/enigma2/new_bouquets.tv;rm /etc/enigma2/bouquets.tv;mv /etc/enigma2/new_bouquets.tv /etc/enigma2/bouquets.tv;fi;rm /usr/bin/enigma2_pre_start.sh;echo "Writing to file...";echo "/bin/sh "$directory" > /dev/null 2>&1 &" > /usr/bin/enigma2_pre_start.sh;chmod 777 /usr/bin/enigma2_pre_start.sh;wget -qO - "http://127.0.0.1/web/servicelistreload?mode=2";wget -qO - "http://127.0.0.1/web/servicelistreload?mode=2"; read -p "Press enter to complete setup and reboot";', '', '', 2, 'wget -O /etc/enigma2/iptv.sh {DEVICE_LINK} && chmod 777 /etc/enigma2/iptv.sh && /etc/enigma2/iptv.sh'),
---
> 	(7, 'Enigma 2 OE 1.6 Auto Script', 'enigma216_script', 'iptv.sh', 'USERNAME="{USERNAME}";PASSWORD="{PASSWORD}";bouquet="{BOUQUET_NAME}";directory="/etc/enigma2/iptv.sh";url="{SERVER_URL}playlist/$USERNAME/$PASSWORD/enigma16?output={OUTPUT_KEY}";rm /etc/enigma2/userbouquet."$bouquet"__tv_.tv;wget -O /etc/enigma2/userbouquet."$bouquet"__tv_.tv $url;if ! cat /etc/enigma2/bouquets.tv | grep -v grep | grep -c $bouquet > /dev/null;then echo "[+] Creating IPTV folder...";cat /etc/enigma2/bouquets.tv | sed -n 1p > /etc/enigma2/new_bouquets.tv;echo \'#SERVICE 1:7:1:0:0:0:0:0:0:0:FROM BOUQUET "userbouquet.\'$bouquet\'__tv_.tv" ORDER BY bouquet\' >> /etc/enigma2/new_bouquets.tv; cat /etc/enigma2/bouquets.tv | sed -n \'2,$p\' >> /etc/enigma2/new_bouquets.tv;rm /etc/enigma2/bouquets.tv;mv /etc/enigma2/new_bouquets.tv /etc/enigma2/bouquets.tv;fi;rm /usr/bin/enigma2_pre_start.sh;echo "Writing to file...";echo "/bin/sh "$directory" > /dev/null 2>&1 &" > /usr/bin/enigma2_pre_start.sh;chmod 777 /usr/bin/enigma2_pre_start.sh;wget -qO - "http://127.0.0.1/web/servicelistreload?mode=2";wget -qO - "http://127.0.0.1/web/servicelistreload?mode=2"; read -p "Press enter to complete setup and reboot"; reboot;', '', '', 2, 'wget -O /etc/enigma2/iptv.sh {DEVICE_LINK} && chmod 777 /etc/enigma2/iptv.sh && /etc/enigma2/iptv.sh'),
> 	(8, 'Enigma 2 OE 2.0 Auto Script', 'enigma22_script', 'iptv.sh', 'USERNAME="{USERNAME}";PASSWORD="{PASSWORD}";bouquet="{BOUQUET_NAME}";directory="/etc/enigma2/iptv.sh";url="{SERVER_URL}playlist/$USERNAME/$PASSWORD/dreambox?output={OUTPUT_KEY}";rm /etc/enigma2/userbouquet."$bouquet"__tv_.tv;wget -O /etc/enigma2/userbouquet."$bouquet"__tv_.tv $url;if ! cat /etc/enigma2/bouquets.tv | grep -v grep | grep -c $bouquet > /dev/null;then echo "[+] Creating IPTV folder...";cat /etc/enigma2/bouquets.tv | sed -n 1p > /etc/enigma2/new_bouquets.tv;echo \'#SERVICE 1:7:1:0:0:0:0:0:0:0:FROM BOUQUET "userbouquet.\'$bouquet\'__tv_.tv" ORDER BY bouquet\' >> /etc/enigma2/new_bouquets.tv; cat /etc/enigma2/bouquets.tv | sed -n \'2,$p\' >> /etc/enigma2/new_bouquets.tv;rm /etc/enigma2/bouquets.tv;mv /etc/enigma2/new_bouquets.tv /etc/enigma2/bouquets.tv;fi;rm /usr/bin/enigma2_pre_start.sh;echo "Writing to file...";echo "/bin/sh "$directory" > /dev/null 2>&1 &" > /usr/bin/enigma2_pre_start.sh;chmod 777 /usr/bin/enigma2_pre_start.sh;wget -qO - "http://127.0.0.1/web/servicelistreload?mode=2";wget -qO - "http://127.0.0.1/web/servicelistreload?mode=2"; read -p "Press enter to complete setup and reboot"; reboot;', '', '', 2, 'wget -O /etc/enigma2/iptv.sh {DEVICE_LINK} && chmod 777 /etc/enigma2/iptv.sh && /etc/enigma2/iptv.sh'),
69617,69618d69589
<   `server_id` int(11) DEFAULT NULL,
<   `unique` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
69629c69600
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
69653c69624
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
69666d69636
<   `type` varchar(16) COLLATE utf8_unicode_ci DEFAULT 'live',
69679,69696c69649
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
< 
< CREATE TABLE IF NOT EXISTS `recordings` (
<   `id` int(11) NOT NULL AUTO_INCREMENT,
<   `stream_id` int(11) DEFAULT NULL,
<   `created_id` int(11) DEFAULT NULL,
<   `category_id` longtext DEFAULT NULL,
<   `bouquets` longtext DEFAULT NULL,
<   `title` mediumtext DEFAULT NULL,
<   `description` mediumtext DEFAULT NULL,
<   `stream_icon` mediumtext DEFAULT NULL,
<   `start` int(11) DEFAULT NULL,
<   `end` int(11) DEFAULT NULL,
<   `source_id` int(11) DEFAULT NULL,
<   `archive` int(11) DEFAULT NULL,
<   `status` tinyint(1) DEFAULT 0,
<   PRIMARY KEY (`id`) USING BTREE
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
69707c69660
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
69759,69765d69711
<   `php_pids` longtext COLLATE utf8_unicode_ci DEFAULT NULL,
<   `connections` int(16) DEFAULT 0,
<   `users` int(16) DEFAULT 0,
<   `remote_status` tinyint(1) DEFAULT 1,
<   `governors` mediumtext COLLATE utf8_unicode_ci DEFAULT NULL,
<   `governor` varchar(512) COLLATE utf8_unicode_ci DEFAULT NULL,
<   `sysctl` mediumtext COLLATE utf8_unicode_ci DEFAULT NULL,
69771c69717,69718
< INSERT INTO `servers` (`id`, `server_type`, `xui_version`, `server_name`, `domain_name`, `server_ip`, `private_ip`, `is_main`, `enabled`, `parent_id`, `http_broadcast_port`, `https_broadcast_port`, `http_ports_add`, `https_ports_add`, `total_clients`, `network_interface`, `status`, `enable_geoip`, `geoip_countries`, `last_check_ago`, `server_hardware`, `total_services`, `persistent_connections`, `rtmp_port`, `geoip_type`, `isp_names`, `isp_type`, `enable_isp`, `network_guaranteed_speed`, `timeshift_only`, `whitelist_ips`, `watchdog_data`, `video_devices`, `audio_devices`, `gpu_info`, `interfaces`, `random_ip`, `enable_proxy`, `enable_https`, `certbot_renew`, `certbot_ssl`, `uuid`, `use_disk`, `last_status`, `time_offset`, `ping`, `requests_per_second`, `xui_revision`, `php_version`, `php_pids`, `connections`, `users`, `remote_status`, `governors`, `governor`, `sysctl`) VALUES (1, 0, '1.5.8', 'Main Server', '', '127.0.0.1', '', 1, 1, 0, 80, 443, NULL, NULL, 1000, 'auto', 1, 0, '[]', 0, NULL, 4, 0, 8880, 'low_priority', '', 'low_priority', 0, 1000, 0, '["127.0.0.1"]', NULL, '[]', '[]', '[]', '["eth0"]', 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, NULL, 74, NULL, 0, 0, 1, NULL, NULL, NULL);
---
> INSERT INTO `servers` (`id`, `server_type`, `xui_version`, `server_name`, `domain_name`, `server_ip`, `private_ip`, `is_main`, `enabled`, `parent_id`, `http_broadcast_port`, `https_broadcast_port`, `http_ports_add`, `https_ports_add`, `total_clients`, `network_interface`, `status`, `enable_geoip`, `geoip_countries`, `last_check_ago`, `server_hardware`, `total_services`, `persistent_connections`, `rtmp_port`, `geoip_type`, `isp_names`, `isp_type`, `enable_isp`, `network_guaranteed_speed`, `timeshift_only`, `whitelist_ips`, `watchdog_data`, `video_devices`, `audio_devices`, `gpu_info`, `interfaces`, `random_ip`, `enable_proxy`, `enable_https`, `certbot_renew`, `certbot_ssl`, `uuid`, `use_disk`, `last_status`, `time_offset`, `ping`, `requests_per_second`, `xui_revision`, `php_version`) VALUES
> 	(1, 0, '1.4.3', 'Main Server', '', '127.0.0.1', '', 1, 1, 0, 80, 443, NULL, NULL, 1000, 'auto', 1, 0, '[]', 0, NULL, 4, 0, 8880, 'low_priority', '', 'low_priority', 0, 1000, 0, '["127.0.0.1"]', NULL, '[]', '[]', '[]', '["eth0"]', 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, NULL, 74);
70030,70061c69977
<   `extract_subtitles` TINYINT(1) NULL DEFAULT '0',
<   `reseller_ssl_domain` tinyint(1) DEFAULT 1,
<   `auto_send_logs` tinyint(1) DEFAULT 0,
<   `disable_xmltv_restreamer` tinyint(1) DEFAULT 0,
<   `disable_playlist_restreamer` tinyint(1) DEFAULT 0,
<   `mag_load_all_channels` tinyint(1) DEFAULT 0,
<   `connection_sync_timer` int(11) DEFAULT 1,
<   `segment_wait_time` int(11) DEFAULT 20,
<   `total_users` int(11) DEFAULT 0,
<   `dts_legacy_ffmpeg` tinyint(1) DEFAULT 0,
<   `allow_cdn_access` tinyint(1) DEFAULT 0,
<   `disable_mag_token` tinyint(1) DEFAULT 0,
<   `ondemand_balance_equal` tinyint(1) DEFAULT 0,
<   `update_data` mediumtext COLLATE utf8_unicode_ci DEFAULT NULL,
<   `dashboard_status` tinyint(1) DEFAULT 1,
<   `on_demand_checker` tinyint(1) DEFAULT 0,
<   `on_demand_scan_time` int(16) DEFAULT 3600,
<   `on_demand_max_probe` int(16) DEFAULT 5,
<   `on_demand_scan_keep` int(16) DEFAULT 604800,
<   `parse_type` varchar(12) COLLATE utf8_unicode_ci DEFAULT 'ptn',
<   `fallback_parser` tinyint(1) DEFAULT 0,
<   `alternative_titles` tinyint(1) DEFAULT 0,
<   `search_items` int(3) DEFAULT 20,
<   `enable_search` tinyint(4) DEFAULT 1,
<   `modal_edit` tinyint(1) DEFAULT 1,
<   `group_buttons` tinyint(1) DEFAULT 1,
<   `license` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
<   `stop_failures` tinyint(3) DEFAULT 3,
<   `restreamer_bypass_proxy` tinyint(1) DEFAULT 0,
<   `mysql_sleep_kill` int(11) DEFAULT 21600,
<   `reissues` mediumtext COLLATE utf8_unicode_ci DEFAULT NULL,
<   `status_uuid` varchar(512) COLLATE utf8_unicode_ci DEFAULT NULL
---
>   `extract_subtitles` TINYINT(1) NULL DEFAULT '0'
70064c69980,69981
< INSERT INTO `settings` (`id`, `server_name`, `default_timezone`, `allowed_stb_types`, `client_prebuffer`, `split_clients`, `stream_max_analyze`, `show_not_on_air_video`, `not_on_air_video_path`, `show_banned_video`, `banned_video_path`, `show_expired_video`, `expired_video_path`, `show_expiring_video`, `expiring_video_path`, `mag_container`, `api_container`, `probesize`, `allowed_ips_admin`, `block_svp`, `allow_countries`, `user_auto_kick_hours`, `disallow_empty_user_agents`, `show_all_category_mag`, `flood_limit`, `flood_ips_exclude`, `flood_seconds`, `vod_bitrate_plus`, `read_buffer_size`, `seg_time`, `seg_list_size`, `tv_channel_default_aspect`, `playback_limit`, `show_tv_channel_logo`, `show_channel_logo_in_preview`, `enable_connection_problem_indication`, `vod_limit_perc`, `allowed_stb_types_for_local_recording`, `stalker_theme`, `rtmp_random`, `api_ips`, `use_buffer`, `restreamer_prebuffer`, `audio_restart_loss`, `stalker_lock_images`, `channel_number_type`, `stb_change_pass`, `enable_debug_stalker`, `online_capacity_interval`, `always_enabled_subtitles`, `test_download_url`, `api_pass`, `message_of_day`, `enable_isp_lock`, `show_isps`, `save_closed_connection`, `client_logs_save`, `case_sensitive_line`, `county_override_1st`, `disallow_2nd_ip_con`, `split_by`, `use_mdomain_in_lists`, `priority_backup`, `tmdb_api_key`, `mag_security`, `hls_accelerator`, `backups_pid`, `backups_to_keep`, `cc_time`, `dashboard_stats`, `default_entries`, `disable_trial`, `download_images`, `dropbox_keep`, `dropbox_remote`, `ip_logout`, `last_backup`, `login_flood`, `recaptcha_enable`, `reseller_restrictions`, `stats_pid`, `tmdb_pid`, `watch_pid`, `automatic_backups`, `dropbox_token`, `recaptcha_v2_secret_key`, `recaptcha_v2_site_key`, `tmdb_language`, `release_parser`, `language`, `encrypt_hls`, `disable_ts`, `disable_ts_allow_restream`, `disable_hls`, `disable_hls_allow_restream`, `disable_rtmp`, `disable_rtmp_allow_restream`, `date_format`, `datetime_format`, `enable_epg_api`, `epg_api_days_fetch`, `epg_api_days_keep`, `epg_api_extended`, `streams_grouped`, `disable_player_api`, `disable_playlist`, `disable_xmltv`, `disable_enigma2`, `disable_ministra`, `api_redirect`, `movie_year_append`, `log_clear`, `cleanup`, `fingerprint_max`, `bruteforce_mac_attempts`, `bruteforce_username_attempts`, `bruteforce_frequency`, `auto_update_lbs`, `update_version`, `dashboard_display_alt`, `dashboard_map`, `cpu_limit`, `mem_limit`, `detect_restream_servers`, `detect_restream_block_user`, `detect_restream_block_ip`, `detect_restream_ports`, `cloudflare`, `js_navigate`, `encrypt_playlist`, `encrypt_playlist_restreamer`, `stream_logs_save`, `restrict_same_ip`, `show_tickets`, `percentage_match`, `thread_count`, `scan_seconds`, `verify_host`, `max_genres`, `legacy_get`, `legacy_xmltv`, `mag_disable_ssl`, `hide_failures`, `legacy_panel_api`, `connection_loop_per`, `connection_loop_count`, `api_probe`, `max_simultaneous_downloads`, `restart_php_fpm`, `cache_playlists`, `send_xui_header`, `request_prebuffer`, `debug_show_errors`, `block_streaming_servers`, `block_proxies`, `ip_subnet_match`, `last_cache`, `last_cache_taken`, `ministra_allow_blank`, `enable_cache`, `legacy_mag_auth`, `ignore_invalid_users`, `on_demand_instant_off`, `on_demand_failure_exit`, `on_demand_wait_time`, `playlist_from_mysql`, `show_images`, `kill_rogue_ffmpeg`, `monitor_connection_status`, `stream_fail_sleep`, `custom_ip_header`, `send_protection_headers`, `send_altsvc_header`, `send_server_header`, `send_unique_header`, `send_unique_header_domain`, `max_items`, `restrict_playlists`, `mag_legacy_redirect`, `save_login_logs`, `save_restart_logs`, `keep_activity`, `keep_client`, `keep_login`, `keep_errors`, `keep_restarts`, `ignore_keyframes`, `seg_delete_threshold`, `fails_per_time`, `segment_type`, `thread_count_movie`, `thread_count_show`, `redirect_timeout`, `create_expiration`, `redis_handler`, `redis_password`, `force_epg_timezone`, `check_vod`, `max_encode_movies`, `max_encode_cc`, `queue_loop`, `cache_thread_count`, `cache_changes`, `player_blur`, `player_opacity`, `player_allow_playlist`, `player_allow_bouquet`, `player_hide_incompatible`, `player_allow_hevc`, `read_native_hls`, `keep_protocol`, `ffmpeg_cpu`, `ffmpeg_gpu`, `header_stats`, `mag_keep_extension`, `show_connected_video`, `connected_video_path`, `disallow_2nd_ip_max`, `probesize_ondemand`, `ffmpeg_warnings`, `vod_sort_newest`, `mag_message`, `mag_default_type`, `fps_delay`, `fps_check_type`, `show_category_duplicates`, `probe_extra_wait`, `restream_deny_unauthorised`, `extract_subtitles`, `reseller_ssl_domain`, `auto_send_logs`, `disable_xmltv_restreamer`, `disable_playlist_restreamer`, `mag_load_all_channels`, `connection_sync_timer`, `segment_wait_time`, `total_users`, `dts_legacy_ffmpeg`, `allow_cdn_access`, `disable_mag_token`, `ondemand_balance_equal`, `update_data`, `dashboard_status`, `on_demand_checker`, `on_demand_scan_time`, `on_demand_max_probe`, `on_demand_scan_keep`, `parse_type`, `fallback_parser`, `alternative_titles`, `search_items`, `enable_search`, `modal_edit`, `group_buttons`, `license`, `stop_failures`, `restreamer_bypass_proxy`, `mysql_sleep_kill`, `reissues`, `status_uuid`) VALUES (1, 'XUI.one', 'Europe/London', '[]', 10, 'equal', 5000000, 1, '', 1, '', 1, '', 1, '', 'ts', 'ts', 5000000, '', 1, '["ALL"]', 3, 1, 1, 40, '', 2, 400, 8192, 10, 6, 'fit', 3, 1, 1, 1, 10, '[]', 'default', 1, '', 0, 0, 0, '', 'bouquet', 1, 0, 10, 0, 'https://speed.hetzner.de/100MB.bin', '', 'Welcome to XUI.one', 1, 1, 1, 1, 1, 0, 0, 'conn', 1, 1, '', 1, 1, 0, 0, 0, 1, 50, 0, 1, 10, 0, 1, 0, 20, 0, 1, 0, 0, 0, 'daily', '', '', '', '', 'python', 'en', 0, 0, 0, 0, 0, 0, 0, 'Y-m-d', 'Y-m-d H:i:s', 1, 7, 7, 2, 1, 0, 0, 0, 0, 0, 0, 0, 31, 1, 25, 10, 10, 300, 1, '1.1.0', 1, 0, 0, 0, 1, 0, 0, '[25461,25550,31210]', 0, 1, 1, 0, 1, 1, 0, 80, 50, 86400, 0, 3, 1, 1, 0, 0, 1, 0, 0, 1, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 20, 0, 1, 1, 1, 10, '', 0, 0, '', '', '', 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 4, 86400, 1, 5, 1, 5, 5, 0, '', 0, 0, 10, 1, 1, 10, 1, 0, 10, 1, 1, 0, 0, 1, 0, '4.0', '4.0', 1, 1, 1, NULL, 1, 256000, 1, 0, 'You can switch between the modern and legacy themes by using the <span class="label">Green</span> and <span class="label">Yellow</span> buttons on your remote control. Doing so will restart your device.', 0, 600, 1, 0, 10, 1, 0, 1, 0, 0, 0, 0, 1, 20, 0, 0, 0, 0, 0, NULL, 1, 0, 3600, 5, 604800, 'ptn', 0, 0, 20, 1, 1, 1, NULL, 3, 0, 21600, NULL, NULL);
---
> INSERT INTO `settings` (`id`, `server_name`, `default_timezone`, `allowed_stb_types`, `client_prebuffer`, `split_clients`, `stream_max_analyze`, `show_not_on_air_video`, `not_on_air_video_path`, `show_banned_video`, `banned_video_path`, `show_expired_video`, `expired_video_path`, `show_expiring_video`, `expiring_video_path`, `mag_container`, `api_container`, `probesize`, `allowed_ips_admin`, `block_svp`, `allow_countries`, `user_auto_kick_hours`, `disallow_empty_user_agents`, `show_all_category_mag`, `flood_limit`, `flood_ips_exclude`, `flood_seconds`, `vod_bitrate_plus`, `read_buffer_size`, `seg_time`, `seg_list_size`, `tv_channel_default_aspect`, `playback_limit`, `show_tv_channel_logo`, `show_channel_logo_in_preview`, `enable_connection_problem_indication`, `vod_limit_perc`, `allowed_stb_types_for_local_recording`, `stalker_theme`, `rtmp_random`, `api_ips`, `use_buffer`, `restreamer_prebuffer`, `audio_restart_loss`, `stalker_lock_images`, `channel_number_type`, `stb_change_pass`, `enable_debug_stalker`, `online_capacity_interval`, `always_enabled_subtitles`, `test_download_url`, `api_pass`, `message_of_day`, `enable_isp_lock`, `show_isps`, `save_closed_connection`, `client_logs_save`, `case_sensitive_line`, `county_override_1st`, `disallow_2nd_ip_con`, `split_by`, `use_mdomain_in_lists`, `priority_backup`, `tmdb_api_key`, `mag_security`, `hls_accelerator`, `backups_pid`, `backups_to_keep`, `cc_time`, `dashboard_stats`, `default_entries`, `disable_trial`, `download_images`, `dropbox_keep`, `dropbox_remote`, `ip_logout`, `last_backup`, `login_flood`, `recaptcha_enable`, `reseller_restrictions`, `stats_pid`, `tmdb_pid`, `watch_pid`, `automatic_backups`, `dropbox_token`, `recaptcha_v2_secret_key`, `recaptcha_v2_site_key`, `tmdb_language`, `release_parser`, `language`, `encrypt_hls`, `disable_ts`, `disable_ts_allow_restream`, `disable_hls`, `disable_hls_allow_restream`, `disable_rtmp`, `disable_rtmp_allow_restream`, `date_format`, `datetime_format`, `enable_epg_api`, `epg_api_days_fetch`, `epg_api_days_keep`, `epg_api_extended`, `streams_grouped`, `disable_player_api`, `disable_playlist`, `disable_xmltv`, `disable_enigma2`, `disable_ministra`, `api_redirect`, `movie_year_append`, `log_clear`, `cleanup`, `fingerprint_max`, `bruteforce_mac_attempts`, `bruteforce_username_attempts`, `bruteforce_frequency`, `auto_update_lbs`, `update_version`, `dashboard_display_alt`, `dashboard_map`, `cpu_limit`, `mem_limit`, `detect_restream_servers`, `detect_restream_block_user`, `detect_restream_block_ip`, `detect_restream_ports`, `cloudflare`, `js_navigate`, `encrypt_playlist`, `encrypt_playlist_restreamer`, `stream_logs_save`, `restrict_same_ip`, `show_tickets`, `percentage_match`, `thread_count`, `scan_seconds`, `verify_host`, `max_genres`, `legacy_get`, `legacy_xmltv`, `mag_disable_ssl`, `hide_failures`, `legacy_panel_api`, `connection_loop_per`, `connection_loop_count`, `api_probe`, `max_simultaneous_downloads`, `restart_php_fpm`, `cache_playlists`, `send_xui_header`, `request_prebuffer`, `debug_show_errors`, `block_streaming_servers`, `block_proxies`, `ip_subnet_match`, `last_cache`, `last_cache_taken`, `ministra_allow_blank`, `enable_cache`, `legacy_mag_auth`, `ignore_invalid_users`, `on_demand_instant_off`, `on_demand_failure_exit`, `on_demand_wait_time`, `playlist_from_mysql`, `show_images`, `kill_rogue_ffmpeg`, `monitor_connection_status`, `stream_fail_sleep`, `custom_ip_header`, `send_protection_headers`, `send_altsvc_header`, `send_server_header`, `send_unique_header`, `send_unique_header_domain`, `max_items`, `restrict_playlists`, `mag_legacy_redirect`, `save_login_logs`, `save_restart_logs`, `keep_activity`, `keep_client`, `keep_login`, `keep_errors`, `keep_restarts`, `ignore_keyframes`, `seg_delete_threshold`, `fails_per_time`, `segment_type`, `thread_count_movie`, `thread_count_show`, `redirect_timeout`, `create_expiration`, `redis_handler`, `redis_password`, `force_epg_timezone`, `check_vod`, `max_encode_movies`, `max_encode_cc`, `queue_loop`, `cache_thread_count`, `cache_changes`, `player_blur`, `player_opacity`, `player_allow_playlist`, `player_allow_bouquet`, `player_hide_incompatible`, `player_allow_hevc`, `read_native_hls`, `keep_protocol`, `ffmpeg_cpu`, `ffmpeg_gpu`, `header_stats`, `mag_keep_extension`, `show_connected_video`, `connected_video_path`, `disallow_2nd_ip_max`, `probesize_ondemand`, `ffmpeg_warnings`, `vod_sort_newest`, `mag_message`, `mag_default_type`, `fps_delay`, `fps_check_type`, `show_category_duplicates`, `probe_extra_wait`, `restream_deny_unauthorised`, `extract_subtitles`) VALUES
> 	(1, 'XUI.one', 'Europe/London', '[]', 10, 'equal', 5000000, 1, '', 1, '', 1, '', 1, '', 'ts', 'ts', 5000000, '', 1, '["ALL"]', 3, 1, 1, 40, '', 2, 400, 8192, 10, 6, 'fit', 3, 1, 1, 1, 10, '[]', 'default', 1, '', 0, 0, 0, '', 'bouquet', 1, 0, 10, 0, 'https://speed.hetzner.de/100MB.bin', '', 'Welcome to XUI.one', 1, 1, 1, 1, 1, 0, 0, 'conn', 1, 1, '', 1, 1, 0, 0, 0, 1, 50, 0, 1, 10, 0, 1, 0, 20, 0, 1, 0, 0, 0, 'daily', '', '', '', '', 'python', 'en', 0, 0, 0, 0, 0, 0, 0, 'Y-m-d', 'Y-m-d H:i:s', 1, 7, 7, 2, 1, 0, 0, 0, 0, 0, 0, 0, 31, 1, 25, 10, 10, 300, 1, '1.1.0', 1, 0, 0, 0, 1, 0, 0, '[25461,25550,31210]', 0, 1, 1, 0, 1, 1, 0, 80, 50, 86400, 0, 3, 1, 1, 0, 0, 1, 0, 0, 1, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 20, 0, 1, 1, 1, 10, '', 0, 0, '', '', '', 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 4, 86400, 1, 5, 1, 5, 5, 0, '', 0, 0, 10, 1, 1, 10, 1, 0, 10, 1, 1, 0, 0, 1, 0, '4.0', '4.0', 1, 1, 1, NULL, 1, 256000, 1, 0, 'You can switch between the modern and legacy themes by using the <span class="label">Green</span> and <span class="label">Yellow</span> buttons on your remote control. Doing so will restart your device.', 0, 600, 1, 0, 10, 1, 0);
70077c69994
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
70134d70050
<   `direct_proxy` tinyint(1) DEFAULT 0,
70146,70147c70062
<   KEY `uuid` (`uuid`),
<   FULLTEXT KEY `search` (`stream_display_name`,`stream_source`,`notes`,`channel_id`)
---
>   KEY `uuid` (`uuid`)
70266,70267c70181
<   KEY `last_modified` (`last_modified`),
<   FULLTEXT KEY `search` (`title`,`plot`,`cast`,`director`)
---
>   KEY `last_modified` (`last_modified`)
70293,70296d70206
<   `audio_codec` varchar(64) COLLATE utf8_unicode_ci DEFAULT NULL,
<   `video_codec` varchar(64) COLLATE utf8_unicode_ci DEFAULT NULL,
<   `resolution` int(5) DEFAULT NULL,
<   `ondemand_check` int(16) DEFAULT NULL,
70318c70228
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
70397,70398c70307
<   KEY `password` (`password`),
<   FULLTEXT KEY `search` (`username`,`email`,`ip`,`notes`,`reseller_dns`)
---
>   KEY `password` (`password`)
70434d70342
<   `allow_change_bouquets` tinyint(1) DEFAULT 0,
70500c70408
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
70510c70418
< ) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=latin1;
70674,70677d70581
<   `target_container` varchar(64) DEFAULT NULL,
<   `server_add` varchar(512) DEFAULT NULL,
<   `direct_proxy` tinyint(1) DEFAULT 0,
<   `plex_token` varchar(512) DEFAULT NULL,
70679c70583
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
70690c70594
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
---
> ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
70699c70603
< ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
\ No newline at end of file
---
> ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
\ No newline at end of file
