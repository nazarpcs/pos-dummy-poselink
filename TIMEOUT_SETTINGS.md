# WebSocket Timeout Settings

Dokumentasi lengkap untuk konfigurasi timeout di WebSocket connection.

## Overview

Aplikasi POS Dummy memiliki dua jenis timeout untuk menangani berbagai skenario koneksi:

1. **Connection Timeout** - Timeout saat establish koneksi WebSocket
2. **Message Timeout** - Timeout saat menunggu response dari EDC

## Default Values

| Timeout Type | Default Value | Unit |
|--------------|---------------|------|
| Connection Timeout | 10000 | milliseconds (10 detik) |
| Message Timeout | 30000 | milliseconds (30 detik) |

## Connection Timeout

### Deskripsi
Waktu maksimal yang diberikan untuk establish koneksi WebSocket ke EDC. Jika koneksi tidak berhasil dalam waktu ini, koneksi akan ditutup dan akan mencoba reconnect.

### Kapan Digunakan
- Saat user klik tombol "Connect"
- Saat automatic reconnect setelah koneksi terputus
- Saat testing koneksi dengan tombol "Test Connection"

### Behavior
```
User klik Connect
    ↓
Start Connection Timeout (10 detik)
    ↓
[Waiting for WebSocket.onopen event]
    ↓
Jika onopen terpicu sebelum timeout → Koneksi berhasil ✅
Jika timeout tercapai → Koneksi ditutup, log error ❌
```

### Log Messages
```
✅ Sukses: "✅ WebSocket connected successfully"
❌ Timeout: "⏱️ Connection timeout (10000ms) - closing connection"
```

## Message Timeout

### Deskripsi
Waktu maksimal menunggu response dari EDC setelah mengirim pesan. Timeout ini bersifat informatif (warning) dan tidak akan menutup koneksi.

### Kapan Digunakan
- Setelah mengirim request transaksi (Sale, Contactless, dll)
- Setelah mengirim Card Verification request
- Setelah mengirim Cicilan request

### Behavior
```
User klik "Bayar Sekarang"
    ↓
Send message ke EDC
    ↓
Start Message Timeout (30 detik)
    ↓
[Waiting for response]
    ↓
Jika response diterima sebelum timeout → Process response ✅
Jika timeout tercapai → Log warning, tetap menunggu ⚠️
```

### Log Messages
```
✅ Response diterima: "[Response data ditampilkan]"
⚠️ Timeout: "⏱️ Message response timeout (30000ms) - no response received"
```

## Mengatur Timeout

### Via Browser Console

```javascript
// Set connection timeout ke 15 detik
ecrWs.setConnectionTimeout(15000);

// Set message timeout ke 45 detik
ecrWs.setMessageTimeout(45000);

// Lihat setting timeout saat ini
console.log(ecrWs.getTimeoutSettings());
// Output: { connectionTimeout: 15000, messageTimeout: 45000 }
```

### Rekomendasi Nilai

#### Jaringan Cepat (LAN lokal, <50ms latency)
```javascript
ecrWs.setConnectionTimeout(5000);   // 5 detik
ecrWs.setMessageTimeout(15000);     // 15 detik
```

#### Jaringan Normal (LAN, 50-100ms latency)
```javascript
ecrWs.setConnectionTimeout(10000);  // 10 detik (default)
ecrWs.setMessageTimeout(30000);     // 30 detik (default)
```

#### Jaringan Lambat (WAN, >100ms latency)
```javascript
ecrWs.setConnectionTimeout(20000);  // 20 detik
ecrWs.setMessageTimeout(60000);     // 60 detik
```

#### Testing/Development
```javascript
ecrWs.setConnectionTimeout(10000);  // 10 detik
ecrWs.setMessageTimeout(30000);     // 30 detik
```

## Troubleshooting

### Problem: "Connection timeout" error saat connect

**Penyebab:**
- EDC tidak responsif
- Jaringan lambat
- Port EDC tidak terbuka
- EDC offline

