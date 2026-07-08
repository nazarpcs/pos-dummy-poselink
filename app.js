/**
 * POS Dummy - ECR Link WebSocket Client
 * Technical Implementation based on ECR Link FMS BRI Documentation v4.9.0
 * 
 * Features:
 * - WebSocket Secure (WSS) on port 6746
 * - WebSocket (WS) on port 6745
 * - AES/ECB/PKCS5Padding encryption
 * - Multiple action types: Sale, Contactless, Card Verification, etc.
 */

// ===== State Management =====
const state = {
    // Connection
    ws: null,
    isConnected: false,
    isConnecting: false,
    connectionUrl: '',
    lastConnected: null,
    totalTransactions: 0,
    
    // Settings
    settings: {
        connectionType: 'wss',  // 'wss', 'ws', or 'api'
        protocol: 'wss',
        edcIp: '',  // User inputs IP address directly (e.g., "192.168.1.10")
        edcPort: '6746',
        posAddress: '172.0.0.1',
        secretKey: 'ECR2022secretKey',
        // Action types: Sale, Contactless, CardVerification, SaleCompletion, Cicilan, Void, CheckStatus
        actionType: 'Sale',
        // API settings (for middleware connection)
        apiUrl: 'https://development-ecrlink.pcsindonesia.com',
        apiTimeout: 60,  // POS-side timeout in seconds for API mode
        mid: '',
        tid: '',
        // WebSocket timeout settings
        wsConnectionTimeout: 10000,
        wsMessageTimeout: 30000
    },
    
    // Menu & Cart
    menuItems: [
        { id: 1, name: 'Nasi Goreng', category: 'Makanan', price: 1 },
        { id: 2, name: 'Mie Goreng', category: 'Makanan', price: 1 },
        { id: 3, name: 'Ayam Goreng', category: 'Makanan', price: 1 },
        { id: 4, name: 'Es Teh', category: 'Minuman', price: 1 },
        { id: 5, name: 'Es Jeruk', category: 'Minuman', price: 1 },
        { id: 6, name: 'Kopi', category: 'Minuman', price: 1 },
        { id: 7, name: 'Kerupuk', category: 'Snack', price: 1 },
        { id: 8, name: 'Pisang Goreng', category: 'Snack', price: 1 },
    ],
    cart: [],
    
    // Transaction tracking
    currentTransaction: null,
    currentTransactionTimeoutHandler: null,
    lastApiRequest: null,
    transactionStartTime: null,
    transactionEndTime: null,
    
    // Pending UI state (countdown + manual retry)
    pendingCountdownInterval: null,
    currentApiAbortController: null,
    userRequestedRetry: false,
    statusPollInterval: null,
    statusPollInFlight: false,
    lastWsTransaction: null,
    
    // Logs
    logs: []
};

// ===== WebSocket Connection =====
class ECRLinkWebSocket {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 3000;
        this.connectionTimeout = 10000; // 10 seconds timeout for connection
        this.messageTimeout = 30000; // 30 seconds timeout for message response
        this.connectionTimeoutId = null;
        this.messageTimeoutId = null;
        this.connectionResolved = false; // Track if connection already resolved
    }

    connect(url) {
        return new Promise((resolve, reject) => {
            if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
                log('WebSocket already connected or connecting', 'warning');
                resolve();
                return;
            }

            state.isConnecting = true;
            updateConnectionStatus();
            log(`Connecting to ${url}...`, 'info');

            this.connectionResolved = false; // Reset flag for new connection attempt

            try {
                log(`Creating WebSocket connection to: ${url}`, 'info');
                this.ws = new WebSocket(url);
                
                // Set connection timeout
                this.connectionTimeoutId = setTimeout(() => {
                    if (!this.connectionResolved && this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                        this.connectionResolved = true;
                        
                        log('========================================', 'error');
                        log('⏱️ Connection Timeout', 'error');
                        log('========================================', 'error');
                        log(`Timeout Duration: ${this.connectionTimeout}ms`, 'error');
                        log(`Connection URL: ${url}`, 'info');
                        log(`Protocol: ${url.startsWith('wss://') ? 'WSS (Secure)' : 'WS (Non-Secure)'}`, 'info');
                        log(`Timestamp: ${new Date().toLocaleString()}`, 'info');
                        log('========================================', 'error');
                        log('💡 Possible causes:', 'info');
                        log('   1. EDC tidak aktif atau tidak merespon', 'info');
                        log('   2. Port ' + (url.includes('6746') ? '6746 (WSS)' : '6745 (WS)') + ' tidak terbuka', 'info');
                        log('   3. Jaringan terputus atau latency tinggi', 'info');
                        log('   4. Firewall memblokir koneksi', 'info');
                        
                        this.ws.close();
                        state.isConnecting = false;
                        updateConnectionStatus();
                        reject(new Error(`Connection timeout after ${this.connectionTimeout}ms`));
                    }
                }, this.connectionTimeout);
                
                this.ws.onopen = () => {
                    // Clear connection timeout on successful connection
                    if (this.connectionTimeoutId) {
                        clearTimeout(this.connectionTimeoutId);
                        this.connectionTimeoutId = null;
                    }
                    
                    if (!this.connectionResolved) {
                        this.connectionResolved = true;
                        
                        log('========================================', 'success');
                        log('✅ WebSocket Connected Successfully', 'success');
                        log('========================================', 'success');
                        log(`Connected at: ${new Date().toLocaleTimeString('id-ID', { hour12: false })}`, 'success');
                        log(`WebSocket State: OPEN (${this.ws.readyState})`, 'success');
                        log(`URL: ${url}`, 'success');
                        log('========================================', 'success');
                        
                        state.isConnected = true;
                        state.isConnecting = false;
                        state.lastConnected = new Date();
                        this.reconnectAttempts = 0;
                        updateConnectionStatus();
                        updateInfoPanel();
                        resolve();
                    }
                };

                this.ws.onmessage = (event) => {
                    // Clear message timeout when response received
                    if (this.messageTimeoutId) {
                        clearTimeout(this.messageTimeoutId);
                        this.messageTimeoutId = null;
                    }
                    handleMessage(event.data);
                };

                this.ws.onerror = (error) => {
                    // Clear connection timeout on error
                    if (this.connectionTimeoutId) {
                        clearTimeout(this.connectionTimeoutId);
                        this.connectionTimeoutId = null;
                    }
                    
                    if (!this.connectionResolved) {
                        this.connectionResolved = true;
                        
                        log('========================================', 'error');
                        log('❌ WebSocket Error Occurred', 'error');
                        log('========================================', 'error');
                        log(`Error: ${error.message || 'Unknown error'}`, 'error');
                        log(`Connection URL: ${url}`, 'info');
                        log(`Protocol: ${url.startsWith('wss://') ? 'WSS (Secure)' : 'WS (Non-Secure)'}`, 'info');
                        log(`Timestamp: ${new Date().toLocaleString()}`, 'info');
                        log('========================================', 'error');
                        
                        console.error('WebSocket error:', error);
                        
                        // Provide more detailed error info
                        const protocol = url.startsWith('wss://') ? 'WSS (Secure)' : 'WS (Non-Secure)';
                        log(`Connection type: ${protocol}`, 'info');
                        log(`Target: ${url.replace(/wss?:\/\//, '')}`, 'info');
                        
                        state.isConnecting = false;
                        updateConnectionStatus();
                        reject(error);
                    }
                };

                this.ws.onclose = (event) => {
                    // Clear connection timeout on close
                    if (this.connectionTimeoutId) {
                        clearTimeout(this.connectionTimeoutId);
                        this.connectionTimeoutId = null;
                    }
                    
                    let closeReason = event.reason || 'No reason provided';
                    let errorHint = '';
                    
                    // Check if disconnect is from simulation
                    const isSimulation = (state.settings.wsDisconnectOnSend || state.settings.wsDisconnectAfter > 0);
                    
                    // Log disconnect details
                    log('========================================', 'warning');
                    log('🔌 WebSocket Disconnected', 'warning');
                    log('========================================', 'warning');
                    log(`Close Code: ${event.code}`, 'info');
                    log(`Close Reason: ${closeReason}`, 'info');
                    log(`Was Clean: ${event.wasClean}`, 'info');
                    
                    if (isSimulation) {
                        log('🔴 [SIMULATION] Disconnect triggered by simulation settings', 'warning');
                        if (state.settings.wsDisconnectOnSend) {
                            log('   - Disconnect immediately on send: ON', 'info');
                        }
                        if (state.settings.wsDisconnectAfter > 0) {
                            log(`   - Disconnect after delay: ${state.settings.wsDisconnectAfter}ms`, 'info');
                        }
                    } else {
                        log('🔴 [REAL] Disconnect triggered by network/EDC', 'warning');
                    }
                    
                    log(`Connection URL: ${url}`, 'info');
                    log(`Protocol: ${url.startsWith('wss://') ? 'WSS (Secure)' : 'WS (Non-Secure)'}`, 'info');
                    log(`Reconnect Attempts: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`, 'info');
                    log('========================================', 'warning');
                    
                    // Provide helpful hints based on close code
                    switch(event.code) {
                        case 1006:
                            closeReason = 'Abnormal closure (Code 1006)';
                            if (url.startsWith('wss://')) {
                                // Check if running on GitHub Pages (HTTPS)
                                if (window.location.hostname.includes('github.io')) {
                                    errorHint = '🚨 GITHUB PAGES DETECTED: HTTPS site tidak bisa connect ke WSS dengan self-signed cert. ';
                                    errorHint += 'SOLUSI: (1) Gunakan Domain Mode + Setup Hosts File, atau (2) Jalankan di Local Server (python3 -m http.server 3000). ';
                                    errorHint += 'Lihat SOP_DEPLOYMENT_DOMAIN.md untuk detail.';
                                } else {
                                    errorHint = '🚨 SSL PINNING ISSUE: EDC menggunakan self-signed certificate. ';
                                    errorHint += 'Browser tidak bisa bypass SSL validation. ';
                                    errorHint += 'SOLUSI: (1) Ganti ke WS port 6745 + Local Server, atau (2) Accept certificate di browser, atau (3) Gunakan Electron app. ';
                                    errorHint += 'Lihat SSL_PINNING.md untuk detail.';
                                }
                            } else {
                                errorHint = '💡 HINT: Cek apakah ECR Link aktif dan port 6745 terbuka.';
                            }
                            break;
                        case 1001:
                            closeReason = 'Going away (Code 1001)';
                            errorHint = '💡 Server menutup koneksi dengan normal (graceful shutdown).';
                            break;
                        case 1002:
                            closeReason = 'Protocol error (Code 1002)';
                            errorHint = '🚨 Protocol error - mungkin ada masalah dengan format data atau komunikasi.';
                            break;
                        case 1005:
                            closeReason = 'No status code (Code 1005)';
                            errorHint = '💡 Koneksi ditutup tanpa status code - mungkin jaringan terputus.';
                            break;
                        case 1015:
                            closeReason = 'TLS Handshake failed (Code 1015)';
                            errorHint = '💡 HINT: SSL/TLS certificate EDC bermasalah. Pastikan EDC support WSS dengan certificate yang valid.';
                            break;
                    }
                    
                    log(`⚠️ WebSocket closed: ${closeReason}`, 'warning');
                    if (errorHint) {
                        log(errorHint, 'info');
                    }
                    
                    state.isConnected = false;
                    state.isConnecting = false;
                    updateConnectionStatus();
                    
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, 'info');
                        setTimeout(() => this.connect(url), this.reconnectDelay);
                    } else {
                        log('❌ Max reconnection attempts reached', 'error');
                        log('💡 Silakan cek:', 'info');
                        log('   1. Apakah ECR Link di EDC sudah aktif?', 'info');
                        log('   2. Apakah port ' + (url.includes('6746') ? '6746 (WSS)' : '6745 (WS)') + ' terbuka?', 'info');
                        log('   3. Apakah POS dan EDC di jaringan yang sama?', 'info');
                        log('   4. Coba ganti protocol WSS ↔ WS', 'info');
                    }
                };
            } catch (error) {
                // Clear connection timeout on exception
                if (this.connectionTimeoutId) {
                    clearTimeout(this.connectionTimeoutId);
                    this.connectionTimeoutId = null;
                }
                
                if (!this.connectionResolved) {
                    this.connectionResolved = true;
                    log(`Failed to create WebSocket: ${error.message}`, 'error');
                    state.isConnecting = false;
                    updateConnectionStatus();
                    reject(error);
                }
            }
        });
    }

    disconnect() {
        // Clear all timeouts
        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
            this.connectionTimeoutId = null;
        }
        if (this.messageTimeoutId) {
            clearTimeout(this.messageTimeoutId);
            this.messageTimeoutId = null;
        }
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        state.isConnected = false;
        state.isConnecting = false;
        updateConnectionStatus();
        log('Disconnected from EDC', 'info');
    }

    send(data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            log('Cannot send: WebSocket is not connected', 'error');
            return false;
        }

        try {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            this.ws.send(message);
            log(`Sent: ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}`, 'sent');
            
            // Simulate WebSocket disconnect if configured
            const disconnectOnSend = state.settings.wsDisconnectOnSend || false;
            const disconnectAfter = state.settings.wsDisconnectAfter || 0;
            
            if (disconnectOnSend) {
                log('🔌 [SIMULATION] WebSocket disconnect immediately on send', 'warning');
                setTimeout(() => {
                    if (this.ws) {
                        this.ws.close();
                        log('🔌 [SIMULATION] WebSocket disconnected', 'warning');
                    }
                }, 100);
            } else if (disconnectAfter > 0) {
                log(`🔌 [SIMULATION] WebSocket will disconnect after ${disconnectAfter}ms`, 'warning');
                setTimeout(() => {
                    if (this.ws) {
                        this.ws.close();
                        log(`🔌 [SIMULATION] WebSocket disconnected after ${disconnectAfter}ms`, 'warning');
                    }
                }, disconnectAfter);
            }
            
            // Set message timeout for response
            if (this.messageTimeoutId) {
                clearTimeout(this.messageTimeoutId);
            }
            this.messageTimeoutId = setTimeout(() => {
                log('========================================', 'warning');
                log('⏱️ Message Response Timeout', 'warning');
                log('========================================', 'warning');
                log(`Timeout Duration: ${this.messageTimeout}ms`, 'warning');
                log(`Timestamp: ${new Date().toLocaleString()}`, 'info');
                log('========================================', 'warning');
                log('💡 Possible causes:', 'info');
                log('   1. EDC sedang processing transaksi (normal untuk transaksi kompleks)', 'info');
                log('   2. Jaringan lambat atau latency tinggi', 'info');
                log('   3. EDC overload atau tidak responsif', 'info');
                log('   4. WebSocket connection terputus', 'info');
                log('', 'info');
                log('💡 Action: Cek status transaksi atau retry transaksi', 'info');
                
                this.messageTimeoutId = null;
            }, this.messageTimeout);
            
            return true;
        } catch (error) {
            log(`Send failed: ${error.message}`, 'error');
            return false;
        }
    }

    // Set connection timeout (in milliseconds)
    setConnectionTimeout(ms) {
        this.connectionTimeout = ms;
        log(`Connection timeout set to ${ms}ms`, 'info');
    }

    // Set message response timeout (in milliseconds)
    setMessageTimeout(ms) {
        this.messageTimeout = ms;
        log(`Message timeout set to ${ms}ms`, 'info');
    }

    // Get current timeout settings
    getTimeoutSettings() {
        return {
            connectionTimeout: this.connectionTimeout,
            messageTimeout: this.messageTimeout
        };
    }
}

