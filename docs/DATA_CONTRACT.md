# Kontrak data kapal → Supabase

Dokumen ini dipakai bersama oleh tim web dan tim ROS. Satu node di NUC (`web_bridge`) menulis run, telemetri, dan event; satu node di Pi (`capture_uploader`) menulis foto. Website tidak pernah mengirim perintah ke kapal, dan kapal tidak membaca konfigurasi dari website.

Skema database lengkap: `supabase/migrations/20261127000000_init.sql`.

## Penulis dan kunci

| Data | Penulis | Kapan | Kunci idempoten |
| --- | --- | --- | --- |
| `runs` (buat, akhiri) | NUC `web_bridge` | Saat misi diluncurkan; saat finish, abort, atau retry | `id` (UUID v4 dari NUC) |
| `telemetry` | NUC `web_bridge` | 1 sampel per detik | `(run_id, t)` |
| `mission_events` | NUC `web_bridge`, dari state machine | Saat status fase berubah | `(run_id, phase, t)` |
| File di bucket `captures` + tabel `captures` | Pi `capture_uploader` | Setiap foto hasil imaging | `storage_path` |
| `runs` (label, resmi, catatan), `app_state`, `courses`, `course_items`, `captures.hidden` | Admin web | Manual | — |

Kunci idempoten membuat kiriman ulang (retry) aman: baris yang sama tidak akan tercatat dua kali.

## Koneksi

- Pakai HTTP biasa dengan `requests` (paket apt `python3-requests`), bukan supabase-py, supaya tidak perlu pip di Python sistem ROS.
- Satu secret key per perangkat: `nuc`, `pi`, dan `sim` (untuk simulator tim web). Buat di Supabase Dashboard > Project Settings > API Keys > Secret keys. Bila satu bocor, cabut key itu saja.
- Simpan di `~/.config/safinah/web.env` dengan izin `600`, berisi `SUPABASE_URL` dan `SUPABASE_SECRET_KEY`. Jangan ditaruh di repo, launch file, atau log.
- Header setiap request: `apikey` dan `Authorization: Bearer` berisi secret key yang sama (meniru supabase-js), `Content-Type: application/json`, `Prefer: resolution=ignore-duplicates,return=minimal`. Cek sekali dengan curl di awal integrasi.

| Aksi | Request | Sukses |
| --- | --- | --- |
| Buat run | `POST /rest/v1/runs?on_conflict=id` | 201 |
| Akhiri run | `PATCH /rest/v1/runs?id=eq.<run_id>` dengan `status`, `ended_at`, `end_reason` | 204 |
| Kirim telemetri | `POST /rest/v1/telemetry?on_conflict=run_id,t` (array) | 201 |
| Kirim event | `POST /rest/v1/mission_events?on_conflict=run_id,phase,t` | 201 |
| Unggah foto | `POST /storage/v1/object/captures/<path>` dengan `x-upsert: true` | 200 |
| Catat foto | `POST /rest/v1/captures?on_conflict=storage_path` | 201 |

## Siklus run

1. Operator meluncurkan misi dengan parameter `lintasan:=A` (atau `B`). Saat state machine masuk `preparation`, ia memanggil service `/web_bridge/start_run`.
2. Bridge membuat UUID v4, menyimpannya di `~/.safinah/current_run.json`, mengirim baris `runs` (`status: live`, `source: boat`), lalu menerbitkan `/safinah/run` dengan QoS transient local untuk Pi.
3. Telemetri dikirim sejak `preparation`, supaya juri bisa melihat GPS lock di dermaga.
4. Finish: run diakhiri dengan `status: ended`, `end_reason: finish`. Retry dari start: run lama `status: aborted`, `end_reason: retry`, lalu `start_run` lagi. Run yang gagal karena alasan lain: `status: aborted` dengan `end_reason` singkat.
5. Bila NUC restart di tengah run, bridge melanjutkan run dari file selama statusnya masih `live` dan umurnya di bawah 25 menit.

Contoh baris run:

```json
{
  "id": "6f1c2a4e-8b0d-4c1e-9f7a-2d3b4c5e6f70",
  "lintasan": "A",
  "source": "boat",
  "status": "live",
  "started_at": "2027-09-15T02:30:00.000Z"
}
```

## Telemetri (1 sampel per detik)