**Solusi:**
1. Cek apakah EDC aktif dan online
2. Cek apakah port 6745 (WS) atau 6746 (WSS) terbuka
3. Naikkan connection timeout:
   ```javascript
   ecrWs.setConnectionTimeout(20000); // 20 detik
   ```
4. Coba reconnect

### Problem: "Message response timeout" warning saat transaksi

**Penyebab:**
- EDC sedang processing transaksi (normal untuk transaksi kompleks)
- Jaringan lambat
- EDC overload

**Solusi:**
1. Tunggu response (timeout ini hanya warning, bukan error)
2. Jika sering terjadi, naikkan message timeout:
   ```javascript
   ecrWs.setMessageTimeout(60000); // 60 detik
   ```
3. Cek kondisi jaringan dan EDC

### Problem: Koneksi sering terputus

**Penyebab:**
- Jaringan tidak stabil
- EDC timeout
- Firewall/router issue

**Solusi:**
1. Cek stabilitas jaringan
2. Naikkan timeout values:
   ```javascript
   ecrWs.setConnectionTimeout(15000);
   ecrWs.setMessageTimeout(45000);
   ```
3. Cek firewall/router settings
4. Restart EDC dan POS

## Technical Details

### Connection Timeout Implementation

```javascript
// Di dalam method connect()
this.connectionTimeoutId = setTimeout(() => {
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
        log(`⏱️ Connection timeout (${this.connectionTimeout}ms) - closing connection`, 'error');
        this.ws.close();
        reject(new Error(`Connection timeout after ${this.connectionTimeout}ms`));
    }
}, this.connectionTimeout);

// Timeout dibatalkan jika koneksi berhasil
this.ws.onopen = () => {
    if (this.connectionTimeoutId) {
        clearTimeout(this.connectionTimeoutId);
        this.connectionTimeoutId = null;
    }
    // ... rest of onopen handler
};
```

### Message Timeout Implementation

```javascript
// Di dalam method send()
if (this.messageTimeoutId) {
    clearTimeout(this.messageTimeoutId);
}
this.messageTimeoutId = setTimeout(() => {
    log(`⏱️ Message response timeout (${this.messageTimeout}ms) - no response received`, 'warning');
    this.messageTimeoutId = null;
}, this.messageTimeout);
```

### Cleanup on Disconnect

```javascript
// Di dalam method disconnect()
if (this.connectionTimeoutId) {
    clearTimeout(this.connectionTimeoutId);
    this.connectionTimeoutId = null;
}
if (this.messageTimeoutId) {
    clearTimeout(this.messageTimeoutId);
    this.messageTimeoutId = null;
}
```

## Best Practices

1. **Jangan set timeout terlalu rendah** - Bisa menyebabkan false timeout errors
2. **Jangan set timeout terlalu tinggi** - User experience akan terasa lambat
3. **Test dengan jaringan yang sama** - Timeout optimal tergantung kondisi jaringan
4. **Monitor Activity Log** - Lihat pattern timeout untuk optimize settings
5. **Dokumentasikan setting** - Catat timeout values yang optimal untuk setiap lokasi

## Monitoring

### Via Activity Log

Aplikasi akan menampilkan timeout events di Activity Log:

```
[INFO] Connecting to wss://192.168.1.10:6746...
[INFO] Creating WebSocket connection to: wss://192.168.1.10:6746
[SUCCESS] ✅ WebSocket connected successfully
[SENT] Sent: {"amount":1000,"action":"Sale",...}
[WARNING] ⏱️ Message response timeout (30000ms) - no response received
[INFO] Received: {"rc":"00","status":"success",...}
```

### Via Browser Console

```javascript
// Lihat timeout settings
ecrWs.getTimeoutSettings();

// Monitor timeout events
console.log('Connection Timeout:', ecrWs.connectionTimeout);
console.log('Message Timeout:', ecrWs.messageTimeout);
```

## Related Documentation

- [README.md](README.md) - Dokumentasi utama
- [SSL_PINNING.md](SSL_PINNING.md) - SSL/TLS configuration
- [SOP_DEPLOYMENT_DOMAIN.md](SOP_DEPLOYMENT_DOMAIN.md) - Deployment guide