const ecrWs = new ECRLinkWebSocket();

// ===== AES/ECB/PKCS5Padding Encryption (Java-compatible) =====
const ECREncryption = {
    /**
     * Encrypt using AES-ECB-PKCS5Padding - Java compatible
     * Using CryptoJS library
     */
    encrypt(strToEncrypt, secretKey = state.settings.secretKey) {
        try {
            // Generate key using SHA-1 (same as Java)
            const keyHash = CryptoJS.SHA1(secretKey);
            // Take first 16 bytes (128 bits) - same as Arrays.copyOf(key, 16) in Java
            const keyHex = keyHash.toString(CryptoJS.enc.Hex).substring(0, 32);
            const key = CryptoJS.enc.Hex.parse(keyHex);
            
            // Encrypt using AES-ECB with PKCS5/PKCS7 padding
            // CryptoJS uses PKCS7 by default which is same as PKCS5 for AES block size
            const encrypted = CryptoJS.AES.encrypt(
                strToEncrypt,
                key,
                {
                    mode: CryptoJS.mode.ECB,
                    padding: CryptoJS.pad.Pkcs7
                }
            );
            
            // Return Base64 string (same as Java Base64.getEncoder())
            return encrypted.toString();
        } catch (error) {
            log(`Encryption error: ${error.message}`, 'error');
            throw error;
        }
    },

    /**
     * Generate encrypted token for ECR Link
     */
    generateToken(payload) {
        const jsonString = JSON.stringify(payload);
        return this.encrypt(jsonString);
    }
};

// ===== Payload Builders =====
const PayloadBuilder = {
    /**
     * Get current timestamp in format: yyyy-mm-dd HH:MM:SS
     */
    getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    /**
     * Generate unique transaction ID
     */
    generateTrxId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `TXN${timestamp}${random}`;
    },

    /**
     * Build Sale payload
     * action: "Sale"
     * method: "purchase" | "brizzi" | "qris"
     */
    buildSale(amount, method = 'purchase') {
        return {
            amount: amount,
            action: 'Sale',
            trx_id: this.generateTrxId(),
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: method
        };
    },

    /**
     * Build Contactless payload
     * action: "Contactless"
     * method: "purchase"
     */
    buildContactless(amount) {
        return {
            amount: amount,
            action: 'Contactless',
            trx_id: this.generateTrxId(),
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: 'purchase'
        };
    },

    /**
     * Build Card Verification payload
     * action: "Card Verification"
     * method: "purchase"
     */
    buildCardVerification(amount) {
        return {
            amount: amount,
            action: 'Card Verification',
            trx_id: this.generateTrxId(),
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: 'purchase'
        };
    },

    /**
     * Build Sale Completion payload
     * action: "Sale Completion"
     * method: "purchase"
     * requires: approval code from Card Verification
     */
    buildSaleCompletion(amount, approvalCode) {
        return {
            amount: amount,
            action: 'Sale Completion',
            trx_id: this.generateTrxId(),
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: 'purchase',
            approval: approvalCode
        };
    },

    /**
     * Build Cicilan (Installment) payload
     * action: "Cicilan"
     * method: "purchase"
     */
    buildCicilan(amount, plan, periode) {
        return {
            amount: amount,
            action: 'Cicilan',
            trx_id: this.generateTrxId(),
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: 'purchase',
            plan: plan,
            periode: periode
        };
    },

    /**
     * Build Void payload
     * action: "Void"
     * method: "purchase" | "brizzi"
     */
    buildVoid(traceNumber, method = 'purchase') {
        return {
            action: 'Void',
            trace_number: traceNumber,
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: method
        };
    },

    /**
     * Build Settlement payload
     * action: "Settlement"
     * method: "purchase" | "brizzi"
     */
    buildSettlement(method = 'purchase') {
        return {
            amount: '0',
            action: 'Settlement',
            trx_id: this.generateTrxId(),
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: method
        };
    },

    /**
     * Build Check Status QR payload
     * action: "Check Status"
     * method: "qris"
     */
    buildCheckStatus(referenceNumber) {
        return {
            action: 'Check Status',
            reference_number: referenceNumber,
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: 'qris'
        };
    },

    /**
     * Build Refund QRIS payload
     * action: "Refund Qris"
     * method: "qris"
     * Berdasarkan dokumentasi POSe Link v4.13.0 section 4.9
     */
    buildRefundQris(amount, reffId) {
        return {
            action: 'Refund Qris',
            reff_id: reffId,
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: 'qris'
        };
    },

    /**
     * Build QRIS TAP payload
     * action: "Sale"
     * method: "qris_tap"
     */
    buildQrisTap(amount) {
        return {
            amount: amount,
            action: 'Sale',
            trx_id: this.generateTrxId(),
            pos_address: state.settings.posAddress,
            time_stamp: this.getTimestamp(),
            method: 'qris_tap'
        };
    }
};

// ===== Logging =====
function log(message, type = 'info') {
    const timestamp = new Date();
    const timeStr = timestamp.toLocaleTimeString('id-ID', { hour12: false });
    
    const logEntry = {
        time: timeStr,
        type: type.toUpperCase(),
        message: message,
        timestamp: timestamp
    };
    
    state.logs.push(logEntry);
    
    // Keep only last 1000 logs
    if (state.logs.length > 1000) {
        state.logs.shift();
    }
    
    renderLogs();
    
    // Console styling based on type
    let consoleStyle = '';
    let consoleMethod = console.log;
    
    switch(type) {
        case 'error':
            consoleStyle = 'color: #ff4444; font-weight: bold;';
            consoleMethod = console.error;
            break;
        case 'warning':
            consoleStyle = 'color: #ffaa00; font-weight: bold;';
            consoleMethod = console.warn;
            break;
        case 'success':
            consoleStyle = 'color: #00cc44; font-weight: bold;';
            break;
        case 'received':
            consoleStyle = 'color: #0099ff; font-weight: bold;';
            break;
        case 'sent':
            consoleStyle = 'color: #9900ff; font-weight: bold;';
            break;
        default:
            consoleStyle = 'color: #666666;';
    }
    
    // Log to console with styling
    consoleMethod(`%c[${timeStr}] [${logEntry.type}] ${message}`, consoleStyle);
}