| Field | Tipe | Satuan dan aturan | Sumber |
| --- | --- | --- | --- |
| `run_id` | string | UUID run aktif | bridge |
| `t` | string | ISO 8601 UTC dengan milidetik, misalnya `2027-09-15T02:31:07.250Z` | jam NUC |
| `lat`, `lon` | number / null | Derajat WGS84, 7 desimal; null bila belum fix | `/mavros/global_position/global` |
| `sog_ms` | number | m/s, 2 desimal | `/mavros/gpsstatus/gps1/raw` `vel` (cm/s ÷ 100) |
| `cog_deg` | number / null | [0, 360) dari utara sejati, searah jarum jam; null bila SOG < 0,2 m/s | `gps1/raw` `cog` (cdeg ÷ 100; 65535 = null) |
| `heading_deg` | number | [0, 360), arah haluan. **Jangan diisi COG** | `/mavros/global_position/compass_hdg` |
| `battery_v` | number | Volt | `/mavros/battery` `voltage` |
| `battery_a` | number | Ampere, positif = discharge (cek tanda dari MAVROS) | `/mavros/battery` `current` |
| `battery_pct` | number / null | 0–100 | `/mavros/battery` `percentage` × 100 (aslinya 0–1) |
| `fcu_mode` | string | Mode ArduRover apa adanya (`AUTO`, `HOLD`, …) | `/mavros/state` `mode` |
| `armed` | bool | | `/mavros/state` `armed` |
| `fcu_connected` | bool | | `/mavros/state` `connected` |
| `gps_fix` | int | 0–6 (MAVLink GPS_FIX_TYPE) | `gps1/raw` `fix_type` |
| `gps_sats` | int | Jumlah satelit | `gps1/raw` `satellites_visible` |
| `mission_state` | string / null | Nama state apa adanya | state machine |
| `docking_phase` | string / null | Nama sub-fase docking | state machine |

Kirim semua key di setiap objek (null bila kosong), karena bulk insert butuh key yang seragam. Nama topik dicek dengan `ros2 topic list` saat integrasi. Bila plugin `gps_status` tidak aktif, SOG dan COG dihitung dari `/mavros/global_position/raw/gps_vel` (ENU: SOG = hypot(x, y), COG = atan2(x, y) dalam derajat).

Contoh satu sampel:

```json
{
  "run_id": "6f1c2a4e-8b0d-4c1e-9f7a-2d3b4c5e6f70",
  "t": "2027-09-15T02:31:07.250Z",
  "lat": -7.7650012,
  "lon": 110.3720015,
  "sog_ms": 1.23,
  "cog_deg": 45.5,
  "heading_deg": 44.1,
  "battery_v": 15.8,
  "battery_a": 6.2,
  "battery_pct": 82,
  "fcu_mode": "AUTO",
  "armed": true,
  "fcu_connected": true,
  "gps_fix": 3,
  "gps_sats": 14,
  "mission_state": "GATE_NAV",
  "docking_phase": null
}
```

## Event misi

- Fase (`phase`): `preparation`, `start`, `floating_ball_set`, `surface_imaging`, `underwater_imaging`, `docking`, `finish`.
- Status (`status`): `pending`, `active`, atau `done`. Fase yang belum punya event ditampilkan website sebagai pending.
- Dikirim hanya saat status fase berubah, ditambah `preparation: active` saat run dibuat.
- `detail` untuk `floating_ball_set`: `{"gate": 4, "total": 10}` setiap melewati gerbang. Untuk imaging: `{"slot": "SR", "photo": "<storage_path>"}`. Fase lain boleh `null`.
- Fase imaging menjadi `done` saat state machine selesai memotret. Sudah atau belumnya foto sampai terlihat di panel foto website, bukan dari status fase.
- Run yang gagal dicatat lewat `runs.status = aborted`, bukan lewat status fase.

Contoh:

```json
{
  "run_id": "6f1c2a4e-8b0d-4c1e-9f7a-2d3b4c5e6f70",
  "t": "2027-09-15T02:31:40.000Z",
  "phase": "floating_ball_set",
  "status": "active",
  "detail": { "gate": 4, "total": 10 }
}
```

## Foto

