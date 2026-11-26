# Third-party notices / procedencia

## DSH Our Free Model — visual tokens

- Upstream: https://github.com/Ebony-Vinyl/dsh-our-free-model
- Commit: `748d97a9dde64eb024be832bbaf66d27f6cfb4fd`
- Original path: `packages/standalone/frontend/system/tokens.css`
- Distributed path: `public/ofm-tokens.css` (upstream stylesheet preserved, with an added MIT attribution header)
- Copyright (c) 2026 Ebony-Vinyl
- License: MIT; upstream license, including its original appendix, preserved in `DSH-LICENSE.txt`.

Only this visual token stylesheet is vendored. No provider code, free-model gateway, account integration, prompt bundle or plugin executable is incorporated. The iux-zone layout and Tvheadend client are implemented in this repository.

## Tvheadend — external service, not vendored

- Upstream: https://github.com/tvheadend/tvheadend
- API source revision reviewed: `b1c4d2812bd363515e03282c416b39162cea6239`
- License: GNU GPL v3, with some source headers permitting later versions; consult the exact distribution and its notices.

The external engine keeps its name and licensing. This package does not include its binary or source, nor copies of its web interface. iux-zone communicates through HTTP API endpoints documented in its public handlers. If Tvheadend is modified or redistributed alongside iux-zone, meet the corresponding license and source-availability obligations; the integration does not grant an exception.

Reviewed API files include `src/api.c`, `src/api/api_input.c`, `api_mpegts.c`, `api_idnode.c`, `api_channel.c`, `api_service.c`, `api_status.c`, and `api_epg.c`. No TBS driver is included.