function renderLogs() {
    const container = document.getElementById('logContainer');
    if (!container) return;
    
    container.innerHTML = state.logs.map(entry => `
        <div class="log-entry">
            <span class="log-time">${entry.time}</span>
            <span class="log-type ${entry.type.toLowerCase()}">${entry.type}</span>
            <span class="log-message">${escapeHtml(entry.message)}</span>
        </div>
    `).join('');
    
    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function clearLogs() {
    state.logs = [];
    renderLogs();
    log('Logs cleared', 'info');
}

function exportLogs() {
    const content = state.logs.map(l => `[${l.time}] [${l.type}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    log('Logs exported', 'success');
}

// ===== UI Functions =====
function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    const connectBtn = document.getElementById('connectBtn');
    
    if (!statusEl) return;
    
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');
    
    dot.classList.remove('connected', 'connecting', 'disconnected');
    
    if (state.isConnected) {
        dot.classList.add('connected');
        text.textContent = 'Connected';
        connectBtn.innerHTML = '<i class="fas fa-unlink"></i><span>Disconnect</span>';
    } else if (state.isConnecting) {
        dot.classList.add('connecting');
        text.textContent = 'Connecting...';
        connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Connecting...</span>';
    } else {
        dot.classList.add('disconnected');
        text.textContent = 'Disconnected';
        connectBtn.innerHTML = '<i class="fas fa-plug"></i><span>Connect</span>';
    }
}

function updateInfoPanel() {
    const connectionType = state.settings.connectionType || 'wss';
    document.getElementById('infoStatus').textContent = state.isConnected ? 'Connected' : 'Disconnected';
    document.getElementById('infoConnectionType').textContent = connectionType.toUpperCase();
    
    // Handle API connection type
    if (connectionType === 'api') {
        document.getElementById('infoUrlLabel').textContent = 'API URL';
        document.getElementById('infoUrl').textContent = state.settings.apiUrl || 'https://development-ecrlink.pcsindonesia.com';
        
        // Show MID/TID row
        const midTidRow = document.getElementById('infoMidTidRow');
        if (midTidRow) {
            midTidRow.style.display = 'flex';
            document.getElementById('infoMidTid').textContent = `${state.settings.mid || '-'} / ${state.settings.tid || '-'}`;
        }
    } else {
        document.getElementById('infoUrlLabel').textContent = 'WebSocket URL';
        
        // Show IP in info URL
        let displayUrl = state.connectionUrl || '-';
        if (state.settings.edcIp && !state.isConnected) {
            displayUrl = `${state.settings.protocol}://${state.settings.edcIp}:${state.settings.edcPort}`;
        }
        document.getElementById('infoUrl').textContent = displayUrl;
        
        // Hide MID/TID row
        const midTidRow = document.getElementById('infoMidTidRow');
        if (midTidRow) midTidRow.style.display = 'none';
    }
    
    document.getElementById('infoLastConnected').textContent = state.lastConnected ? state.lastConnected.toLocaleString('id-ID') : '-';
    document.getElementById('infoTotalTrans').textContent = state.totalTransactions;
}

function toggleConnection() {
    if (state.isConnected || state.isConnecting) {
        ecrWs.disconnect();
    } else {
        connectToEDC();
    }
}

async function connectToEDC() {
    const ip = state.settings.edcIp;
    
    if (!ip) {
        showToast('Error', 'Please configure EDC IP Address in Settings', 'error');
        switchTab('settings');
        return;
    }
    
    const protocol = state.settings.protocol;
    const port = state.settings.edcPort || (protocol === 'wss' ? '6746' : '6745');
    const url = `${protocol}://${ip}:${port}`;
    
    state.connectionUrl = url;
    
    // Apply timeout settings from configuration
    const connectionTimeout = state.settings.wsConnectionTimeout || 10000;
    const messageTimeout = state.settings.wsMessageTimeout || 30000;
    ecrWs.setConnectionTimeout(connectionTimeout);
    ecrWs.setMessageTimeout(messageTimeout);
    
    log('========================================', 'info');
    log(`🚀 Starting connection attempt`, 'info');
    log(`📡 Protocol: ${protocol.toUpperCase()}`, 'info');
    log(`🌐 IP: ${ip}`, 'info');
    log(`🔌 Port: ${port}`, 'info');
    log(`🔗 Full URL: ${url}`, 'info');
    log(`⏱️ Connection Timeout: ${connectionTimeout}ms`, 'info');
    log(`⏱️ Message Timeout: ${messageTimeout}ms`, 'info');
    log('========================================', 'info');
    
    try {
        await ecrWs.connect(url);
        showToast('Connected', 'Successfully connected to EDC', 'success');
    } catch (error) {
        showToast('Connection Failed', 'Check Activity Log for details', 'error');
    }
}

async function testConnection() {
    saveSettingsToState();
    
    if (state.settings.connectionType === 'api') {
        await testAPIConnection();
    } else {
        // Apply timeout settings before testing
        const connectionTimeout = state.settings.wsConnectionTimeout || 10000;
        const messageTimeout = state.settings.wsMessageTimeout || 30000;
        ecrWs.setConnectionTimeout(connectionTimeout);
        ecrWs.setMessageTimeout(messageTimeout);
        
        connectToEDC();
    }
}

/**
 * Test API connection to middleware
 */
async function testAPIConnection() {
    log('========================================', 'info');
    log('🔌 API CONNECTION TEST', 'info');
    log('========================================', 'info');
    
    if (!state.settings.mid || !state.settings.tid) {
        log('❌ MID and TID must be configured', 'error');
        showToast('Error', 'Please configure MID and TID in Settings', 'error');
        return;
    }
    
    log(`API URL: ${state.settings.apiUrl}`, 'info');
    log(`MID: ${state.settings.mid}`, 'info');
    log(`TID: ${state.settings.tid}`, 'info');
    log('', 'info');

    // ── Step 1: Health check middleware ──────────────────────────────────────
    log('📡 Step 1: Checking middleware health...', 'info');
    let middlewareOk = false;
    try {
        const healthUrl = `${state.settings.apiUrl}/health`;
        const healthRes = await fetch(healthUrl, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
        });
        const healthData = await healthRes.json().catch(() => ({}));
        if (healthRes.ok && (healthData.status?.toLowerCase() === 'healthy' || healthData.status?.toLowerCase() === 'ok')) {
            log(`✅ Middleware healthy: ${JSON.stringify(healthData)}`, 'success');
            middlewareOk = true;
        } else {
            log(`⚠️ Middleware health check: HTTP ${healthRes.status} - ${JSON.stringify(healthData)}`, 'warning');
            middlewareOk = true; // server reachable meskipun status tidak "healthy"
        }
    } catch (e) {
        log(`❌ Middleware tidak dapat dijangkau: ${e.message}`, 'error');
        log(`   Pastikan POS terhubung ke internet dan URL middleware benar`, 'info');
    }

    // ── Step 2: Validate MID/TID terdaftar di middleware ─────────────────────
    log('', 'info');
    log('🔑 Step 2: Validating MID/TID ke middleware...', 'info');
    try {
        const apiUrl = `${state.settings.apiUrl}/api/v1/transaction`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ test: true }),
            signal: AbortSignal.timeout(8000)
        });
        const testBody = await response.json().catch(() => ({}));
        const errMsg = testBody?.error || '';
        const isValidationError = errMsg.toLowerCase().includes('required') ||
                                  errMsg.toLowerCase().includes('token') ||
                                  errMsg.toLowerCase().includes('transaction_id') ||
                                  errMsg.toLowerCase().includes('mid') ||
                                  errMsg.toLowerCase().includes('tid');
        if ((response.status === 400) && isValidationError) {
            log(`✅ Endpoint transaction OK (validation error expected): "${errMsg}"`, 'success');
        } else if (errMsg.toLowerCase().includes('unknown mid') || errMsg.toLowerCase().includes('unknown tid')) {
            log(`❌ MID/TID tidak terdaftar di middleware: "${errMsg}"`, 'error');
        } else if (response.ok) {
            log(`✅ Endpoint transaction OK (HTTP ${response.status})`, 'success');
        } else {
            log(`⚠️ Endpoint transaction: HTTP ${response.status} - ${errMsg}`, 'warning');
        }
    } catch (e) {
        log(`❌ Endpoint transaction tidak dapat dijangkau: ${e.message}`, 'error');
    }

    // ── Step 3: WebSocket handshake ke EDC (jika IP EDC diisi) ───────────────
    log('', 'info');
    log('📶 Step 3: WebSocket handshake ke EDC...', 'info');
    const edcIp = state.settings.edcIp;
    if (!edcIp) {
        log('⚠️ EDC IP tidak diisi — skip WebSocket handshake test', 'warning');
        log('   (Mode API tidak membutuhkan koneksi langsung ke EDC, tapi tes ini', 'info');
        log('    berguna untuk memastikan POS dan EDC berada di jaringan yang sama)', 'info');
    } else {
        const wsPort = state.settings.edcPort || '6746';
        const wsProto = state.settings.connectionType === 'wss' ? 'wss' : 'ws';
        const wsUrl = `${wsProto}://${edcIp}:${wsPort}`;
        log(`   Mencoba handshake ke: ${wsUrl}`, 'info');
        await testWebSocketHandshake(wsUrl);
    }

    log('', 'info');
    log('========================================', 'info');
    log('🔌 TEST CONNECTION SELESAI', 'info');
    log('========================================', 'info');
    showToast('Info', 'Test connection selesai. Cek Activity Log untuk detail.', 'info');
}

/**
 * Lakukan WebSocket handshake ke EDC, timeout 8 detik.
 * Hanya cek apakah koneksi bisa dibuka (POS & EDC satu jaringan).
 */
function testWebSocketHandshake(wsUrl) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            log(`❌ WebSocket handshake timeout (8s) ke ${wsUrl}`, 'error');
            log(`   EDC tidak dapat dijangkau. Kemungkinan:`, 'info');
            log(`   1. POS dan EDC tidak dalam jaringan yang sama`, 'info');
            log(`   2. IP/Port EDC salah`, 'info');
            log(`   3. ECR Link belum aktif di EDC`, 'info');
            try { ws.close(); } catch(_) {}
            resolve();
        }, 8000);

        let ws;
        try {
            ws = new WebSocket(wsUrl);
        } catch (e) {
            clearTimeout(timeout);
            log(`❌ Tidak bisa membuat koneksi WebSocket: ${e.message}`, 'error');
            resolve();
            return;
        }

        ws.onopen = () => {
            clearTimeout(timeout);
            log(`✅ WebSocket handshake BERHASIL ke ${wsUrl}`, 'success');
            log(`   POS dan EDC berada dalam jaringan yang sama ✅`, 'success');
            ws.close();
            resolve();
        };

        ws.onerror = (e) => {
            clearTimeout(timeout);
            log(`❌ WebSocket handshake GAGAL ke ${wsUrl}`, 'error');
            log(`   POS dan EDC kemungkinan TIDAK dalam jaringan yang sama`, 'error');
            log(`   Atau ECR Link di EDC belum aktif / port salah`, 'info');
            resolve();
        };

        ws.onclose = (e) => {
            clearTimeout(timeout);
            if (e.code === 1000 || e.code === 1001) return resolve();
            if (e.code === 1006) {
                log(`❌ WebSocket closed abnormally (code 1006) — EDC tidak support ${wsUrl.startsWith('wss') ? 'WSS' : 'WS'} atau tidak reachable`, 'error');
            }
            resolve();
        };
    });
}

/**
 * Test WSS connection with detailed diagnostics
 */
async function testWSS() {
    const protocol = 'wss';
    const port = '6746';
    const url = `${protocol}://${state.settings.edcIp}:${port}`;
    
    log('========================================', 'info');
    log('🔒 WSS CONNECTION TEST', 'info');
    log('========================================', 'info');
    log(`Target: ${url}`, 'info');
    log('', 'info');
    log('📝 Troubleshooting WSS:', 'info');
    log('1. Pastikan ECR Link di EDC sudah aktif', 'info');
    log('2. Cek apakah EDC support WSS (port 6746)', 'info');
    log('3. Jika Code 1006: EDC mungkin hanya support WS', 'info');
    log('4. Coba ganti ke WS (port 6745) jika WSS gagal', 'info');
    log('========================================', 'info');
    
    // Try to connect
    await ecrWs.connect(url);
}

// ===== Tab Navigation =====
function switchTab(tabName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
    
    // Update page title
    const titles = {
        pos: 'Kasir',
        menu: 'Kelola Menu',
        settings: 'Pengaturan',
        logs: 'Activity Log'
    };
    document.getElementById('pageTitle').textContent = titles[tabName] || 'POS Dummy';
}