1. Pi menyimpan foto asli di SD card (`~/captures/<run_id>/<slot>/`) sebagai cadangan bukti.
2. Pi membuat versi web (sisi panjang 1280 px, JPEG kualitas 80, target di bawah 300 KB) dan thumbnail (320 px, kualitas 70). Batas bucket 4 MB per file, hanya JPEG/PNG.
3. Nama file: `runs/<run_id>/<slot>/<slot>_<YYYYMMDDTHHMMSSmmm>Z.jpg`, thumbnail berakhiran `_thumb.jpg`. Contoh: `runs/6f1c…/UL/UL_20270915T023210123Z.jpg`.
4. Unggah kedua file dulu, baru insert baris `captures`. Database menolak path di luar folder `runs/<run_id>/<slot>/`.
5. Posisi, SOG, COG, dan heading diambil dari sampel terakhir. `detection` berisi `[{"cls": "green_box", "conf": 0.91, "bbox": [x, y, w, h]}]` relatif 0–1 terhadap foto web. `meta` berisi `width`, `height`, `camera`.
6. Antrean foto disimpan di disk dan dicoba terus sampai berhasil, karena foto menentukan nilai imaging.

Slot per lintasan: A memakai UL + SR, B memakai SL + UR (S = surface, U = underwater, L/R = kiri/kanan).

## Antrean dan retry

- Sampel telemetri terbaru dikirim lebih dulu setiap detik; backlog dikirim terpisah dalam batch maksimal 100 baris. Dashboard langsung live lagi setelah sinyal pulih, jejak terisi menyusul.
- Timeout 5 detik per request. Untuk gangguan jaringan, 5xx, atau 429: coba lagi dengan jeda 1, 2, 4, 8, lalu paling lama 15 detik.
- 400 atau 422 berarti data salah: catat isi respons, buang batch itu, lanjut. 401 atau 403 berarti key salah: jangan buang data, berhenti kirim, tulis error di log ROS.
- Validasi di kapal dengan aturan yang sama seperti database (lat −90..90, lon −180..180, sudut dinormalkan ke [0, 360), NaN menjadi null), supaya satu nilai salah tidak menggagalkan satu batch.
- Telemetri boleh dibuang bila antrean lebih dari 1 jam. Event, status run, dan foto disimpan di disk dan tidak pernah dibuang.

## Jam

Chrony di NUC (NTP lewat 4G) dan Pi (sinkron ke NUC lewat LAN), target selisih di bawah 0,5 detik. `t` dipakai untuk urutan dan replay; `received_at` diisi server dan dipakai untuk mendeteksi keterlambatan. Semua mini PC memakai `ROS_DOMAIN_ID` yang sama.

## Laju dan kuota

- Setiap baris baru dihitung satu pesan Realtime per penonton, dan batas paket gratis 100 pesan per detik.
- Telemetri 1 Hz cukup untuk sekitar 90 penonton bersamaan dengan sisa untuk event dan foto; 2 Hz hanya sekitar 45. Rekaman detail tetap di rosbag kapal.
- Parameter `telemetry_hz` tetap ada di bridge (default 1, maksimum 2) untuk uji internal.

## Contoh kode

Python (dipakai `web_bridge` dan `capture_uploader`):

```python
import json
import os
from datetime import datetime, timezone

import requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
KEY = os.environ["SUPABASE_SECRET_KEY"]  # dari ~/.config/safinah/web.env
JSON_HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=ignore-duplicates,return=minimal",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def post_rows(table: str, rows: list[dict], on_conflict: str) -> int:
    """Kirim baris; 201 berarti berhasil (duplikat diabaikan)."""
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        params={"on_conflict": on_conflict},
        headers=JSON_HEADERS,
        data=json.dumps(rows),
        timeout=5,
    )
    return r.status_code


def upload_photo(path_in_bucket: str, jpeg_bytes: bytes) -> int:
    """Unggah ke bucket captures; 200 berarti berhasil. Aman diulang (x-upsert)."""
    r = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/captures/{path_in_bucket}",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        },
        data=jpeg_bytes,
        timeout=15,
    )
    return r.status_code
```

Uji cepat dengan curl:

```bash
source ~/.config/safinah/web.env
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "$SUPABASE_URL/rest/v1/runs?on_conflict=id" \
  -H "apikey: $SUPABASE_SECRET_KEY" -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=ignore-duplicates,return=minimal" \
  -d '{"id":"00000000-0000-4000-8000-000000000001","lintasan":"A","source":"sim","status":"live"}'
# 201 = berhasil. Hapus run uji ini dari halaman admin atau SQL Editor setelahnya.
```

## Memeriksa data di SQL Editor

```sql
-- 10 sampel terakhir run yang sedang diikuti dashboard
select t, lat, lon, sog_ms, cog_deg, heading_deg, received_at - t as delay
from telemetry
where run_id = (select live_run_id from app_state)
order by t desc
limit 10;

-- status terakhir tiap fase
select phase, status, detail, t
from mission_status
where run_id = (select live_run_id from app_state);
```