// ===== Menu Management =====
function renderMenuGrid() {
    const grid = document.getElementById('menuGrid');
    const searchTerm = document.getElementById('searchMenu')?.value.toLowerCase() || '';
    
    const filteredItems = state.menuItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
    
    grid.innerHTML = filteredItems.map(item => `
        <div class="menu-item" onclick="addToCart(${item.id})">
            <div class="menu-item-icon">
                <i class="fas ${getCategoryIcon(item.category)}"></i>
            </div>
            <div class="menu-item-name">${escapeHtml(item.name)}</div>
            <div class="menu-item-price">Rp ${formatPrice(item.price)}</div>
        </div>
    `).join('');
}

function getCategoryIcon(category) {
    const icons = {
        'Makanan': 'fa-utensils',
        'Minuman': 'fa-glass-water',
        'Snack': 'fa-cookie-bite',
        'Lainnya': 'fa-box'
    };
    return icons[category] || 'fa-box';
}

function renderMenuTable() {
    const tbody = document.getElementById('menuTableBody');
    tbody.innerHTML = state.menuItems.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${escapeHtml(item.name)}</td>
            <td><span class="badge">${item.category}</span></td>
            <td>Rp ${formatPrice(item.price)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddMenuModal() {
    document.getElementById('addMenuModal').classList.add('active');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function addMenuItem(event) {
    event.preventDefault();
    
    const name = document.getElementById('menuName').value;
    const category = document.getElementById('menuCategory').value;
    const price = parseInt(document.getElementById('menuPrice').value) || 1;
    
    const newItem = {
        id: Date.now(),
        name,
        category,
        price
    };
    
    state.menuItems.push(newItem);
    renderMenuGrid();
    renderMenuTable();
    closeModal();
    
    // Reset form
    event.target.reset();
    document.getElementById('menuPrice').value = 1;
    
    log(`Menu item added: ${name}`, 'success');
    showToast('Success', 'Menu item added successfully', 'success');
}

function deleteMenuItem(id) {
    const item = state.menuItems.find(i => i.id === id);
    state.menuItems = state.menuItems.filter(i => i.id !== id);
    renderMenuGrid();
    renderMenuTable();
    log(`Menu item deleted: ${item?.name}`, 'warning');
}

// ===== Cart Management =====
function addToCart(itemId) {
    const item = state.menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const existingItem = state.cart.find(c => c.id === itemId);
    if (existingItem) {
        existingItem.qty++;
    } else {
        state.cart.push({ ...item, qty: 1 });
    }
    
    renderCart();
    updateCartSummary();
    log(`Added to cart: ${item.name}`, 'info');
}

function updateCartQty(itemId, delta) {
    const item = state.cart.find(c => c.id === itemId);
    if (!item) return;
    
    item.qty += delta;
    if (item.qty <= 0) {
        state.cart = state.cart.filter(c => c.id !== itemId);
    }
    
    renderCart();
    updateCartSummary();
}

function removeFromCart(itemId) {
    const item = state.cart.find(c => c.id === itemId);
    state.cart = state.cart.filter(c => c.id !== itemId);
    renderCart();
    updateCartSummary();
    log(`Removed from cart: ${item?.name}`, 'warning');
}

function clearCart() {
    state.cart = [];
    renderCart();
    updateCartSummary();
    log('Cart cleared', 'info');
}

function renderCart() {
    const container = document.getElementById('cartItems');
    
    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>Keranjang kosong</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">Rp ${formatPrice(item.price)}</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">Rp ${formatPrice(item.price * item.qty)}</div>
            <div class="cart-item-remove" onclick="removeFromCart(${item.id})">
                <i class="fas fa-times"></i>
            </div>
        </div>
    `).join('');
}

function updateCartSummary() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `Rp ${formatPrice(subtotal)}`;
    document.getElementById('tax').textContent = `Rp ${formatPrice(tax)}`;
    document.getElementById('total').textContent = `Rp ${formatPrice(total)}`;
    
    // Enable/disable pay button
    const actionType = document.getElementById('actionType')?.value || 'Sale';
    document.getElementById('payBtn').disabled = actionType !== 'Settlement' && actionType !== 'RefundQris' && state.cart.length === 0;
}

// ===== Payment Processing =====
async function processPayment() {
    const actionType = document.getElementById('actionType')?.value || 'Sale';
    
    // Settlement and RefundQris don't require cart items
    if (actionType !== 'Settlement' && actionType !== 'RefundQris' && state.cart.length === 0) {
        showToast('Error', 'Cart is empty', 'error');
        return;
    }
    
    // Check if using API connection
    if (state.settings.connectionType === 'api') {
        await processPaymentViaAPI();
        return;
    }
    
    // Get payment method
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'purchase';
    
    // Show payment modal
    showPaymentModal();
    
    // Calculate totals
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    
    // Start transaction timing
    state.transactionStartTime = new Date();
    
    log('========================================', 'info');
    log(`🛒 TRANSACTION STARTED`, 'info');
    log('========================================', 'info');
    log(`Action Type: ${actionType}`, 'info');
    log(`Payment Method: ${paymentMethod}`, 'info');
    log(`Amount: Rp ${formatPrice(total)}`, 'info');
    log(`Timestamp: ${state.transactionStartTime.toLocaleString('id-ID')}`, 'info');
    log('========================================', 'info');
    
    try {
        // Ensure connection
        if (!state.isConnected) {
            updatePaymentStatus('connecting', 'Connecting to EDC...', 'Please wait while we establish connection');
            await connectToEDC();
        }
        
        if (!state.isConnected) {
            throw new Error('Failed to connect to EDC');
        }
        
        // Build payload based on action type
        updatePaymentStatus('building', 'Building transaction payload...', 'Preparing request data');
        
        let payload;
        switch (actionType) {
            case 'Sale':
                payload = PayloadBuilder.buildSale(total, paymentMethod);
                break;
            case 'Contactless':
                payload = PayloadBuilder.buildContactless(total);
                break;
            case 'CardVerification':
                payload = PayloadBuilder.buildCardVerification(total);
                break;
            case 'Cicilan':
                const plan = document.getElementById('cicilanPlan')?.value || '001';
                const periode = document.getElementById('cicilanPeriode')?.value || '03';
                payload = PayloadBuilder.buildCicilan(total, plan, periode);
                break;
            case 'Settlement':
                payload = PayloadBuilder.buildSettlement(paymentMethod);
                break;
            case 'QrisTap':
                payload = PayloadBuilder.buildQrisTap(total);
                break;
            case 'RefundQris':
                const refundRef = document.getElementById('refundReferenceNumber')?.value?.trim();
                if (!refundRef) {
                    throw new Error('Reff ID wajib diisi untuk Refund QRIS');
                }
                payload = PayloadBuilder.buildRefundQris(total, refundRef);
                break;
            default:
                payload = PayloadBuilder.buildSale(total, paymentMethod);
        }
        
        log(`Building ${actionType} payload with method: ${payload.method || 'purchase'}`, 'info');
        
        // Encrypt payload
        updatePaymentStatus('encrypting', 'Encrypting payload...', 'Using AES/ECB/PKCS5Padding');
        await sleep(500);
        
        const encryptedToken = ECREncryption.generateToken(payload);
        
        // Send to EDC
        const messageTimeoutMs = state.settings.wsMessageTimeout || 30000;
        showPendingStatus({
            message: 'Sending to EDC...',
            detail: 'Menunggu response dari EDC',
            timeoutMs: messageTimeoutMs,
            onRetry: () => {
                if (state.currentTransactionTimeoutHandler) {
                    clearTimeout(state.currentTransactionTimeoutHandler);
                    state.currentTransactionTimeoutHandler = null;
                }
                retryTransactionViaWS();
            }
        });
        
        // Store transaction info for response handling and retry
        state.currentTransaction = {
            trxId: payload.trx_id,
            action: payload.action,
            amount: total,
            timestamp: new Date(),
            encryptedToken: encryptedToken,
            payload: payload
        };
        // Simpan juga ke lastWsTransaction agar retry tetap bisa diakses setelah currentTransaction di-clear
        state.lastWsTransaction = { ...state.currentTransaction };
        
        // Send as raw encrypted string (token only)
        const sent = ecrWs.send(encryptedToken);
        if (!sent) {
            throw new Error('Failed to send payment request');
        }
        
        // Set timeout for WebSocket response
        const messageTimeoutHandler = setTimeout(() => {
            log(`⏱️ WebSocket message timeout for trx_id: ${payload.trx_id}`, 'warning');
            stopPendingCountdown();
            
            const statusEl = document.getElementById('paymentStatus');
            const detailsEl = document.getElementById('paymentDetails');
            const footerEl = document.getElementById('paymentFooter');
            
            if (statusEl && detailsEl && footerEl) {
                statusEl.style.display = 'none';
                detailsEl.style.display = 'block';
                footerEl.style.display = 'flex';
                
                detailsEl.innerHTML = `
                    <div class="payment-result error">
                        <div class="result-title error">
                            <i class="fas fa-clock"></i> Transaction Timeout
                        </div>
                        <div class="result-item">
                            <span class="result-label">Transaction ID</span>
                            <span class="result-value">${payload.trx_id}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Error</span>
                            <span class="result-value" style="color: var(--danger-color);">EDC tidak merespon dalam ${messageTimeoutMs}ms</span>
                        </div>
                        <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--gray-600);">
                            Transaksi mungkin masih diproses di EDC. Gunakan tombol di bawah untuk retry atau cek status transaksi.
                        </p>
                    </div>
                `;
                
                footerEl.innerHTML = `
                    <button class="btn btn-outline" onclick="closePaymentModal()">Tutup</button>
                    <button class="btn btn-primary" onclick="retryTransactionViaWS()">
                        <i class="fas fa-redo"></i> Retry Transaksi
                    </button>
                `;
            }
        }, messageTimeoutMs);
        
        // Store timeout handler for cleanup
        state.currentTransactionTimeoutHandler = messageTimeoutHandler;
        
        // Wait for response (in real implementation, this would be handled by onmessage)
        // For demo purposes, we'll wait for actual response from EDC
        log('Waiting for EDC response...', 'info');
        
    } catch (error) {
        log(`Payment failed: ${error.message}`, 'error');
        handlePaymentResponse({
            success: false,
            error: error.message
        });
    }
}

function handleMessage(data) {
    // Known ECR Link handshake/ACK signals — bukan response transaksi, abaikan
    const ACK_SIGNALS = ['ECR', 'ACK', 'OK', 'CONNECTED'];
    if (typeof data === 'string' && ACK_SIGNALS.includes(data.trim().toUpperCase())) {
        log(`📶 ECR handshake/ACK signal diterima: "${data.trim()}" — diabaikan`, 'info');
        return;
    }

    // Kalau tidak ada transaksi aktif, abaikan pesan masuk (misal stray message saat reconnect)
    if (!state.currentTransaction && !state.currentTransactionTimeoutHandler) {
        log(`⚠️ Pesan diterima tapi tidak ada transaksi aktif, diabaikan: ${data.substring(0, 100)}`, 'warning');
        return;
    }

    // Clear message timeout when response received
    if (state.currentTransactionTimeoutHandler) {
        clearTimeout(state.currentTransactionTimeoutHandler);
        state.currentTransactionTimeoutHandler = null;
        log('✅ Message timeout cleared - response received', 'success');
    }
    stopPendingCountdown();
    stopStatusPolling();
    
    log('========================================', 'received');
    log(`📨 Received: ${data.substring(0, 500)}${data.length > 500 ? '...' : ''}`, 'received');
    log('========================================', 'received');
    
    try {
        const response = JSON.parse(data);
        log(`✅ Response parsed successfully`, 'success');
        log(`Response RC: ${response.rc || 'N/A'}`, 'info');
        log(`Response Status: ${response.status || 'N/A'}`, 'info');
        handlePaymentResponse(response);
    } catch (error) {
        // Non-JSON yang bukan ACK → log sebagai warning, jangan treat sebagai sukses
        log(`⚠️ Raw response tidak dikenal (bukan JSON, bukan ACK): ${data.substring(0, 200)}`, 'warning');
        log(`Parse error: ${error.message}`, 'warning');
    }
}

function handlePaymentResponse(response) {
    // Jika response status PENDING, jangan tutup dialog pending; biarkan countdown jalan.
    const statusLower = String(response?.status || '').toLowerCase();
    const isPending = statusLower === 'pending' || response?.pending === true;
    if (isPending) {
        log('⏳ Response status PENDING, menunggu final response dari EDC...', 'warning');
        const connectionType = state.settings.connectionType || 'wss';
        const timeoutMs = connectionType === 'api'
            ? (state.settings.apiTimeout || 60) * 1000
            : (state.settings.wsMessageTimeout || 30000);
        const trxId = response?.trx_id || state.lastApiRequest?.requestBody?.trx_id;
        // Selalu re-render: countdown fresh + tombol retry yang fungsional.
        showPendingStatus({
            message: 'Menunggu hasil transaksi...',
            detail: `Status: PENDING (trx_id: ${trxId || '-'})`,
            timeoutMs,
            onRetry: () => {
                if (connectionType === 'api') {
                    stopStatusPolling();
                    retryTransactionViaFMS();
                } else {
                    retryTransactionViaWS();
                }
            }
        });
        // Auto-poll status setiap 2 detik (khusus mode API)
        if (connectionType === 'api' && trxId) {
            startStatusPolling(trxId, 2000);
        }
        return;
    }
    
    // Bukan pending → stop semua timer/poll
    stopStatusPolling();
    stopPendingCountdown();
    
    // End transaction timing
    state.transactionEndTime = new Date();
    const startTime = state.transactionStartTime || state.transactionEndTime;
    const duration = state.transactionEndTime - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);
    
    log('========================================', 'info');
    log(`🔄 TRANSACTION COMPLETED`, 'info');
    log('========================================', 'info');
    log(`Duration: ${durationSeconds}s (${duration}ms)`, 'info');
    log(`Start Time: ${startTime.toLocaleTimeString('id-ID', { hour12: false })}`, 'info');
    log(`End Time: ${state.transactionEndTime.toLocaleTimeString('id-ID', { hour12: false })}`, 'info');
    log('========================================', 'info');
    
    log('========================================', 'info');
    log('🔄 Processing Payment Response', 'info');
    log('========================================', 'info');
    log(`Response object: ${JSON.stringify(response).substring(0, 300)}...`, 'info');
    
    const statusEl = document.getElementById('paymentStatus');
    const detailsEl = document.getElementById('paymentDetails');
    const footerEl = document.getElementById('paymentFooter');
    
    statusEl.style.display = 'none';
    detailsEl.style.display = 'block';
    footerEl.style.display = 'flex';
    
    // Clear current transaction — response final sudah diterima
    state.currentTransaction = null;
    
    state.totalTransactions++;
    updateInfoPanel();
    
    // Check if it's a success response (rc: "00" or status: "success"/"paid"/"refund")
    const isSuccess = response.rc === '00' || 
                      response.status?.toLowerCase() === 'success' || 
                      response.status?.toLowerCase() === 'paid' ||
                      response.status?.toLowerCase() === 'refund' ||
                      response.success === true;
    
    // Unpaid is not a failure, it's a warning state (QRIS belum dibayar)
    const isUnpaid = response.status?.toLowerCase() === 'unpaid';
    
    log(`Is Success: ${isSuccess}, Is Unpaid: ${isUnpaid}`, 'info');
    log(`RC: ${response.rc}, Status: ${response.status}`, 'info');
    
    let titleClass, titleIcon, titleText, statusColor;
    if (isSuccess) {
        titleClass = 'success';
        titleIcon = 'fa-check-circle';
        titleText = 'Transaction Success';
        statusColor = 'var(--success-color)';
    } else if (isUnpaid) {
        titleClass = 'error';
        titleIcon = 'fa-exclamation-circle';
        titleText = 'QRIS Unpaid';
        statusColor = 'var(--warning-color, #f59e0b)';
    } else {
        titleClass = 'error';
        titleIcon = 'fa-times-circle';
        titleText = 'Transaction Failed';
        statusColor = 'var(--danger-color)';
    }

    let resultHtml = `
        <div class="payment-result ${titleClass}">
            <div class="result-title ${titleClass}">
                <i class="fas ${titleIcon}"></i> ${titleText}
            </div>
    `;

    resultHtml += renderResponseItems(response, statusColor);

    resultHtml += `</div>`;
    detailsEl.innerHTML = resultHtml;

    if (isSuccess) {
        log(`✅ Transaction successful: ${response.trx_id || 'N/A'}`, 'success');
        log('========================================', 'info');
        showToast('Success', 'Transaction processed successfully', 'success');
        clearCart();
    } else {
        const errorMessage = response.msg || response.error || 'Transaction failed';
        log(`❌ Transaction failed: ${errorMessage}`, 'error');
        log('========================================', 'info');
        showToast('Error', errorMessage, 'error');
    }
}

/**
 * Render semua field response apa adanya ke dalam list result-item.
 * Tidak ada whitelist, semua key yang dikirim ECR akan ditampilkan.
 */
function renderResponseItems(response, statusColor = 'var(--success-color)') {
    if (!response || typeof response !== 'object') {
        return `
            <div class="result-item">
                <span class="result-label">Response</span>
                <span class="result-value">${escapeHtml(String(response))}</span>
            </div>
        `;
    }

    let html = '';
    for (const [key, rawValue] of Object.entries(response)) {
        if (rawValue === undefined || rawValue === null || rawValue === '') continue;

        const label = formatFieldLabel(key);
        let valueHtml;
        let extraStyle = '';

        if (typeof rawValue === 'object') {
            // Objek / array → tampilkan sebagai JSON formatted
            valueHtml = `<pre style="margin:0;white-space:pre-wrap;word-break:break-word;font-size:0.8125rem;">${escapeHtml(JSON.stringify(rawValue, null, 2))}</pre>`;
        } else {
            const strValue = String(rawValue);
            if (key === 'amount' && !isNaN(parseInt(strValue))) {
                valueHtml = `Rp ${formatPrice(parseInt(strValue))}`;
            } else if (key === 'status') {
                valueHtml = escapeHtml(strValue);
                extraStyle = ` style="color: ${statusColor}; text-transform: uppercase;"`;
            } else {
                valueHtml = escapeHtml(strValue);
            }
        }

        html += `
            <div class="result-item">
                <span class="result-label">${escapeHtml(label)}</span>
                <span class="result-value"${extraStyle}>${valueHtml}</span>
            </div>
        `;
    }
    return html;
}

/**
 * Ubah key seperti "trace_number" atau "reffid" menjadi label yang rapi.
 */
function formatFieldLabel(key) {
    return String(key)
        .replace(/[_\-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showPaymentModal() {
    document.getElementById('paymentModal').classList.add('active');
    updatePaymentStatus('connecting', 'Connecting to EDC...', 'Please wait while we process your transaction');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    
    // Clear transaction timeout if exists
    if (state.currentTransactionTimeoutHandler) {
        clearTimeout(state.currentTransactionTimeoutHandler);
        state.currentTransactionTimeoutHandler = null;
    }
    
    stopPendingCountdown();
    stopStatusPolling();
    if (state.currentApiAbortController) {
        try { state.currentApiAbortController.abort(); } catch (_) {}
        state.currentApiAbortController = null;
    }
    state.userRequestedRetry = false;
    
    // Clear current transaction
    state.currentTransaction = null;
    
    // Reset modal content
    setTimeout(() => {
        document.getElementById('paymentStatus').style.display = 'block';
        document.getElementById('paymentDetails').style.display = 'none';
        document.getElementById('paymentFooter').style.display = 'none';
        document.getElementById('paymentFooter').innerHTML = '<button class="btn btn-primary" onclick="closePaymentModal()">Tutup</button>';
    }, 300);
}

function updatePaymentStatus(status, message, detail) {
    const statusEl = document.getElementById('paymentStatus');
    statusEl.innerHTML = `
        <div class="spinner"></div>
        <p class="status-message">${message}</p>
        <p class="status-detail">${detail}</p>
    `;
}

/**
 * Tampilkan status "pending" dengan countdown realtime + tombol Retry manual.
 *
 * @param {object} opts
 * @param {string} opts.message      Pesan utama (contoh: "Sending to API...")
 * @param {string} opts.detail       Detail text di bawah countdown
 * @param {number} opts.timeoutMs    Durasi timeout dalam ms (countdown source)
 * @param {function} opts.onRetry    Callback saat user klik Retry Sekarang
 */
function showPendingStatus({ message, detail, timeoutMs, onRetry }) {
    stopPendingCountdown();

    const statusEl = document.getElementById('paymentStatus');
    const detailsEl = document.getElementById('paymentDetails');
    const footerEl = document.getElementById('paymentFooter');

    if (!statusEl) return;

    statusEl.style.display = 'block';
    if (detailsEl) detailsEl.style.display = 'none';
    if (footerEl) footerEl.style.display = 'none';

    const deadline = Date.now() + (timeoutMs || 0);

    statusEl.innerHTML = `
        <div class="spinner"></div>
        <p class="status-message">${message}</p>
        <p class="status-detail">${detail || ''}</p>
        <div id="pendingCountdown" style="margin-top: 1rem; font-size: 1.75rem; font-weight: 700; color: var(--primary-color, #1e40af); font-variant-numeric: tabular-nums;">
            ${formatCountdown(timeoutMs)}
        </div>
        <p style="margin-top: 0.25rem; font-size: 0.8125rem; color: var(--gray-600, #6b7280);">
            Sisa waktu menunggu response
        </p>
        <div style="margin-top: 1.25rem;">
            <button id="pendingRetryBtn" type="button" class="btn btn-outline">
                <i class="fas fa-redo"></i> Retry Sekarang
            </button>
        </div>
    `;

    const retryBtn = document.getElementById('pendingRetryBtn');
    if (retryBtn && typeof onRetry === 'function') {
        retryBtn.addEventListener('click', () => {
            stopPendingCountdown();
            retryBtn.disabled = true;
            retryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Retrying...';
            try {
                onRetry();
            } catch (e) {
                log(`Retry handler error: ${e.message}`, 'error');
            }
        });
    }

    // Start interval countdown
    state.pendingCountdownInterval = setInterval(() => {
        const remaining = deadline - Date.now();
        const el = document.getElementById('pendingCountdown');
        if (!el) {
            stopPendingCountdown();
            return;
        }
        if (remaining <= 0) {
            el.textContent = '00:00';
            el.style.color = 'var(--danger-color, #dc2626)';
            // Sembunyikan spinner saat timeout
            const spinnerEl = statusEl.querySelector('.spinner');
            if (spinnerEl) spinnerEl.style.display = 'none';
            const msgEl = statusEl.querySelector('.status-message');
            const detailEl = statusEl.querySelector('.status-detail');
            if (msgEl) {
                msgEl.textContent = 'Timeout';
                msgEl.style.color = 'var(--danger-color, #dc2626)';
            }
            if (detailEl) detailEl.textContent = 'EDC tidak merespon dalam waktu yang ditentukan';
            const btn = document.getElementById('pendingRetryBtn');
            if (btn) {
                btn.classList.remove('btn-outline');
                btn.classList.add('btn-primary');
                btn.innerHTML = '<i class="fas fa-redo"></i> Retry Transaksi';
            }
            stopPendingCountdown();
            stopStatusPolling();
            return;
        }
        el.textContent = formatCountdown(remaining);
    }, 250);
}

function stopPendingCountdown() {
    if (state.pendingCountdownInterval) {
        clearInterval(state.pendingCountdownInterval);
        state.pendingCountdownInterval = null;
    }
}

/**
 * Auto-poll GET /api/v1/transaction/status/{trxId} setiap intervalMs selama pending.
 * Kalau response final (bukan PENDING), langsung render via handlePaymentResponse dan stop.
 */
function startStatusPolling(trxId, intervalMs = 2000) {
    stopStatusPolling();
    if (!trxId) return;

    log(`🔁 Start auto-poll status trx_id=${trxId} setiap ${intervalMs}ms`, 'info');

    const tick = async () => {
        if (state.statusPollInFlight) return;
        state.statusPollInFlight = true;
        try {
            const apiUrl = `${state.settings.apiUrl}/api/v1/transaction/status/${trxId}`;
            const res = await fetch(apiUrl, {
                method: 'GET',
                mode: 'cors',
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json().catch(() => ({}));
            
            // Extract inner transaction data (middleware wraps: {status: "...", data: {...}})
            const txnData = data.data || data;
            const statusLower = String(txnData?.status || '').toLowerCase();
            
            // Kalau HTTP error DAN tidak ada data transaksi berguna, skip
            if (!res.ok && !txnData?.action && !txnData?.rc && !txnData?.trx_id) {
                log(`Poll status HTTP ${res.status}: ${data.error || JSON.stringify(data).substring(0, 100)}`, 'warning');
                return;
            }
            
            const isStillPending = statusLower === 'pending' || txnData?.pending === true;
            if (isStillPending) {
                log(`Poll: masih PENDING (trx_id=${trxId})`, 'info');
                return;
            }
            // Final response diterima → stop polling & render
            log(`✅ Poll: final status diterima (${statusLower || txnData?.rc || 'unknown'})`, 'success');
            stopStatusPolling();
            stopPendingCountdown();
            handlePaymentResponse(txnData);
        } catch (err) {
            log(`Poll status error: ${err.message}`, 'warning');
        } finally {
            state.statusPollInFlight = false;
        }
    };

    // Jalankan 1x segera supaya user ga nunggu X detik pertama, lalu interval
    tick();
    state.statusPollInterval = setInterval(tick, intervalMs);
}

function stopStatusPolling() {
    if (state.statusPollInterval) {
        clearInterval(state.statusPollInterval);
        state.statusPollInterval = null;
        log('⏹️ Stop auto-poll status', 'info');
    }
    state.statusPollInFlight = false;
}

function formatCountdown(ms) {
    const totalSec = Math.max(0, Math.ceil((ms || 0) / 1000));
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${m}:${s}`;
}

// ===== API Payment Processing =====
async function processPaymentViaAPI() {
    const actionType = document.getElementById('actionType')?.value || 'Sale';
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'purchase';
    
    // Show payment modal
    showPaymentModal();
    
    // Calculate totals
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    
    // Start transaction timing
    state.transactionStartTime = new Date();
    
    try {
        // Validate API settings
        if (!state.settings.mid || !state.settings.tid) {
            throw new Error('MID and TID must be configured in Settings for API connection');
        }
        
        updatePaymentStatus('building', 'Building transaction payload...', 'Preparing API request');
        
        // Build payload
        let payload;
        switch (actionType) {
            case 'Sale':
                payload = PayloadBuilder.buildSale(total, paymentMethod);
                break;
            case 'Contactless':
                payload = PayloadBuilder.buildContactless(total);
                break;
            case 'CardVerification':
                payload = PayloadBuilder.buildCardVerification(total);
                break;
            case 'Cicilan':
                const plan = document.getElementById('cicilanPlan')?.value || '001';
                const periode = document.getElementById('cicilanPeriode')?.value || '03';
                payload = PayloadBuilder.buildCicilan(total, plan, periode);
                break;
            case 'Settlement':
                payload = PayloadBuilder.buildSettlement(paymentMethod);
                break;
            case 'QrisTap':
                payload = PayloadBuilder.buildQrisTap(total);
                break;
            case 'RefundQris':
                const refundRefApi = document.getElementById('refundReferenceNumber')?.value?.trim();
                if (!refundRefApi) {
                    throw new Error('Reff ID wajib diisi untuk Refund QRIS');
                }
                payload = PayloadBuilder.buildRefundQris(total, refundRefApi);
                break;
            default:
                payload = PayloadBuilder.buildSale(total, paymentMethod);
        }
        
        log(`Building ${actionType} payload for API with method: ${payload.method || 'purchase'}`, 'info');
        
        // Encrypt payload
        updatePaymentStatus('encrypting', 'Encrypting payload...', 'Using AES/ECB/PKCS5Padding');
        await sleep(500);
        
        const encryptedToken = ECREncryption.generateToken(payload);
        
        // Prepare API request
        const apiTimeoutMs = (state.settings.apiTimeout || 60) * 1000;
        showPendingStatus({
            message: 'Sending to API...',
            detail: 'Menunggu response dari middleware',
            timeoutMs: apiTimeoutMs,
            onRetry: () => {
                state.userRequestedRetry = true;
                if (state.currentApiAbortController) {
                    try { state.currentApiAbortController.abort(); } catch (_) {}
                }
            }
        });
        
        const apiUrl = `${state.settings.apiUrl}/api/v1/transaction`;
        const requestBody = {
            token: encryptedToken,
            mid: state.settings.mid,
            tid: state.settings.tid,
            trx_id: payload.trx_id || PayloadBuilder.generateTrxId()
        };
        
        // Store for retry/re-push capability
        state.lastApiRequest = { apiUrl, requestBody };
        
        log(`API Request: ${apiUrl}`, 'info');
        
        // Send API request with configurable timeout
        log(`[DEBUG] Fetching: ${apiUrl} (timeout: ${state.settings.apiTimeout || 60}s)`, 'info');
        log(`[DEBUG] Request body: ${JSON.stringify(requestBody).substring(0, 200)}...`, 'info');
        
        state.userRequestedRetry = false;
        const controller = new AbortController();
        state.currentApiAbortController = controller;
        const timeoutId = setTimeout(() => controller.abort(), apiTimeoutMs);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        }).catch(err => {
            clearTimeout(timeoutId);
            stopPendingCountdown();
            state.currentApiAbortController = null;
            
            // Handle abort from user (manual retry)
            if (err.name === 'AbortError' && state.userRequestedRetry) {
                state.userRequestedRetry = false;
                log('🔁 User requested manual retry, cancelling current request', 'warning');
                // Trigger retry via FMS (re-push same token)
                retryTransactionViaFMS();
                throw new Error('__USER_RETRY__');
            }
            
            // Handle abort (timeout from POS side)
            if (err.name === 'AbortError') {
                throw new Error(`POS timeout: middleware tidak merespon dalam ${state.settings.apiTimeout || 60} detik`);
            }
            
            // Network error handling
            log(`[DEBUG] Fetch error: ${err.name} - ${err.message}`, 'error');
            log(`[DEBUG] Error stack: ${err.stack}`, 'error');
            
            if (err.name === 'TypeError') {
                throw new Error(`Network error: ${err.message}. This is usually caused by:
1. CORS policy blocking the request (check browser console for CORS errors)
2. API server not running at ${apiUrl}
3. Firewall blocking the connection

Check browser DevTools (F12) → Console → look for CORS errors.`);
            }
            throw err;
        });
        
        clearTimeout(timeoutId);
        stopPendingCountdown();
        state.currentApiAbortController = null;
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error || `API Error: ${response.status}`;
            
            // Check if it's a timeout (504 status OR "timeout" in error message)
            const isTimeout = response.status === 504 || errorMsg.toLowerCase().includes('timeout');
            
            if (isTimeout) {
                log(`⏱️ Transaction timeout for trx_id: ${payload.trx_id}`, 'warning');
                showToast('Timeout', 'EDC tidak merespon dalam waktu yang ditentukan', 'warning');
                
                const statusEl = document.getElementById('paymentStatus');
                const detailsEl = document.getElementById('paymentDetails');
                const footerEl = document.getElementById('paymentFooter');
                
                statusEl.style.display = 'none';
                detailsEl.style.display = 'block';
                footerEl.style.display = 'flex';
                
                detailsEl.innerHTML = `
                    <div class="payment-result error">
                        <div class="result-title error">
                            <i class="fas fa-clock"></i> Transaction Timeout
                        </div>
                        <div class="result-item">
                            <span class="result-label">Transaction ID</span>
                            <span class="result-value">${payload.trx_id}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Error</span>
                            <span class="result-value" style="color: var(--danger-color);">${errorMsg}</span>
                        </div>
                        <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--gray-600);">
                            Transaksi mungkin masih diproses di EDC. Gunakan tombol di bawah untuk cek status transaksi.
                        </p>
                    </div>
                `;
                
                footerEl.innerHTML = `
                    <button class="btn btn-outline" onclick="closePaymentModal()">Tutup</button>
                    <button class="btn btn-outline" onclick="checkTransactionStatus('${payload.trx_id}')">
                        <i class="fas fa-search"></i> Cek Status via Middleware
                    </button>
                    <button class="btn btn-primary" onclick="retryTransactionViaFMS()">
                        <i class="fas fa-redo"></i> Cek Status via FMS (Re-push)
                    </button>
                `;
                return;
            }
            
            throw new Error(errorMsg);
        }
        
        const responseData = await response.json();
        
        log(`API Response received: ${JSON.stringify(responseData)}`, 'received');
        
        // Middleware bisa wrap response: {status: "...", data: {...actual response...}}
        // Extract inner data jika ada
        const finalData = responseData.data || responseData;
        
        // Handle response similar to WebSocket
        handlePaymentResponse(finalData);
        
        // Clear cart on success
        if (finalData.rc === '00' || finalData.status?.toLowerCase() === 'success' || finalData.status?.toLowerCase() === 'paid' || finalData.status?.toLowerCase() === 'refund') {
            clearCart();
        }
        
    } catch (error) {
        // User-initiated manual retry → suppress error UI, retry handler sudah jalan
        if (error && error.message === '__USER_RETRY__') {
            return;
        }
        log(`API Payment error: ${error.message}`, 'error');
        showToast('Error', error.message, 'error');
        
        // Show error in payment modal
        const statusEl = document.getElementById('paymentStatus');
        const detailsEl = document.getElementById('paymentDetails');
        const footerEl = document.getElementById('paymentFooter');
        
        statusEl.style.display = 'none';
        detailsEl.style.display = 'block';
        footerEl.style.display = 'flex';
        
        // Check if this is any kind of timeout error
        const isAnyTimeout = error.message.toLowerCase().includes('timeout');
        const trxId = state.lastApiRequest?.requestBody?.trx_id || 'unknown';
        
        if (isAnyTimeout && state.lastApiRequest) {
            detailsEl.innerHTML = `
                <div class="payment-result error">
                    <div class="result-title error">
                        <i class="fas fa-clock"></i> Transaction Timeout
                    </div>
                    <div class="result-item">
                        <span class="result-label">Transaction ID</span>
                        <span class="result-value">${trxId}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Error</span>
                        <span class="result-value" style="color: var(--danger-color);">${error.message}</span>
                    </div>
                    <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--gray-600);">
                        Transaksi mungkin masih diproses di EDC. Coba retry atau cek status transaksi.
                    </p>
                </div>
            `;
            
            footerEl.innerHTML = `
                <button class="btn btn-outline" onclick="closePaymentModal()">Tutup</button>
                <button class="btn btn-outline" onclick="checkTransactionStatus('${trxId}')">
                    <i class="fas fa-search"></i> Cek Status via Middleware
                </button>
                <button class="btn btn-primary" onclick="retryTransactionViaFMS()">
                    <i class="fas fa-redo"></i> Cek Status via FMS (Re-push)
                </button>
            `;
        } else {
            detailsEl.innerHTML = `
                <div class="payment-result error">
                    <div class="result-title error">
                        <i class="fas fa-times-circle"></i> Transaction Failed
                    </div>
                    <div class="result-item">
                        <span class="result-label">Error</span>
                        <span class="result-value" style="color: var(--danger-color);">${error.message}</span>
                    </div>
                </div>
            `;
            
            footerEl.innerHTML = `<button class="btn btn-primary" onclick="closePaymentModal()">Tutup</button>`;
        }
    }
}

// ===== Check Transaction Status =====
async function checkTransactionStatus(trxId) {
    const detailsEl = document.getElementById('paymentDetails');
    const footerEl = document.getElementById('paymentFooter');
    
    // Show loading state
    detailsEl.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: var(--gray-600);">Mengecek status transaksi <strong>${trxId}</strong>...</p>
        </div>
    `;
    footerEl.innerHTML = '';
    
    log(`Checking transaction status: ${trxId}`, 'info');
    
    try {
        const apiUrl = `${state.settings.apiUrl}/api/v1/transaction/status/${trxId}`;
        log(`GET ${apiUrl}`, 'info');
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
        });
        
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            throw new Error(data.error || `Status check failed: ${response.status}`);
        }
        
        log(`Status response: ${JSON.stringify(data)}`, 'received');
        
        // Extract the transaction data from the wrapper response.
        // Middleware returns {status: "SUCCESS", data: {rc, status, trx_id, ...}}
        const txnData = data.data || data;
        
        // Display the status result
        handlePaymentResponse(txnData);
        
        // Re-add the check status button in footer in case user wants to re-check
        footerEl.style.display = 'flex';
        const isSuccess = txnData.rc === '00' || 
                          txnData.status?.toLowerCase() === 'success' || 
                          txnData.status?.toLowerCase() === 'paid' ||
                          data.status?.toUpperCase() === 'SUCCESS';
        
        if (isSuccess) {
            footerEl.innerHTML = `<button class="btn btn-primary" onclick="closePaymentModal()">Tutup</button>`;
            clearCart();
        } else {
            footerEl.innerHTML = `
                <button class="btn btn-outline" onclick="closePaymentModal()">Tutup</button>
                <button class="btn btn-primary" onclick="checkTransactionStatus('${trxId}')">
                    <i class="fas fa-sync-alt"></i> Cek Ulang
                </button>
            `;
        }
        
    } catch (error) {
        log(`Status check error: ${error.message}`, 'error');
        
        detailsEl.innerHTML = `
            <div class="payment-result error">
                <div class="result-title error">
                    <i class="fas fa-exclamation-triangle"></i> Gagal Cek Status
                </div>
                <div class="result-item">
                    <span class="result-label">Transaction ID</span>
                    <span class="result-value">${trxId}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Error</span>
                    <span class="result-value" style="color: var(--danger-color);">${error.message}</span>
                </div>
            </div>
        `;
        
        footerEl.style.display = 'flex';
        footerEl.innerHTML = `
            <button class="btn btn-outline" onclick="closePaymentModal()">Tutup</button>
            <button class="btn btn-primary" onclick="checkTransactionStatus('${trxId}')">
                <i class="fas fa-sync-alt"></i> Coba Lagi
            </button>
        `;
    }
}

// ===== Retry Transaction via FMS (Re-push same token) =====
async function retryTransactionViaFMS() {
    if (!state.lastApiRequest) {
        showToast('Error', 'Tidak ada data transaksi untuk di-push ulang', 'error');
        return;
    }

    const { apiUrl, requestBody } = state.lastApiRequest;
    const detailsEl = document.getElementById('paymentDetails');
    const footerEl = document.getElementById('paymentFooter');

    detailsEl.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: var(--gray-600);">Re-push transaksi <strong>${requestBody.trx_id}</strong> via FMS...</p>
        </div>
    `;
    footerEl.innerHTML = '';

    log(`Re-pushing transaction via FMS: ${requestBody.trx_id}`, 'info');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        }).catch(err => {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') throw new Error('FMS re-push timeout: middleware tidak merespon dalam 60 detik');
            throw err;
        });

        clearTimeout(timeoutId);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMsg = data.error || `FMS Error: ${response.status}`;
            throw new Error(errorMsg);
        }

        log(`FMS re-push response: ${JSON.stringify(data)}`, 'received');
        handlePaymentResponse(data);

        footerEl.style.display = 'flex';
        footerEl.innerHTML = `<button class="btn btn-primary" onclick="closePaymentModal()">Tutup</button>`;

    } catch (error) {
        log(`FMS re-push error: ${error.message}`, 'error');

        detailsEl.innerHTML = `
            <div class="payment-result error">
                <div class="result-title error">
                    <i class="fas fa-exclamation-triangle"></i> FMS Re-push Gagal
                </div>
                <div class="result-item">
                    <span class="result-label">Transaction ID</span>
                    <span class="result-value">${requestBody.trx_id}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Error</span>
                    <span class="result-value" style="color: var(--danger-color);">${error.message}</span>
                </div>
            </div>
        `;

        footerEl.style.display = 'flex';
        footerEl.innerHTML = `
            <button class="btn btn-outline" onclick="closePaymentModal()">Tutup</button>
            <button class="btn btn-outline" onclick="checkTransactionStatus('${requestBody.trx_id}')">
                <i class="fas fa-search"></i> Cek Status
            </button>
            <button class="btn btn-primary" onclick="retryTransactionViaFMS()">
                <i class="fas fa-redo"></i> Coba Lagi
            </button>
        `;
    }
}

// ===== Retry Transaction via WebSocket (WS/WSS) =====
async function retryTransactionViaWS() {
    // Gunakan currentTransaction atau fallback ke lastWsTransaction
    const txn = state.currentTransaction || state.lastWsTransaction;
    if (!txn) {
        showToast('Error', 'Tidak ada data transaksi untuk di-retry', 'error');
        return;
    }
    // Pastikan currentTransaction terisi untuk retry
    if (!state.currentTransaction) {
        state.currentTransaction = { ...txn };
    }

    const { trxId, encryptedToken, payload } = state.currentTransaction;
    const detailsEl = document.getElementById('paymentDetails');
    const footerEl = document.getElementById('paymentFooter');

    detailsEl.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: var(--gray-600);">Retry transaksi <strong>${trxId}</strong> via WebSocket...</p>
        </div>
    `;
    footerEl.innerHTML = '';

    // Track retry start time
    const retryStartTime = new Date();
    
    log('========================================', 'info');
    log(`🔄 RETRY TRANSACTION STARTED`, 'info');
    log('========================================', 'info');
    log(`Transaction ID: ${trxId}`, 'info');
    log(`Retry Start Time: ${retryStartTime.toLocaleTimeString('id-ID', { hour12: false })}`, 'info');
    log(`Time Since Original: ${((retryStartTime - state.transactionStartTime) / 1000).toFixed(2)}s`, 'info');
    log('========================================', 'info');
    log(`🔄 Retrying transaction via WebSocket: ${trxId}`, 'info');
    log('========================================', 'info');

    try {
        // Ensure connection
        if (!state.isConnected) {
            log('Reconnecting to EDC...', 'info');
            await connectToEDC();
        }

        if (!state.isConnected) {
            throw new Error('Failed to reconnect to EDC');
        }

        log(`✅ Connection established for retry`, 'success');
        log(`WebSocket state: ${ecrWs.ws?.readyState === WebSocket.OPEN ? 'OPEN' : 'NOT OPEN'}`, 'info');

        // Resend encrypted token
        log(`Resending encrypted token for trx_id: ${trxId}`, 'info');
        const sent = ecrWs.send(encryptedToken);
        
        if (!sent) {
            throw new Error('Failed to resend payment request');
        }

        log(`✅ Message sent successfully`, 'success');

        // Set timeout for WebSocket response
        const messageTimeoutMs = state.settings.wsMessageTimeout || 30000;
        
        // Clear previous timeout if exists
        if (state.currentTransactionTimeoutHandler) {
            clearTimeout(state.currentTransactionTimeoutHandler);
            log('Cleared previous timeout handler', 'info');
        }

        const messageTimeoutHandler = setTimeout(() => {
            log(`⏱️ WebSocket message timeout for retry trx_id: ${trxId}`, 'warning');
            
            const statusEl = document.getElementById('paymentStatus');
            const detailsEl = document.getElementById('paymentDetails');
            const footerEl = document.getElementById('paymentFooter');
            
            if (statusEl && detailsEl && footerEl) {
                statusEl.style.display = 'none';
                detailsEl.style.display = 'block';
                footerEl.style.display = 'flex';
                
                detailsEl.innerHTML = `
                    <div class="payment-result error">
                        <div class="result-title error">
                            <i class="fas fa-clock"></i> Retry Timeout
                        </div>
                        <div class="result-item">
                            <span class="result-label">Transaction ID</span>
                            <span class="result-value">${trxId}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Error</span>
                            <span class="result-value" style="color: var(--danger-color);">EDC tidak merespon dalam ${messageTimeoutMs}ms</span>
                        </div>
                        <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--gray-600);">
                            Transaksi mungkin masih diproses di EDC. Coba retry lagi atau tutup modal.
                        </p>
                    </div>
                `;
                
                footerEl.innerHTML = `
                    <button class="btn btn-outline" onclick="closePaymentModal()">Tutup</button>
                    <button class="btn btn-primary" onclick="retryTransactionViaWS()">
                        <i class="fas fa-redo"></i> Retry Lagi
                    </button>
                `;
            }
        }, messageTimeoutMs);

        state.currentTransactionTimeoutHandler = messageTimeoutHandler;
        log(`⏱️ Message timeout set to ${messageTimeoutMs}ms`, 'info');
        log('========================================', 'info');
        log('Waiting for EDC response...', 'info');

    } catch (error) {
        log(`❌ WebSocket retry error: ${error.message}`, 'error');

        detailsEl.innerHTML = `
            <div class="payment-result error">
                <div class="result-title error">
                    <i class="fas fa-exclamation-triangle"></i> Retry Gagal
                </div>
                <div class="result-item">
                    <span class="result-label">Transaction ID</span>
                    <span class="result-value">${trxId}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Error</span>
                    <span class="result-value" style="color: var(--danger-color);">${error.message}</span>
                </div>
            </div>
        `;

        footerEl.style.display = 'flex';
        footerEl.innerHTML = `
            <button class="btn btn-outline" onclick="closePaymentModal()">Tutup</button>
            <button class="btn btn-primary" onclick="retryTransactionViaWS()">
                <i class="fas fa-redo"></i> Coba Lagi
            </button>
        `;
    }
}

// ===== Action Type UI Update =====
function updateActionTypeUI() {
    const actionType = document.getElementById('actionType')?.value || 'Sale';
    const paymentMethodSection = document.getElementById('paymentMethodSection');
    const cicilanOptions = document.getElementById('cicilanOptions');
    const refundOptions = document.getElementById('refundOptions');
    
    // Show/hide payment method based on action type
    if (actionType === 'Sale') {
        paymentMethodSection.style.display = 'block';
        cicilanOptions.style.display = 'none';
        refundOptions.style.display = 'none';
        // Show all payment methods
        document.querySelectorAll('input[name="paymentMethod"]').forEach(r => {
            r.closest('.payment-method').style.display = '';
        });
    } else if (actionType === 'Settlement') {
        paymentMethodSection.style.display = 'block';
        cicilanOptions.style.display = 'none';
        refundOptions.style.display = 'none';
        // Only show purchase and brizzi for settlement
        document.querySelectorAll('input[name="paymentMethod"]').forEach(r => {
            const show = r.value === 'purchase' || r.value === 'brizzi';
            r.closest('.payment-method').style.display = show ? '' : 'none';
            if (!show && r.checked) {
                document.querySelector('input[name="paymentMethod"][value="purchase"]').checked = true;
            }
        });
    } else if (actionType === 'QrisTap') {
        paymentMethodSection.style.display = 'none';
        cicilanOptions.style.display = 'none';
        refundOptions.style.display = 'none';
    } else if (actionType === 'Cicilan') {
        paymentMethodSection.style.display = 'none';
        cicilanOptions.style.display = 'block';
        refundOptions.style.display = 'none';
    } else if (actionType === 'RefundQris') {
        paymentMethodSection.style.display = 'none';
        cicilanOptions.style.display = 'none';
        refundOptions.style.display = 'block';
    } else {
        // Contactless, CardVerification - only support purchase method
        paymentMethodSection.style.display = 'none';
        cicilanOptions.style.display = 'none';
        refundOptions.style.display = 'none';
    }
    
    // Update pay button state (Settlement & RefundQris doesn't require cart items)
    updateCartSummary();
    
    // Update pay button label
    const payBtn = document.getElementById('payBtn');
    if (actionType === 'Settlement') {
        payBtn.querySelector('span').textContent = 'Settlement Sekarang';
        payBtn.querySelector('i').className = 'fas fa-file-invoice-dollar';
    } else if (actionType === 'QrisTap') {
        payBtn.querySelector('span').textContent = 'Bayar via QRIS TAP';
        payBtn.querySelector('i').className = 'fas fa-mobile-alt';
    } else if (actionType === 'RefundQris') {
        payBtn.querySelector('span').textContent = 'Refund QRIS';
        payBtn.querySelector('i').className = 'fas fa-undo';
    } else {
        payBtn.querySelector('span').textContent = 'Bayar Sekarang';
        payBtn.querySelector('i').className = 'fas fa-check-circle';
    }
}

// ===== Settings =====
function saveSettingsToState() {
    state.settings.connectionType = document.querySelector('input[name="connectionType"]:checked')?.value || 'wss';
    state.settings.protocol = state.settings.connectionType === 'api' ? 'api' : state.settings.connectionType;
    state.settings.edcIp = document.getElementById('edcIp')?.value || '';
    state.settings.edcPort = document.getElementById('edcPort')?.value || '6746';
    state.settings.posAddress = document.getElementById('posAddress')?.value || '172.0.0.1';
    state.settings.secretKey = document.getElementById('secretKey')?.value || 'ECR2022secretKey';
    state.settings.actionType = document.getElementById('defaultActionType')?.value || 'Sale';
    
    // WebSocket Timeout Settings
    state.settings.wsConnectionTimeout = parseInt(document.getElementById('wsConnectionTimeout')?.value) || 10000;
    state.settings.wsMessageTimeout = parseInt(document.getElementById('wsMessageTimeout')?.value) || 30000;
    
    // WebSocket Disconnect Simulation Settings
    state.settings.wsDisconnectAfter = parseInt(document.getElementById('wsDisconnectAfter')?.value) || 0;
    state.settings.wsDisconnectOnSend = document.getElementById('wsDisconnectOnSend')?.checked || false;
    
    // API settings
    state.settings.apiUrl = document.getElementById('apiUrl')?.value || 'https://development-ecrlink.pcsindonesia.com';
    state.settings.apiTimeout = parseInt(document.getElementById('apiTimeout')?.value) || 60;
    state.settings.mid = document.getElementById('mid')?.value || '';
    state.settings.tid = document.getElementById('tid')?.value || '';
    
    // Save to localStorage
    localStorage.setItem('posSettings', JSON.stringify(state.settings));
}

function loadSettings() {
    const saved = localStorage.getItem('posSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            Object.assign(state.settings, settings);
        } catch (error) {
            log('Failed to load settings', 'error');
        }
    }
    
    // Apply to form
    const connectionType = state.settings.connectionType || 'wss';
    const connectionTypeRadio = document.querySelector(`input[name="connectionType"][value="${connectionType}"]`);
    if (connectionTypeRadio) connectionTypeRadio.checked = true;
    
    document.getElementById('edcIp').value = state.settings.edcIp || '';
    document.getElementById('edcPort').value = state.settings.edcPort;
    document.getElementById('posAddress').value = state.settings.posAddress;
    document.getElementById('secretKey').value = state.settings.secretKey;
    document.getElementById('defaultActionType').value = state.settings.actionType;
    
    // WebSocket Timeout Settings
    document.getElementById('wsConnectionTimeout').value = state.settings.wsConnectionTimeout || 10000;
    document.getElementById('wsMessageTimeout').value = state.settings.wsMessageTimeout || 30000;
    
    // WebSocket Disconnect Simulation Settings
    document.getElementById('wsDisconnectAfter').value = state.settings.wsDisconnectAfter || 0;
    document.getElementById('wsDisconnectOnSend').checked = state.settings.wsDisconnectOnSend || false;
    
    // API settings
    document.getElementById('apiUrl').value = state.settings.apiUrl || 'https://development-ecrlink.pcsindonesia.com';
    document.getElementById('apiTimeout').value = state.settings.apiTimeout || 60;
    document.getElementById('mid').value = state.settings.mid || '';
    document.getElementById('tid').value = state.settings.tid || '';
    
    // Update visibility of fields based on connection type
    updateConnectionFields();
}

function saveSettings(event) {
    event.preventDefault();
    saveSettingsToState();
    log('Settings saved', 'success');
    showToast('Success', 'Settings saved successfully', 'success');
}

// ===== Encryption Test Function =====
function testEncryptionComparison() {
    // Test payload - exact same as user provided
    const testPayload = {
        "amount": 1,
        "action": "Sale",
        "trx_id": "TXNMMP1DWPCGEIOBK",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-03-13 22:13:24",
        "method": "qris"
    };
    
    log('========================================', 'info');
    log('🔐 ENCRYPTION COMPARISON TEST', 'info');
    log('========================================', 'info');
    log(`Test Payload: ${JSON.stringify(testPayload)}`, 'info');
    log('', 'info');
    
    // Test 1: Simulate WSS encryption
    log('--- TEST 1: WSS Path Simulation ---', 'info');
    const tokenWSS = ECREncryption.generateToken(testPayload);
    log(`[WSS] Token: ${tokenWSS}`, 'info');
    log('', 'info');
    
    // Test 2: Simulate API encryption (same function!)
    log('--- TEST 2: API Path Simulation ---', 'info');
    const tokenAPI = ECREncryption.generateToken(testPayload);
    log(`[API] Token: ${tokenAPI}`, 'info');
    log('', 'info');
    
    // Comparison
    log('--- COMPARISON ---', 'info');
    const areEqual = tokenWSS === tokenAPI;
    log(`Tokens are IDENTICAL: ${areEqual ? '✅ YES' : '❌ NO'}`, areEqual ? 'success' : 'error');
    
    if (!areEqual) {
        log(`Length WSS: ${tokenWSS.length}`, 'info');
        log(`Length API: ${tokenAPI.length}`, 'info');
    }
    
    log('', 'info');
    log(`Token Length: ${tokenWSS.length} characters`, 'info');
    log(`Secret Key Used: ${state.settings.secretKey || 'ECR2022secretKey'}`, 'info');
    log('========================================', 'info');
    
    return { wss: tokenWSS, api: tokenAPI, equal: areEqual };
}

// Make it available globally for console testing
window.testEncryptionComparison = testEncryptionComparison;

// ===== Connection Type Toggle =====
function updateConnectionFields() {
    const connectionType = document.querySelector('input[name="connectionType"]:checked')?.value || 'wss';
    const directEdcFields = document.getElementById('directEdcFields');
    const apiFields = document.getElementById('apiFields');
    const apiModeBanner = document.getElementById('apiModeBanner');
    
    if (connectionType === 'api') {
        directEdcFields.style.display = 'none';
        apiFields.style.display = 'block';
        if (apiModeBanner) apiModeBanner.style.display = 'block';
    } else {
        directEdcFields.style.display = 'block';
        apiFields.style.display = 'none';
        if (apiModeBanner) apiModeBanner.style.display = 'none';
    }
}

// ===== Utilities =====
function formatPrice(price) {
    return price.toLocaleString('id-ID');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== Toast Notifications =====
function showToast(title, message, type = 'info') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <i class="fas fa-times toast-close" onclick="this.parentElement.remove()"></i>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    // Load settings
    loadSettings();
    
    // Initial render
    renderMenuGrid();
    renderMenuTable();
    renderCart();
    updateCartSummary();
    updateConnectionStatus();
    updateInfoPanel();
    updateActionTypeUI();
    
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab);
        });
    });
    
    // Search menu
    document.getElementById('searchMenu')?.addEventListener('input', renderMenuGrid);
    
    // Action type change
    document.getElementById('actionType')?.addEventListener('change', updateActionTypeUI);
    
    // Log initial message
    log('POS Dummy ECR Link initialized', 'info');
    log('AES/ECB/PKCS5Padding encryption ready', 'info');
    log('Please configure EDC IP address in Settings', 'info');
});

// Handle protocol change to update default port
document.querySelectorAll('input[name="protocol"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const portInput = document.getElementById('edcPort');
        if (e.target.value === 'wss') {
            portInput.value = '6746';
        } else {
            portInput.value = '6745';
        }
    });
});

// ===== DNS Hosts Setup Functions =====
function showHostsSetup() {
    // No longer needed - using direct IP connection
    log('Hosts setup is not needed in direct IP mode', 'info');
}

function closeHostsModal() {
    const modal = document.getElementById('hostsModal');
    if (modal) modal.classList.remove('active');
}

// ===== Certificate Setup Functions =====
function showCertificateSetup() {
    // No longer needed - using direct IP connection
    log('Certificate setup is not needed in direct IP mode', 'info');
}

function closeCertificateModal() {
    const modal = document.getElementById('certificateModal');
    if (modal) modal.classList.remove('active');
}

// Certificate download and verify no longer needed in direct IP mode
function downloadCertificate() {
    log('Certificate download is not needed in direct IP mode', 'info');
}

function verifyCertificate() {
    log('Certificate verification is not needed in direct IP mode', 'info');
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
        closeModal();
        closePaymentModal();
    }
    
    // F2 for payment
    if (e.key === 'F2' && state.cart.length > 0) {
        e.preventDefault();
        processPayment();
    }
});
