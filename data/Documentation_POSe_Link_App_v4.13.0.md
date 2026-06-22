# Documentation POSe Link App Version 4.13.0

> **Technical Document** | PCS Indonesia  
> Latest Version: 4.13.0 | Date: 17 March 2026

---

## Version History

Version
Date
Author
**Description:** V0.0.1 30 September 2022 Vanesha Asyariza ECR Link Document V0.0.2 24 January 2023 Vanesha Asyariza - Update Required Parameters Sale & Brizzi - Update Response Parameter Sale & Brizzi - Added request and response for QRIS transactions. V2.1.0

03 Februari 2023
Vanesha Asyariza
-
Added the batch_number parameter to
all response payloads.
-
Update response Settlement.
V2.2.0
14 Februari 2023
Vanesha Asyariza
-
Added the WSS application protocol.
-
Added the method field to the request
payload.
V3.0.0
30 March 2023
Vanesha Asyariza
-
Add bluetooth connection
-
Update UI ECR Link
-
Added PAN and card_name fields to the
response payloads.
V4.0.0
04 May 2023
Vanesha Asyariza
-
Add USB connection
V4.1.0
15 September 2023 Marchella Anrisya
-
Added data encryption methods.
-
Add action contactless
-
Added the fields is_off_us, is_credit, and
card_category to the response payload.
-
Added notifications for sale and void
transactions when the EDC screen is
locked.

-
Automatic transmission of successful
responses to the POS after a 5-second
delay.
4.1.1
16 October 2023
Marchella Anrisya
-
Added an example of data encryption for
ECR Link.
4.2.4
17 January 2024
Marchella Anrisya
-
Auto connect
-
Send Log data POS and EDC
4.2.6
20 March 2024
Marchella Anrisya
-
Enhanced the ECRLink service to remain
active during prolonged EDC idle periods.
4.3.0
03 May 2024
Marchella Anrisya
-
Added the Purchase -  Card Verification
feature.
-
Added the Purchase -  Sale Completion
feature.
-
Added the Purchase -
Installment
feature.
-
Added the plan and period fields to the
response payload
4.8.0
11 March 2025
Nila Humairah
-
Added the transaction check feature.
4.9.0
16 April 2025
Nila Humairah
-
Added the Purchase Void Check feature.
-
Added the Brizzi Void Check feature.
-
Added the insufficient balance check
feature.
-
Added the QRIS refund check feature.
-
Added the ACK feature.
-
Added the EDC busy status feature.
4.10.0
12 May 2025
Nila Humairah
-
Added the QRIS TAP feature.

-
Added the Refund QRIS TAP feature.
4.10.1
30 September 2025 Nila Humairah
-
Added the Release Card Verification
feature.
4.11.1
30 September 202
Nila Humairah
-
Added version_code and version_name
parameters to all responses.
4.12.0
5 January 2026
Nila Humairah
-
SSL certificate renewal to enhance the
security of system connections.
-
Addition of version logging as part of
application
change
recording
and
traceability.
-
Adjustment and optimization of the
timestamp processing workflow to reduce
latency and ensure more precise time
validation across the system.
-
Implementation of an ACK response
mechanism
for Bluetooth and USB
connections to ensure reliable data
communication.
-
Addition of transaction ID validation
supporting alphanumeric characters and
permitted symbols (dot (.), equals sign
(=), hyphen (-), and underscore (_)).
4.13.0
17 March 2026
M Arif Yudhistira
-
Add
new
protocol
(API)
also
the
explanation,
url
dev
and
postman
collection

## POSe Link Merchant

## 1. Overview

The POSe Link application connects external device applications with the EDC. It connects via
the same internet connection, such as Wi-Fi, Bluetooth, or USB. The application installed on the
EDC is the FMS BRI Merchant application.

## 2. Signature / Data Encryption

Data transmitted from the external device to the EDC will be encrypted using the
AES/ECB/PKCS5Padding algorithm. The encryption functionality is developed by the POS
merchant using the Java programming language, utilizing a secret key provided by PCS
Indonesia.
```java
public class EncryptAes {

    private static SecretKeySpec secretKey;
    private static byte[] key;
    private final String secret = "ECR2022secretKey";

    private void setKey(final String myKey) {
        MessageDigest sha = null;
        try {
            key = myKey.getBytes("UTF-8");
            sha = MessageDigest.getInstance("SHA-1");

            key = sha.digest(key);
            key = Arrays.copyOf(key, 16);
            secretKey = new SecretKeySpec(key, "AES");
            System.out.println("");
        } catch (NoSuchAlgorithmException | UnsupportedEncodingException e) {
            e.printStackTrace();
        }
    }

    public String encrypt(final String strToEncrypt) {
        try {
            setKey(secret);
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            return Base64.getEncoder().encodeToString(cipher.doFinal(strToEncrypt.getBytes("UTF-8")));
        } catch (Exception e) {
            System.out.println("Error while encrypting: " + e.toString());
        }
        return null;
    }

The secret key used for the development mode is: ECR2022secretKey.
An example of data encryption can be found at the link below, in the file named ecr_encrypt.
Additionally, connection methods for Bluetooth and USB in Java are also available at the
following link: Link File.
3.
Architecture Diagram POSe Link
The architecture diagram for the POSe Link application, which connects the external application
(POS) with the EDC, is as follows:

Explanation of POSe Link with Wi-Fi Connection:
1. The application uses the WSS (WebSocket Secure) protocol.
2. The external application has an IP address identified as pos_address.
```

3. Both the external application and the EDC share the same Wi-Fi connection.
4. The POSe Link application carries the EDC’s IP address, referred to as edc_address.
5. The EDC runs two applications: POSe Link and FMS BRI.
6. The external application sends data, which is then directly displayed on the FMS BRI application via POSe Link.
7. Transactions are processed on the EDC within the FMS BRI application, and the responses are sent back and displayed on the external application.

Explanation of POSe Link with Bluetooth Connection:
1. The external application connects to the EDC via Bluetooth, indicated by a “connected” status on the external application.
2. The external application sends data, which is directly displayed on the FMS BRI application via POSe Link.
3. Transactions are processed on the EDC within the FMS BRI application, and the responses are sent back and displayed on the external application.

Explanation of POSe Link with USB Connection
1.
The external application connects to the EDC via USB using a USB serial port RS-232
converter and a USB Type-C OTG Adapter 2-in-1 connected to the POS as the external
device.
2. The external application sends data, which is directly displayed on the FMS BRI

application via POSe Link.
3. Transactions are processed on the EDC within the FMS BRI application, and the

responses are sent back and displayed on the external application.

Explanation of POSe Link with API Connection
1.
The external application connects to the EDC via API through the POSeLink Middleware,
without requiring a direct network connection between the POS and the EDC.
2.
The external application sends encrypted transaction data to the middleware endpoint
using HTTPS.
3.
The middleware forwards the transaction to the EDC via Ably (real-time messaging
service) based on the registered MID/TID mapping.
4. The external application sends data, which is directly displayed on the FMS BRI

application via POSe Link.
5. Transactions are processed on the EDC within the FMS BRI application, and the

responses are sent back through the middleware and displayed on the external
application.

## 4. POSe Link Specification

The specifications used to run the POSe Link application on the EDC FMS BRI are as follows:

Device
-
EDC Sunmi P1-4G / P2
-
Merchant external application

Application
-
FMS BRI Phase >= 3
-
Respon dengan value N/A akan update jika menggunakan aplikasi
FMS BRI Phase >= 3.2
-
POSe Link App
Koneksi 1
edc_address/Port
Wi-Fi
wss://edc_address:6746
wss://edc_address:6747
Koneksi 2
Bluetooth
Koneksi 3
USB
Koneksi 4
url_dev
Postman collection
API
https://development-ecrlink.pcsindonesia.com
POSeLink_API_Client.postman_collection.json

### 4.1. Sale

> **Name:** `Sale`
> **Format:** `JSON`
**Description:** Executing the Sale Menu in the BRI FMS Application Triggered by an External Application via POSe Link. The Sale menu in the BRI FMS application can be triggered directly by an external application through the POSe Link interface. The Sale function supports multiple payment methods, including Purchase, Brizzi, and QRIS. After initiating the request, users can select the desired payment method. 9 Version 4.12.0

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `amount` | int | yes | The transaction amount is automatically displayed on |
the
EDC screen during
payment.
| `action` | String | no | The transaction menu is “Sale”. |
| `trx_id` | Alphanumeric | yes | The |
transaction
ID
is
obtained from the external
application.
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The available transaction |
types
include
three
options: purchase, brizzi,
and QRIS.

**Required Body Sample:**

```json
    {
        "action": "Sale",
        "trx_id": "icacobabelanja_1sale",
        "amount": "1",
        "pos_address": "{{ecr_pos_address}}",
        "time_stamp": "{{current_timestamp}}",
        "method": "purchase"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `pos_address` | String | yes | The IP address of the external application. trace_number int The transaction ID from the transaction receipt. |
| `action` | String | no | The transaction menu is “Sale”. |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `trx_id` | Alphanumeric | yes | The transaction ID is |
obtained
from
the
external application.

| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The |
transaction
types
available are: purchase,
brizzi, and QRIS.
| `status` | String | no | Transaction |
status
information:
Success for purchase and
brizzi transactions.
Paid
for
QRIS
transactions.
| `reff_id` | String | no | The transaction ID used for refunds in the QRIS method. |
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.

| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `card_name` | String | no | Transaction card type: NSICCS, Visa, Mastercard, or JCB. |
| `pan` | String | no | Masked |
card
| `pan` |  | no | used in the transaction. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.

| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

Purchase - Sale
```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",
        "approval": "503798",
        "batch_number": "00003",
        "card_category": "VISA BRI",
        "card_name": "VISA",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Success A",
        "pan": "4365 0299 **** 1702",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600507964591",
        "status": "success",
        "trace_number": "000033",
        "transaction_date": "2026-01-05 14:13:02",
        "trx_id": "icacobabelanja_1sale",
        "version_code": "43",
        "version_name": "4.12.0"

    }
```

Brizzi - Payment
```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",
        "approval": "3E13F4B7",
        "batch_number": "00001",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "Tap",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "brizzi",
        "msg": "Transaction Success",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "000038",
        "status": "success",
        "trace_number": "38",
        "transaction_date": "2026-01-05 14:25:25",
        "trx_id": "icacobabelanja_2brizzi",
        "version_code": "43",
        "version_name": "4.12.0"

    }
```

QRIS - Generate QR
```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "00003",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "transaksi berhasil",
        "pan": "***************5255",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "000937677230",
        "reff_id": "2349708316",
        "status": "paid",
        "trace_number": "47",
        "transaction_date": "2026-01-05 15:17:53",

        "trx_id": "icacobabelanja_2qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `failed (RC 50 - Incorrect Pin)`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "00003",
        "card_category": "VISA BRI",
        "card_name": "VISA",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "4365 0299 **** 1702",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "-01 TC - 50 - Pin Salah (transactionErrorResult isResultEnd: true, code
    : -50024)",
        "reference_number": "600507963755",
        "status": "failed",

        "trace_number": "000031",
        "transaction_date": "2026-01-05 14:11:43",
        "trx_id": "icacobabelanja_1sale",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `failed (QR unpaid)`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "00003",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi Unpaid",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "074768602880",
        "reff_id": "N/A",

        "status": "unpaid",
        "trace_number": "41",
        "transaction_date": "2026-01-05 15:11:26",
        "trx_id": "icacobabelanja_2qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Transaction cancelled.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",

        "status": "failed",
        "trace_number": "000030",
        "transaction_date": "2026-01-05 14:10:20",
        "trx_id": "icacobabelanja_1sale",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `The transaction is executed with an identical trx_id.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",
        "approval": "503798",
        "batch_number": "00003",
        "card_category": "VISA BRI",
        "card_name": "VISA",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaksi telah berhasil dilakukan dengan trxID ini",
        "pan": "4365 0299 **** 1702",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600507964591",

        "status": "success",
        "trace_number": "000033",
        "transaction_date": "2026-01-05 14:13:02",
        "trx_id": "icacobabelanja_1sale",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Insufficient balance.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Cicilan",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "06",
        "plan": "003",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",

        "status": "failed",
        "trace_number": "000061",
        "transaction_date": "2026-01-06 09:41:53",
        "trx_id": "icacobabelanja_1cicilan",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.2. Contactless

> **Name:** `Contactless`
> **Format:** `JSON`
**Description:** Executing the Sale Contactless Menu in the BRI FMS Application via POSe Link. The Sale Contactless menu in the BRI FMS application can be triggered directly by an external application through the POSe Link interface. The Contactless option is available only for the Purchase payment method. It supports contactless payments using Visa and Mastercard cards via the tap method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `amount` | int | yes | The transaction amount is automatically displayed on |
the
EDC screen during
payment.

| `action` | String | no | The transaction menu is Contactless. |
| `trx_id` | Alphanumeric | yes | The |
transaction
ID
is
obtained from the external
application.
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The transaction type that can be selected is Purchase. |
**Required Body Sample:**

```json
    {
        "action": "Contactless",
        "trx_id": "icacobabelanja_1contactless",
        "amount": "1",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-06 09:25:08",
        "method": "purchase"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `pos_address` | String | yes | The IP address of the external application. trace_number int The transaction ID from the transaction receipt. |
| `action` | String | no | The transaction menu is Contactless. |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `trx_id` | Alphanumeric | yes | The transaction ID is |
obtained
from
the
external application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The transaction type that |
can
be
selected
is
Purchase.

| `status` | String | no | The transaction status |
indicates
success
for
Purchase transactions.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.

| `batch_number` | String | no | r Transaction group from the trace_number. |
| `card_name` | String | no | Transaction card type: NSICCS, Visa, Mastercard, or JCB. |
| `pan` | String | no | Masked |
card
| `pan` |  | no | used in the transaction. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |

| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

Purchase - Contactless
```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Contactless",
        "amount": "1",
        "approval": "240390",
        "batch_number": "00001",
        "card_category": "MASTER CARD",
        "card_name": "MASTERCARD",
        "card_type": "TAP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",

        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Success",
        "pan": "5188 5621 **** 9709",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "536309586648",
        "status": "success",
        "trace_number": "000008",
        "transaction_date": "2025-12-29 16:04:32",
        "trx_id": "cobabelanja_1contactless",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `failed (Time Out)`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Contactless",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",

        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000097",
        "transaction_date": "2026-01-07 11:32:17",
        "trx_id": "icacobabelanja_2contactless",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Transaction cancelled.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Contactless",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",

        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000010",
        "transaction_date": "2025-12-29 16:06:54",
        "trx_id": "cobabelanja_3contactless",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `The transaction is executed with an identical trx_id.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Contactless",
        "amount": "1",
        "approval": "240390",
        "batch_number": "00001",
        "card_category": "MASTER CARD",
        "card_name": "MASTERCARD",
        "card_type": "TAP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",

        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaksi telah berhasil dilakukan dengan trxID ini",
        "pan": "5188 5621 **** 9709",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "536309586648",
        "status": "success",
        "trace_number": "000008",
        "transaction_date": "2025-12-29 16:04:32",
        "trx_id": "cobabelanja_1contactless",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.3. Card Verification

> **Name:** `Card Verification`
> **Format:** `JSON`
**Description:** Executing the Card Verification Menu in the BRI FMS Application via POSe Link. The Card Verification menu in the BRI FMS application can be triggered directly by an external application through the POSe Link interface. Card Verification is available only for the Purchase payment method and supports credit card payments.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|

Parameter
Data
Type
Mandatory Description
| `amount` | int | yes | The transaction amount is automatically displayed on |
the
EDC screen during
payment.
| `action` | String | no | The transaction menu is Card Verification |
| `trx_id` | Alphanumeric | yes | The |
transaction
ID
is
obtained from the external
application.
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The transaction type that can be selected is Purchase. |
**Required Body Sample:**

```json
    {
        "action": "Card Verification",
        "trx_id": "icacobabelanja_1cardver",
        "amount": "1",

        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-06 09:25:08",
        "method": "purchase"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `pos_address` | String | yes | The IP address of the external application. trace_number int The transaction ID from the transaction receipt. |
| `action` | String | no | The transaction menu is Card Verification. |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `trx_id` | Alphanumeric | yes | The transaction ID is |
obtained
from
the
external application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.

| `method` | String | no | The transaction type that |
can
be
selected
is
Purchase.
| `status` | String | no | The transaction status |
indicates
success
for
Purchase transactions.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |

| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `card_name` | String | no | Transaction card type: NSICCS, Visa, Mastercard, or JCB. |
| `pan` | String | no | Masked |
card
| `pan` |  | no | used in the transaction. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes 36 Version 4.12.0 means the card belongs to a no |
No means it is a BRI card.
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

Purchase - Card Verification
```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Card Verification",
        "amount": "1",
        "approval": "240402",
        "batch_number": "00004",
        "card_category": "MASTER CARD",
        "card_name": "MASTERCARD",

        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Success A",
        "pan": "5188 5621 **** 9709",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600602381346",
        "status": "success",
        "trace_number": "000056",
        "transaction_date": "2026-01-06 09:28:28",
        "trx_id": "icacobabelanja_1cardver",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `failed (Time Out)`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Card Verification",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",

        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000054",
        "transaction_date": "2026-01-06 09:25:39",
        "trx_id": "icacobabelanja_1cardver",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Transaction cancelled.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Card Verification",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",

        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000053",
        "transaction_date": "2026-01-06 09:25:14",
        "trx_id": "icacobabelanja_1cardver",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `The transaction was performed using the same trx_id.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Card Verification",
        "amount": "1",
        "approval": "240402",
        "batch_number": "00004",
        "card_category": "MASTER CARD",
        "card_name": "MASTERCARD",

        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaksi telah berhasil dilakukan dengan trxID ini",
        "pan": "5188 5621 **** 9709",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600602381346",
        "status": "success",
        "trace_number": "000056",
        "transaction_date": "2026-01-06 09:28:28",
        "trx_id": "icacobabelanja_1cardver",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.4. Sale Completion

> **Name:** `Sale Completion`
> **Format:** `JSON`
**Description:** Executing the Sale Completion Menu in the BRI FMS Application via POSe Link. The Sale Completion menu in the BRI FMS application can be triggered directly by an external application through the POSe Link interface. Sale Completion is available only for the Purchase payment method. Its function is to authorize a previously performed Card 41 Version 4.12.0

Verification transaction. Sale Completion uses the same card and the
approval code obtained from the Card Verification receipt.
**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `amount` | int | yes | The transaction amount is automatically displayed on |
the
EDC screen during
payment.
| `action` | String | no | The transaction menu is Sale Completion. |
| `trx_id` | Alphanumeric | yes | The |
transaction
ID
is
obtained from the external
application.
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The transaction type that can be selected is Purchase. 42 Version 4.12.0 |
| `approval` | String | yes | Approval code from the Card Verification transaction. |
**Required Body Sample:**

```json
    {
        "action": "Sale Completion",
        "trx_id": "icacobabelanja_1salecomp",
        "amount": "1",
        "approval": "240402",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-06 09:32:57",
        "method": "purchase"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `pos_address` | String | yes | The IP address of the external application. trace_number int The transaction ID from the transaction receipt. |
| `action` | String | no | The transaction menu is Sale Competition. 43 Version 4.12.0 |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `trx_id` | Alphanumeric | yes | The transaction ID is |
obtained
from
the
external application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The transaction type that |
can
be
selected
is
Purchase.
| `status` | String | no | The transaction status |
indicates
success
for
Purchase transactions.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.

| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `card_name` | String | no | Transaction card type: NSICCS, Visa, Mastercard, or JCB. |
| `pan` | String | no | Masked |
card
| `pan` |  | no | used in the transaction. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.

| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

Purchase - Sale Completion
```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale Completion",
        "amount": "1",
        "approval": "240402",
        "batch_number": "00004",
        "card_category": "MASTER CARD",
        "card_name": "MASTERCARD",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Success",
        "pan": "5188 5621 **** 9709",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600602381346",
        "status": "success",
        "trace_number": "000060",
        "transaction_date": "2026-01-06 09:37:08",
        "trx_id": "icacobabelanja_1salecomp",
        "version_code": "43",
        "version_name": "4.12.0"

    }
```

**Error Response Code:** `failed (Time Out)`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale Completion",
        "amount": "1",
        "approval": "240402",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000057",
        "transaction_date": "2026-01-06 09:33:01",
        "trx_id": "icacobabelanja_1salecomp",
        "version_code": "43",
        "version_name": "4.12.0"

    }
```

**Error Response Code:** `Transaction cancelled.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale Completion",
        "amount": "1",
        "approval": "240402",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000059",
        "transaction_date": "2026-01-06 09:36:43",
        "trx_id": "icacobabelanja_1salecomp",
        "version_code": "43",
        "version_name": "4.12.0"

    }
```

**Error Response Code:** `The transaction was performed using the same trx_id.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale Completion",
        "amount": "1",
        "approval": "240402",
        "batch_number": "00004",
        "card_category": "MASTER CARD",
        "card_name": "MASTERCARD",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaksi telah berhasil dilakukan dengan trxID ini",
        "pan": "5188 5621 **** 9709",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600602381346",
        "status": "success",
        "trace_number": "000060",
        "transaction_date": "2026-01-06 09:37:08",
        "trx_id": "icacobabelanja_1salecomp",
        "version_code": "43",
        "version_name": "4.12.0"

    }
```

### 4.5. Release Card Verification

> **Name:** `Release Card Verification`
> **Format:** `JSON`
**Description:** Executing the Release Card Verification Menu in the BRI FMS Application via POSe Link. The Release Card Verification menu in the BRI FMS application can be triggered directly by an external application through the POSe Link interface. This feature is used to cancel a Card Verification transaction and restore the credit card limit.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `amount` | int | yes | The transaction amount is automatically displayed on |
the
EDC screen during
payment.
| `action` | String | no | The transaction menu is Release Card Verification. |
| `trx_id` | Alphanumeric | yes | The |
transaction
ID
is
obtained from the external
application.

| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The transaction type that can be selected is Purchase. Approval The transaction approval code. |
**Required Body Sample:**

```json
    {
        "action": "Release Card Verification",
        "trx_id": "icacobabelanja_1releasecardver",
        "amount": "1",
        "approval": "503808",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-07 10:07:28",
        "method": "purchase"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `pos_address` | String | yes | The IP address of the external application. trace_number int The transaction ID from the transaction receipt. |
| `action` | String | no | The transaction menu is Contactless |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `trx_id` | Alphanumeric | yes | The transaction ID is |
obtained
from
the
external application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The transaction type that |
can
be
selected
is
Purchase.

| `status` | String | no | The transaction status |
indicates
success
for
Purchase transactions.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.

| `batch_number` | String | no | r Transaction group from the trace_number. |
| `card_name` | String | no | Transaction card type: NSICCS, Visa, Mastercard, or JCB. |
| `pan` | String | no | Masked |
card
| `pan` |  | no | used in the transaction. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |

| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

Purchase - Release Card Verification
```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Release Card Verification",
        "amount": "1",
        "approval": "503808",
        "batch_number": "00005",
        "card_category": "VISA BRI",
        "card_name": "VISA",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Success",
        "pan": "4365 0299 **** 1702",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",

        "reference_number": "600703979535",
        "status": "success",
        "trace_number": "000084",
        "transaction_date": "2026-01-07 10:08:55",
        "trx_id": "icacobabelanja_1releasecardver",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Approval number does not match.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Release Card Verification",
        "amount": "1",
        "approval": "503800",
        "batch_number": "00005",
        "card_category": "VISA BRI",
        "card_name": "VISA",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "4365 0299 **** 1702",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",

        "rc": "-01 TC - 12 - Hubungi penerbit kartu Anda (transactionErrorResult
    isResultEnd: true, code : -50024)",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000082",
        "transaction_date": "2026-01-07 10:06:03",
        "trx_id": "icacobabelanja_1releasecardver",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Card Verification release has been cancelled.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Release Card Verification",
        "amount": "1",
        "approval": "503800",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",

        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000080",
        "transaction_date": "2026-01-07 10:02:56",
        "trx_id": "icacobabelanja_1releasecardver",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.6. Installment

> **Name:** `Installment`
> **Format:** `JSON`
**Description:** Executing the Installment Menu in the BRI FMS Application via POSe Link. The Installment menu in the BRI FMS application can be triggered directly by an external application through the POSe Link interface. The Installment feature is available only for the Purchase payment method using credit cards.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `amount` | int | yes | The transaction amount is automatically displayed on 59 Version 4.12.0 |
the
EDC screen during
payment.
| `action` | String | no | The transaction menu is Installment. |
| `trx_id` | Alphanumeric | yes | The |
transaction
ID
is
obtained from the external
application.
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The transaction type that can be selected is Purchase. |
| `plan` | String | yes | Available interest plans. |
| `periode` | String | yes | Available |
installment
periods.

**Required Body Sample:**

```json
    {
        "action": "Cicilan",
        "trx_id": "icacobabelanja_1cicilan",
        "amount": "1",
        "approval": "240402",

        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-06 09:41:48",
        "method": "purchase",
        "plan": "003",
        "periode": "06"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `pos_address` | String | yes | The IP address of the external application. trace_number int The transaction ID from the transaction receipt. |
| `action` | String | no | The transaction menu is Installment. |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `trx_id` | String | yes | The transaction ID is |
obtained
from
the
external application.

| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The transaction type that |
can
be
selected
is
Purchase.
| `status` | String | no | The transaction status |
indicates
success
for
Purchase transactions.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this 62 Version 4.12.0 is u |
transaction status.
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `card_name` | String | no | Transaction card type: NSICCS, Visa, Mastercard, or JCB. |
| `pan` | String | no | Masked |
card
| `pan` |  | no | used in the transaction. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. 63 Version |

| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

Purchase - Installment
```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Cicilan",
        "amount": "1",

        "approval": "240402",
        "batch_number": "00004",
        "card_category": "MASTER CARD",
        "card_name": "MASTERCARD",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Success",
        "pan": "5188 5621 **** 9709",
        "periode": "06",
        "plan": "003",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600602381346",
        "status": "success",
        "trace_number": "000060",
        "transaction_date": "2026-01-06 09:37:08",
        "trx_id": "icacobabelanja_1cicilan",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `failed (Time Out)`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Cicilan",
        "amount": "1",

        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "06",
        "plan": "003",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000062",
        "transaction_date": "2026-01-06 09:42:49",
        "trx_id": "icacobabelanja_1cicilan",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Transaction cancelled.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Cicilan",
        "amount": "1",

        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Failed",
        "pan": "N/A",
        "periode": "06",
        "plan": "003",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "000061",
        "transaction_date": "2026-01-06 09:41:53",
        "trx_id": "icacobabelanja_1cicilan",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `The transaction was performed using the same trx_id.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Cicilan",
        "amount": "1",

        "approval": "240402",
        "batch_number": "00004",
        "card_category": "MASTER CARD",
        "card_name": "MASTERCARD",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaksi telah berhasil dilakukan dengan trxID ini",
        "pan": "5188 5621 **** 9709",
        "periode": "06",
        "plan": "003",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600602381346",
        "status": "success",
        "trace_number": "000060",
        "transaction_date": "2026-01-06 09:37:08",
        "trx_id": "icacobabelanja_1cicilan",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.7. Void

> **Name:** `Void`
> **Format:** `JSON`

**Description:** Executing the Void Menu in the BRI FMS Application via POSe Link. The Void menu in the BRI FMS application is used to cancel transactions. It can be triggered directly by an external application through the POSe Link interface. The Void function supports Purchase and Brizzi payment methods. After initiating the request, the user can select the desired payment method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is Void |
| `trace_numbe` | int | yes | r The transaction ID from the transaction receipt. |
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The transaction types that |
can
be
selected
are
Purchase or Brizzi.

**Required Body Sample:**

```json
    {
        "action": "Void",
        "trx_id": "icacobabelanja_1voidpurchase",
        "trace_number": "85",
        "pos_address": "{{ecr_pos_address}}",
        "time_stamp": "{{current_timestamp}}",
        "method": "purchase"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. trace_number int yes The transaction ID from the transaction receipt. action String no The transaction menu is “Sale”.

| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.

| `method` | String | no | The |
transaction
types
that can be selected are
Purchase or Brizzi.
| `status` | String | no | The transaction status |
indicates
success
for
Purchase
transactions.
dan brizzi
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |

| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `card_name` | String | no | Transaction card type: NSICCS, Visa, Mastercard, or JCB. |
| `pan` | String | no | Masked |
card
| `pan` |  | no | used in the transaction. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes 72 Version 4.12.0 means the card belongs to a no |
No means it is a BRI card.
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Void",
        "amount": "1",
        "approval": "503809",
        "batch_number": "00005",
        "card_category": "VISA BRI",
        "card_name": "VISA",
        "card_type": "CHIP",

        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaction Success",
        "pan": "4365 0299 **** 1702",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600703981547",
        "status": "success",
        "trace_number": "000090",
        "transaction_date": "2026-01-07 10:45:50",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Failed if the trace number is incorrect.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Void",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",

        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Data Tidak Ada",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Failed if the transaction has already been voided.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Void",

        "amount": "1",
        "approval": "503809",
        "batch_number": "00005",
        "card_category": "VISA BRI",
        "card_name": "VISA",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaksi telah divoid",
        "pan": "4365 0299 **** 1702",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "600703981547",
        "status": "failed",
        "trace_number": "000085",
        "transaction_date": "2026-01-07 10:45:50",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.8. Check QR Status

> **Name:** `Check QR Status`
> **Format:** `JSON`
**Description:** Executing the Generate QR Transaction Status Check Menu in the BRI FMS Application via POSe Link. The Generate QR Transaction Status Check menu in the BRI FMS application can be triggered directly by an external application through the POSe Link interface. Upon request execution, the process will automatically be directed to the QRIS method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is Check Status |
| `reference_number` | String | yes | Transaction |
number
obtained from BRI host
during QR generation. The
reference
number
is
included on the QR receipt.
| `pos_address` | String | no | The IP address of the external application. 77 Version 4.12.0 |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The selected transaction type is QRIS. |
**Required Body Sample:**

```json
    {
        "action": "Check Trx",
        "trx_id": "icacobabelanja_1salecomp",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-07 11:20:02"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is Check Status edc_address String no The

EDC
IP
address
obtained from the POSe
Link application.

| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The selected transaction type is QRIS. |
| `status` | String | no | Transaction |
| `status` |  | yes | information: ● Paid ● Unpaid ● Refund trace_number int The transaction ID from the transaction receipt. |
| `reff_id` | String | no | Transaction ID used for the refund. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. 79 Version 4.12.0 |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. 80 Version |

| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

Check Status Qris Pay
```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "1",

        "approval": "N/A",
        "batch_number": "00003",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi ini sudah dilakukan dengan status paid",
        "pan": "***************5255",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "reff_id": "2349679124",
        "status": "paid",
        "trace_number": "39",
        "transaction_date": "2026-01-05 15:07:41",
        "trx_id": "icacobabelanja_1qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `failed (QR unpaid)`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",

        "amount": "1",
        "approval": "N/A",
        "batch_number": "00003",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi Unpaid",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "074768602880",
        "reff_id": "N/A",
        "status": "unpaid",
        "trace_number": "41",
        "transaction_date": "2026-01-05 15:11:26",
        "trx_id": "icacobabelanja_2qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `failed (incorrect reference_number)`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362515",

        "action": "Check Status",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.30",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi tidak ditemukan",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "reff_id": "N/A",
        "status": "unpaid",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Transaction not found.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "N/A",
        "msg": "Trx dengan trx id icacobabelanja_3qris tidak ditemukan",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "Not Found",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.9. Refund QR

> **Name:** `Refund QRIS Transaction`
> **Format:** `JSON`
**Description:** Executing the Refund QR Menu in the BRI FMS Application via POSe Link. The Refund QR menu in the BRI FMS application can be triggered directly by an external application through the POSe Link interface. Upon request execution, the process will automatically be directed to the QRIS method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is Refund Qris |
| `reff_id` | String | yes | Transaction |
number
obtained from the BRI host
during QR payment. The
Reference ID is included on
the QR Pay receipt.
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the

POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The selected transaction type is QRIS. |
**Required Body Sample:**

```json
    {
        "action": "Refund Qris",
        "reff_id": "2378571437",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-07 10:07:28",
        "method": "qris"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is Refund Qris edc_address String no The

EDC
IP
address
obtained from the POSe
Link application.

| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The selected transaction type is QRIS. |
| `status` | String | no | Transaction |
| `status` |  | yes | information: ● Refund ● Unpaid trace_number int The transaction ID from the transaction receipt. |
| `reff_id` | String | no | Transaction ID used for the refund. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. 88 Version 4.12.0 |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. 89 Version |

| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362516",
        "action": "Refund Qris",
        "amount": "1",
        "approval": "N/A",

        "batch_number": "00002",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "10.84.205.227",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "refund berhasil",
        "pan": "***************5255",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "036251600518",
        "reff_id": "2378571437",
        "status": "refund",
        "trace_number": "18",
        "transaction_date": "2026-01-15 15:51:02",
        "trx_id": "alvincobabelanja_1qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `failed (incorrect reff_id)`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362516",
        "action": "Refund Qris",
        "amount": "N/A",

        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "10.84.205.227",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi tidak ditemukan",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "reff_id": "N/A",
        "status": "failed",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `failed (The transaction has been refunded.)`

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362516",
        "action": "Refund Qris",

        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "10.84.205.227",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi sudah direfund",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "reff_id": "N/A",
        "status": "paid",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "alvincobabelanja_1qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.10. Reprint Last Transaction

> **Name:** `Reprint Last.`
> **Format:** `JSON`

**Description:** Executing the Reprint Last Transaction Menu in the BRI FMS Application. The Reprint Last Transaction menu in the BRI FMS application allows reprinting the receipt of the most recent transaction processed by the EDC. This feature supports Purchase and Brizzi payment methods. After initiating the request, the user can select the desired payment method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is reprint last. |
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The selectable transaction |
types
are
Purchase
or
Brizzi.

**Required Body Sample:**

```json
    {
        "action" : "Reprint Last",

        "pos_address" : "172.0.0.1",
        "time_stamp" : "2023-01-24 18:01:10",
        "method" : "purchase"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is Reprint Last edc_address String no The

EDC
IP
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `status` | String | no | Information |
status
reprint,
success
| `and` |  | yes | failed. trace_number int The transaction ID from the transaction receipt. 95 Version 4.12.0 |
| `method` | String | no | The transaction types are Purchase or Brizzi. |
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.

| `batch_number` | String | no | r Transaction group from the trace_number. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.

| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362517",
        "action": "Reprint Last",
        "amount": "1",
        "approval": "787352",
        "batch_number": "00001",
        "card_category": "DEBIT BANK LAIN",
        "card_name": "NSICCS",
        "card_type": "CHIP",
        "edc_address": "172.20.10.2",
        "is_credit": "false",
        "is_off_us": "N/A",
        "method": "purchase",
        "msg": "Transaction Found",
        "pan": "4889 5030 **** 8049",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "000047000015",

        "status": "success",
        "trace_number": "000015",
        "transaction_date": "2023-11-07 05:12:59"
        "version_code": "42",
        "version_name": "4.11.1"
    }
```

**Error Response Code:** `Failed if data is not found.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362515",
        "action": "Reprint Last",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.5.104",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "N/A",
        "msg": "No Transaction Found",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",

        "trace_number": "N/A",
        "transaction_date": "N/A"
        "version_code": "42",
        "version_name": "4.11.1"
    }
```

### 4.11. Reprint Any Transaction

> **Name:** `Reprint Any`
> **Format:** `JSON`
**Description:** Executing the Reprint Any Transaction Menu in the BRI FMS Application. The Reprint Any Transaction menu in the BRI FMS application is used to reprint a transaction receipt based on the trace number printed on the original receipt. This feature supports Purchase and Brizzi payment methods. After the request is initiated, the user can select the desired payment method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is Reprint Any. |
| `trace_numbe` | int | yes | r The transaction ID from the transaction receipt. 100 Version 4.12.0 |
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The transaction types are Purchase or Brizzi. |
**Required Body Sample:**

```json
    {
        "action" : "Reprint Any",
        "trace_number": 11,
        "pos_address" : "172.0.0.1",
        "time_stamp" : "2023-01-24 18:01:10",
        "method" : "brizzi"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. trace_number int yes The transaction ID from the transaction receipt. 101 Version 4.12.0

| `action` | String | no | The transaction menu is Reprint Any. |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `status` | String | no | Information status: reprint, |
success
and
failed.
| `method` | String | no | The transaction types are Purchase or Brizzi. |
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. 102 Version 4.12.0 |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the 103 Version 4.12.0 transaction, where Yes means the card belongs to a n |
No means it is a BRI card.
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362515",
        "action": "Reprint Any",
        "amount": "1",
        "approval": "E488663A",
        "batch_number": "00001",
        "card_category": "N/A",
        "card_name": "N/A",

        "card_type": "Tap",
        "edc_address": "192.168.5.104",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "brizzi",
        "msg": "transaksi berhasil dicetak",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "000002",
        "status": "success",
        "trace_number": "2",
        "transaction_date": "2023-09-11 15:21:25"
        "version_code": "42",
        "version_name": "4.11.1"
    }
```

**Error Response Code:** `Failed if data is not found.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362515",
        "action": "Reprint Any",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",

        "edc_address": "192.168.5.104",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "N/A",
        "msg": "Transaction Not Found",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "N/A",
        "transaction_date": "N/A"
        "version_code": "42",
        "version_name": "4.11.1"
    }
```

### 4.12. Settlement

> **Name:** `Settlement`
> **Format:** `JSON`
**Description:** Executing the Settlement Menu in the BRI FMS Application. The Settlement menu in the BRI FMS application is used to close and lock a batch of transactions previously processed by the EDC. This feature supports Purchase and Brizzi payment methods. After initiating the request, the user can select the desired payment method. 106 Version 4.12.0

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is Settlement |
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The transaction types are Purchase or Brizzi. |
**Required Body Sample:**

```json
    {
        "action" : "Settlement",
        "pos_address" : "172.0.0.1",
        "time_stamp" : "2023-01-24 18:01:10",
        "method" : "purchase"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is Settlement edc_address String no The

EDC
IP
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `status` | String | no | Information status: reprint, |
success
and
failed.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.

| `batch_number` | String | no | r Transaction group from the trace_number. |
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362515",
        "action": "Settlement",
        "batch_number": "000003",
        "edc_address": "192.168.5.104",
        "msg": "Settlement Success",
        "pos_address": "172.0.0.1",
        "status": "success",
        "transaction_date": "2023-09-11  14:25:36"
        "version_code": "42",
        "version_name": "4.11.1"
    }
```

**Error Response Code:** `Failed if data is not found.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362515",

        "action": "Settlement",
        "batch_number": "N/A",
        "edc_address": "192.168.88.158",
        "msg": "Tidak ada data",
        "pos_address": "172.0.0.1",
        "status": "failed",
        "transaction_date": "N/A"
        "version_code": "42",
        "version_name": "4.11.1"
    }
```

### 4.13. Check Transaction Status

> **Name:** `Check Transaction`
> **Format:** `JSON`
**Description:** Executing the Check Transaction Status Menu in the BRI FMS Application. The Check Transaction Status menu in the BRI FMS application is used to verify whether a transaction was successful or not. This feature supports Purchase and Brizzi payment methods. After the request is initiated, the user can select the desired payment method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is Check Transaction Status. 110 Version 4.12.0 |
| `pos_address` | String | no | The IP address of the external application. |
| `trx_id` | Alphanumeric | no | Requested transaction ID. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS

**Required Body Sample:**

```json
    {
        "action": "Check Trx",
        "trx_id": "nazar1",
        "pos_address": "172.0.0.1",
        "time_stamp": "2023-01-29 18:01:10"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is Settlement 111 Version 4.12.0

| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `status` | String | no | Reprint |
status
information: Success and
Failed.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362516",
        "action": "Check Trx",
        "amount": "1",
        "approval": "R17454",
        "batch_number": "00001",
        "card_category": "MASTERCARD BRI",
        "card_name": "MASTERCARD",
        "card_type": "CHIP",
        "edc_address": "192.168.2.130",
        "is_credit": "N/A",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaksi ini sudah dilakukan dengan status paid",
        "pan": "5188 5621 **** 9808",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "000011000002",
        "status": "paid",
        "trace_number": "000002",
        "transaction_date": "2025-03-11 11:04:56",
        "trx_id": "nazar1"
        "version_code": "42",
        "version_name": "4.11.1"
    }
```

**Error Response Code:** `Failed if data is not found.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362516",
        "action": "Check Trx",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.2.130",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "N/A",
        "msg": "Trx dengan trx id 7djdsaa21sbfs23jsdawev91 tidak ditemukan",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "Not Found",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A"
        "version_code": "42",
        "version_name": "4.11.1"
    }
```

### 4.14. Check Transaction Status QRIS Alipay

Nama
Check Transaction Status QRIS Alipay
> **Format:** `JSON`
Deskripsi
Use the Check Status Transaction menu in the FMS BRI application to
verify whether a transaction is successful or failed for the QRIS Alipay
payment method.
**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Mandatory Keterangan
| `action` | String | no | Transaction menu. |
| `reference_number` | String | no | Reference number. |
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | Payment method used. 115 Version 4.12.0 |
**Required Body Sample:**

```json
    {
        "action": "Check Status",
        "reference_number": "036251600518",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-07 10:07:28",
        "method": "qris"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
Keterangan
| `pos_address` | String | no | The IP address of the external application. |
| `action` | String | no | The transaction menu is Check Status |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The selected transaction type is QRIS. 116 Version 4.12.0 |
| `status` | String | no | Transaction |
| `status` |  | yes | information: ● Paid ● Unpaid ● Refund trace_number int The transaction ID from the transaction receipt. |
| `reff_id` | String | no | Transaction ID used for the refund. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.

| `amount` | String | no | The transaction amount sent from the POS. |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |

| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362516",
        "action": "Check Status",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "00002",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "10.84.205.227",
        "is_credit": "N/A",
        "is_off_us": "N/A",

        "method": "QRIS",
        "msg": "transaksi berhasil",
        "pan": "***************5255",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "036251600518",
        "reff_id": "2378571437",
        "status": "paid",
        "trace_number": "18",
        "transaction_date": "2026-01-15 15:51:02",
        "trx_id": "alvincobabelanja_1qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `error failed QRIS unpaid`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362516",
        "action": "Check Status",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "00002",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "10.84.205.227",
        "is_credit": "N/A",

        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi Unpaid",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "036251600520",
        "reff_id": "N/A",
        "status": "unpaid",
        "trace_number": "21",
        "transaction_date": "2026-01-15 16:27:05",
        "trx_id": "alvincobabelanja_2qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Failed:  incorrect reference number.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10362516",
        "action": "Check Status",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "10.84.205.227",

        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi tidak ditemukan",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "reff_id": "N/A",
        "status": "unpaid",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.15. Check Batch Transaction

Nama
Check Batch Transaction
> **Format:** `JSON`
Deskripsi
Use the Check Status Batch Transaction feature in the FMS BRI
application to verify the success or failure status of transactions in
batch. The batch transaction status check is available for the Purchase
Payment method.
**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|

Parameter
Data
Type
Mandatory Keterangan
| `action` | String | no | Transaction menu: check transaction. |
| `transactions` |  | no | Array Used to contain a list of |
transactions
to
be
processed
or
checked
within a single request. In
version 4.12.0, a maximum
of 5 requests is supported.
| `id` | Boolean | no | The transaction ID to be checked. isCheckAllTrx Used as a marker for the scope of the check: - True, Perform a full |
update
or
check
starting from the initial
installation
of
the
application.
- False, Perform the check only for the current settlement period. pos_address String no IP address of the external application. 123 Version 4.12.0

time_stamp
Datetime no
Date and time when the
request is sent from the
POS. Time stamp format:
yyyy-mm-dd HH:MM:SS

**Required Body Sample:**

```json
    {
        "action": "Check Batch Trx",
        "transactions": [
            {
                "id": "icacobabelanja_1cardver",
                "isCheckAllTrx": false
            },
            {
                "id": "icacobabelanja_1salecomp",
                "isCheckAllTrx": false
            }
```

],
"pos_address": "{{ecr_pos_address}}",
"time_stamp": "{{current_timestamp}}"
}
**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
Keterangan
| `pos_address` | String | yes | The IP address of the external application. 124 Version 4.12.0 trace_number int The transaction ID from |
the transaction receipt.
| `action` | String | no | The transaction menu is “Sale”. |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `trx_id` | Alphanumeric | yes | The transaction ID is |
obtained
from
the
external application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The |
transaction
types
available are: purchase,
brizzi, and QRIS.
| `status` | String | no | Transaction |
status
information:
Success for purchase and
brizzi transactions.
Paid
for
QRIS
transactions.

| `reff_id` | String | no | The transaction ID used for refunds in the QRIS method. |
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this is used to check the t |
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.

| `batch_number` | String | no | r Transaction group from the trace_number. |
| `card_name` | String | no | Transaction card type: NSICCS, Visa, Mastercard, or JCB. |
| `pan` | String | no | Masked |
card
| `pan` |  | no | used in the transaction. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. |
| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |

| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

[
```json
    {
            "acq_mid": "000001999115921",
            "acq_tid": "10747686",
            "action": "Check Batch Trx",
            "amount": "1",
            "approval": "503806",
            "batch_number": "00004",
            "card_category": "VISA BRI",
            "card_name": "VISA",
            "card_type": "CHIP",
            "edc_address": "192.168.10.145",
            "is_credit": "true",

            "is_off_us": "false",
            "method": "purchase",
            "msg": "Transaksi ini sudah dilakukan dengan status paid",
            "pan": "4365 0299 **** 1702",
            "periode": "N/A",
            "plan": "N/A",
            "pos_address": "172.0.0.1",
            "rc": "00",
            "reference_number": "600604434915",
            "reff_id": "N/A",
            "status": "success",
            "trace_number": "000073",
            "transaction_date": "2026-01-06 11:04:31",
            "trx_id": "icacobabelanja_2sale",
            "version_code": "43",
            "version_name": "4.12.0"
        },
        {
            "acq_mid": "000001999115921",
            "acq_tid": "10747686",
            "action": "Check Batch Trx",
            "amount": "1",
            "approval": "240402",
            "batch_number": "00004",
            "card_category": "MASTER CARD",
            "card_name": "MASTERCARD",
            "card_type": "CHIP",
            "edc_address": "192.168.10.145",
            "is_credit": "true",
            "is_off_us": "false",

            "method": "purchase",
            "msg": "Transaksi ini sudah dilakukan dengan status paid",
            "pan": "5188 5621 **** 9709",
            "periode": "N/A",
            "plan": "N/A",
            "pos_address": "172.0.0.1",
            "rc": "00",
            "reference_number": "600602381346",
            "reff_id": "N/A",
            "status": "success",
            "trace_number": "000060",
            "transaction_date": "2026-01-06 09:37:08",
            "trx_id": "icacobabelanja_1salecomp",
            "version_code": "43",
            "version_name": "4.12.0"
        }
```

]
**Error Response Code:** `failed jika data tidak ditemukan`

**Respond Sample (Error):**

[
```json
    {
            "acq_mid": "N/A",
            "acq_tid": "N/A",
            "action": "Check Batch Trx",
            "amount": "N/A",
            "approval": "N/A",
            "batch_number": "N/A",
            "card_category": "N/A",
            "card_name": "N/A",
            "card_type": "N/A",

            "edc_address": "192.168.10.145",
            "is_credit": "N/A",
            "is_off_us": "N/A",
            "method": "N/A",
            "msg": "Trx dengan trx id icacobabelanja_21sale tidak ditemukan",
            "pan": "N/A",
            "periode": "N/A",
            "plan": "N/A",
            "pos_address": "172.0.0.1",
            "rc": "N/A",
            "reference_number": "N/A",
            "reff_id": "N/A",
            "status": "Not Found",
            "trace_number": "N/A",
            "transaction_date": "N/A",
            "trx_id": "N/A",
            "version_code": "43",
            "version_name": "4.12.0"
        },
        {
            "acq_mid": "N/A",
            "acq_tid": "N/A",
            "action": "Check Batch Trx",
            "amount": "N/A",
            "approval": "N/A",
            "batch_number": "N/A",
            "card_category": "N/A",
            "card_name": "N/A",
            "card_type": "N/A",
            "edc_address": "192.168.10.145",

            "is_credit": "N/A",
            "is_off_us": "N/A",
            "method": "N/A",
            "msg": "Trx dengan trx id icacobabelanja_22sale tidak ditemukan",
            "pan": "N/A",
            "periode": "N/A",
            "plan": "N/A",
            "pos_address": "172.0.0.1",
            "rc": "N/A",
            "reference_number": "N/A",
            "reff_id": "N/A",
            "status": "Not Found",
            "trace_number": "N/A",
            "transaction_date": "N/A",
            "trx_id": "N/A",
            "version_code": "43",
            "version_name": "4.12.0"
        }
```

]

### 4.16. Check Transaction Void Purchase

> **Name:** `Void Purchase`
> **Format:** `JSON`
**Description:** Executing the Void Purchase Transaction Status Check in the BRI FMS Application. The Void Purchase Transaction Status Check feature in the BRI FMS application is used to verify whether a voided Purchase transaction was successfully processed or not. This feature is available exclusively for the Purchase payment method. 132 Version 4.12.0

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is Void Purchase. |
| `pos_address` | String | no | The IP address of the external application. |
| `trx_id` | Alphanumeric | no | Requested transaction ID. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS

**Required Body Sample:**

```json
    {
        "action": "Check Trx",
        "trx_id": "icacobabelanja_1salecomp",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-07 11:20:02"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is Settlement edc_address String no The

EDC
IP
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `status` | String | no | Reprint |
status
information: Success and
Failed.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.

| `batch_number` | String | no | r Transaction group from the trace_number. |
| `amount` | String | no | Transaction amount. |
| `approval` | String | no | Approval code. card_category String Card category. |
| `card_name` | String | no | Card name. |
| `card_type` | String | no | Card type. |
| `is_credit` | String | no | Validate that the card used is a credit card. |
| `is_off_us` | String | no | Card type: On-us |
or
Off-us.
| `method` | String | no | Payment method. |
| `pan` | String | no | Card PAN number. |
| `periode` | String | no | Installment period. |
| `plan` | String | no | Installment plan. |
| `rc` | String | no | response code. |
| `reference_number` | String | no | Reference number. trace_number String trace number. 135 Version 4.12.0 |
| `trx_id` | Alphanumeric | no | transaction id. |
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "1",
        "approval": "240402",
        "batch_number": "00004",
        "card_category": "MASTER CARD",
        "card_name": "MASTERCARD",
        "card_type": "CHIP",
        "edc_address": "192.168.10.145",
        "is_credit": "true",
        "is_off_us": "false",
        "method": "purchase",
        "msg": "Transaksi ini sudah dilakukan dengan status paid",
        "pan": "5188 5621 **** 9709",
        "periode": "N/A",
        "plan": "N/A",

        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "600602381346",
        "status": "paid",
        "trace_number": "000060",
        "transaction_date": "2026-01-06 09:37:08",
        "trx_id": "icacobabelanja_1salecomp",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Failed if data is not found.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "N/A",
        "msg": "Trx dengan trx id icacobabelanja_1sale tidak ditemukan",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",

        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "Not Found",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.17. Check Transaction Void Brizzi

> **Name:** `Void Brizzi`
> **Format:** `JSON`
**Description:** Executing the Void Brizzi Transaction Status Check Feature in the BRI FMS Application. The Void Brizzi Transaction Status Check feature in the BRI FMS application is used to verify whether a voided Brizzi transaction was successful or not. This feature is available only for the Brizzi payment method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is Void Brizzi. 138 Version 4.12.0 |
| `pos_address` | String | no | The IP address of the external application. |
| `trx_id` | Alphanumeric | no | Requested transaction ID. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS

**Required Body Sample:**

```json
    {
        "action": "Check Trx",
        "trx_id": "icacobabelanja_1salecomp",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-07 11:20:02"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is Settlement 139 Version 4.12.0

| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `status` | String | no | Reprint |
status
information: Success and
Failed.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `amount` | String | no | Transaction amount. |
| `approval` | String | no | Approval code. card_category String Card category. |
| `card_name` | String | no | Card name. |
| `card_type` | String | no | Card type. 140 Version 4.12.0 |
| `is_credit` | String | no | Validate that the card used is a credit card. |
| `is_off_us` | String | no | Card type: On-us |
or
Off-us.
| `method` | String | no | Payment method. |
| `pan` | String | no | Card PAN number. |
| `periode` | String | no | Installment period. |
| `plan` | String | no | Installment plan. |
| `rc` | String | no | response code |
| `reference_number` | String | no | Reference number. trace_number String trace number. |
| `trx_id` | Alphanumeric | no | transaction id. |
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "1",
        "approval": "BEFA2ED1",
        "batch_number": "00002",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "Tap",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "brizzi",
        "msg": "Transaksi ini sudah dilakukan dengan status paid",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "000096",
        "status": "paid",
        "trace_number": "96",
        "transaction_date": "2026-01-07 11:18:50",
        "trx_id": "icacobabelanja_1brizzi",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Failed if data is not found.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "N/A",
        "msg": "Trx dengan trx id icacobabelanja_2brizzi tidak ditemukan",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "Not Found",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.18. Check Transaction QRIS Refund

> **Name:** `QRIS Refund`
> **Format:** `JSON`
**Description:** Executing the QRIS Refund Transaction Check Feature in the BRI FMS Application. The QRIS Refund Transaction Check feature in the BRI FMS application is used for checking refund transactions for QR payment methods. This feature is applicable only for QR payment methods.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is cek status transaksi |
| `pos_address` | String | no | The IP address of the external application. |
| `trx_id` | Alphanumeric | no | Requested transaction ID. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS

**Required Body Sample:**

```json
    {
        "action": "Check Trx",
        "trx_id": "icacobabelanja_1salecomp",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-07 11:20:02"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is Settlement edc_address String no The

EDC
IP
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `status` | String | no | Reprint |
status
information: Success and
Failed.

| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `amount` | String | no | Transaction amount. |
| `approval` | String | no | Approval code. card_category String Card category. |
| `card_name` | String | no | Card name. |
| `card_type` | String | no | Card type. |
| `is_credit` | String | no | Validate that the card used is a credit card. |
| `is_off_us` | String | no | Card type: On-us |
or
Off-us.
| `method` | String | no | Payment method. |
| `pan` | String | no | Card PAN number. |
| `periode` | String | no | Installment period. 146 Version 4.12.0 |
| `plan` | String | no | Installment plan. |
| `rc` | String | no | response code. |
| `reference_number` | String | no | Reference number. trace_number String trace number. |
| `trx_id` | Alphanumeric | no | transaction id. |
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "00003",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.145",

        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi ini sudah dilakukan dengan status paid",
        "pan": "***************5255",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "reff_id": "2349679124",
        "status": "paid",
        "trace_number": "39",
        "transaction_date": "2026-01-05 15:07:41",
        "trx_id": "icacobabelanja_1qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Failed if data is not found.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",

        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "N/A",
        "msg": "Trx dengan trx id icacobabelanja_3qris tidak ditemukan",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "Not Found",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.19. QRIS Alipay

Nama
QRIS Alipay
> **Format:** `JSON`
Deskripsi
Execute the transaction feature using the QRIS scan via Alipay.
**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Mandatory Keterangan

| `action` | String | no | The transaction menu is Check Status |
| `reference_number` | String | yes | Transaction |
number
obtained from BRI host
during QR generation. The
reference
number
is
included on the QR receipt.
| `pos_address` | String | no | The IP address of the external application. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The selected transaction type is QRIS. |
| `action` | String | no | The transaction menu is Check Status |
**Required Body Sample:**

```json
    {
        "action": "Sale",
        "trx_id": "icacobabelanja_2qris",
        "amount": "1",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-06 09:25:08",
        "method": "qris"

    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
Keterangan
| `pos_address` | String | yes | The IP address of the external application. trace_number int The transaction ID from the transaction receipt. |
| `action` | String | no | The transaction menu is “Sale”. |
| `edc_address` | String | no | The EDC IP |
address
obtained from the POSe
Link application.
| `trx_id` | Alphanumeric | yes | The transaction ID is |
obtained
from
the
external application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `method` | String | no | The |
transaction
types
available are: purchase,
brizzi, and QRIS.

| `status` | String | no | Transaction |
status
information:
Success for purchase and
brizzi transactions.
Paid
for
QRIS
transactions.
| `reff_id` | String | no | The transaction ID used for refunds in the QRIS method. |
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `card_type` | String | no | The card type involved in the transaction. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `amount` | String | no | The transaction amount sent from the POS. |
| `reference_number` | String | no | The transaction number obtained from the BRI host during a transaction. For QR transactions, this 152 Version 4.12.0 is  |
transaction status.
| `approval` | String | no | The transaction approval code. |
| `rc` | String | no | Transaction |
status
response code.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `card_name` | String | no | Transaction card type: NSICCS, Visa, Mastercard, or JCB. |
| `pan` | String | no | Masked |
card
| `pan` |  | no | used in the transaction. card_category String The card category used in |
the
transaction,
for
example:
Debit,
Visa,
Mastercard, JCB.
| `is_credit` | String | no | Card type classification used in the transaction: - Yes indicates a Credit card. - No indicates a Debit card. 153 Versio |

| `is_off_us` | String | no | The bank classification for the card used in the transaction, where Yes means the card belongs to a non-BRI bank, and No |
| `periode` | String | no | The installment period |
selected
during
the
installment transaction.
| `plan` | String | no | Installment plan selected |
during
an
installment
transaction.
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",
        "approval": "N/A",

        "batch_number": "00003",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "transaksi berhasil",
        "pan": "***************5255",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "000937677230",
        "reff_id": "2349708316",
        "status": "paid",
        "trace_number": "47",
        "transaction_date": "2026-01-05 15:17:53",
        "trx_id": "icacobabelanja_2qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Transaction unpaid.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",

        "approval": "N/A",
        "batch_number": "00003",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi Unpaid",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "21",
        "reference_number": "074768600203",
        "reff_id": "N/A",
        "status": "unpaid",
        "trace_number": "46",
        "transaction_date": "2026-01-05 15:17:09",
        "trx_id": "icacobabelanja_2qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Transaction cancelled.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",

        "amount": "1",
        "approval": "N/A",
        "batch_number": "00003",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi Failed",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "074768600202",
        "reff_id": "N/A",
        "status": "failed",
        "trace_number": "45",
        "transaction_date": "2026-01-05 15:16:09",
        "trx_id": "icacobabelanja_2qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `The transaction is performed using the same trx_id.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",

        "action": "Sale",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "00003",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "SCAN",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS",
        "msg": "Transaksi telah berhasil dilakukan dengan trxID ini",
        "pan": "***************5255",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "000937677230",
        "reff_id": "2349708316",
        "status": "success",
        "trace_number": "47",
        "transaction_date": "2026-01-05 15:17:53",
        "trx_id": "icacobabelanja_2qris",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.20. QRIS TAP

> **Name:** `QRIS TAP`

> **Format:** `JSON`
**Description:** Executing a Transaction Using the QRIS TAP Method. This feature enables performing a transaction using the QRIS TAP payment method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `amount` | int | yes | The transaction amount is automatically displayed on |
the
EDC screen during
payment.
| `action` | String | no | The transaction menu is QRIS TAP. |
| `pos_address` | String | no | The IP address of the external application. |
| `trx_id` | Alphanumeric | no | Requested transaction ID. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS
| `method` | String | no | The available transaction |
types
include
three

options: purchase, brizzi,
and QRIS.

**Required Body Sample:**

```json
    {
        "action": "Sale",
        "trx_id": "icacobabelanja_1qristap",
        "amount": "1",
        "pos_address": "172.0.0.1",
        "time_stamp": "2026-01-06 09:25:08",
        "method": "qris_tap"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is QRIS TAP. edc_address String no The

EDC
IP
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.

| `status` | String | no | Reprint |
status
information: Success and
Failed.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.
| `batch_number` | String | no | r Transaction group from the trace_number. |
| `amount` | String | no | Transaction amount. |
| `approval` | String | no | Approval code. card_category String Card category. |
| `card_name` | String | no | Card name. |
| `card_type` | String | no | Card type. |
| `is_credit` | String | no | Validate that the card used is a credit card. |
| `is_off_us` | String | no | Card type: On-us |
or
Off-us.
| `method` | String | no | Payment method. 161 Version 4.12.0 |
| `pan` | String | no | Card PAN number. |
| `periode` | String | no | Installment period. |
| `plan` | String | no | Installment plan. |
| `rc` | String | no | response code. |
| `reference_number` | String | no | Reference number. |
| `reff_id` | String | no | Reff number. trace_number String trace number. |
| `trx_id` | Alphanumeric | no | transaction id. |
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",
        "approval": "N/A",

        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "TAP",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS TAP",
        "msg": "transaksi berhasil",
        "pan": "***************5255",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "00",
        "reference_number": "074768600003",
        "reff_id": "2349733427",
        "status": "paid",
        "trace_number": "000050",
        "transaction_date": "2026-01-05 15:26:29",
        "trx_id": "icacobabelanja_1qristap",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Card swiped too quickly > connection lost.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "N/A",

        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "N/A",
        "msg": "Koneksi perangkat terputus, silahkan coba lagi",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "icacobabelanja_1qristap",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Transaction cancelled.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "N/A",

        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS TAP",
        "msg": "Transaksi dibatalkan",
        "pan": "N/A",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "failed",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "icacobabelanja_1qristap",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Transaction using the same transaction ID.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Sale",
        "amount": "1",

        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "TAP",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS TAP",
        "msg": "Transaksi telah berhasil dilakukan dengan trxID ini",
        "pan": "⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫5255",
        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "074768600003",
        "reff_id": "2349733427",
        "status": "success",
        "trace_number": "000050",
        "transaction_date": "2026-01-05 15:26:29",
        "trx_id": "icacobabelanja_1qristap",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.21. QRIS TAP Refund

> **Name:** `QRIS TAP Refund`
> **Format:** `JSON`

**Description:** Executing the Refund Feature for Transactions Using the QRIS TAP Method. This feature enables processing a refund for transactions conducted via the QRIS TAP payment method.

**Required Body Parameters:**

**Required Body Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
| `action` | String | no | The transaction menu is QRIS TAP Refund. |
| `pos_address` | String | no | The IP address of the external application. |
| `trx_id` | Alphanumeric | no | Requested transaction ID. |
time_stamp
Datetime no
The date and time the
request is sent from the
POS. Timestamp format:
yyyy-mm-dd HH:MM:SS

**Required Body Sample:**

```json
    {
        "action" : "Refund Qris Tap",
        "reff_id" : "1754207085",
        "pos_address" : "172.0.0.1",
        "time_stamp" : "{{ecr_timestamp}}",
        "method" : "qris"
    }
```

**Respond Parameters:**

**Respond Parameters:**

| Parameter | Data Type | Mandatory | Description |
|-----------|-----------|-----------|-------------|
Data Type Mandatory
**Description:** pos_address String no The IP address of the external application. action String no The transaction menu is Settlement edc_address String no The

EDC
IP
address
obtained from the POSe
Link application.
| `msg` | String | no | Displays |
transaction
status information on the
EDC.
| `status` | String | no | Reprint |
status
information: Success and
Failed.
| `acq_tid` | String | no | The terminal ID of the EDC merchant. |
| `acq_mid` | String | no | The merchant ID of the EDC merchant. |
| `transaction_date` | String | no | The |
transaction
time
recorded on the EDC.

| `batch_number` | String | no | r Transaction group from the trace_number. |
| `amount` | String | no | Transaction amount. |
| `approval` | String | no | Approval code. card_category String Card category. |
| `card_name` | String | no | Card name. |
| `card_type` | String | no | Card type. |
| `is_credit` | String | no | Validate that the card used is a credit card. |
| `is_off_us` | String | no | Card type: On-us |
or
Off-us.
| `method` | String | no | Payment method. |
| `pan` | String | no | Card PAN number. |
| `periode` | String | no | Installment period. |
| `plan` | String | no | Installment plan. |
| `rc` | String | no | response code. |
| `reference_number` | String | no | Reference number. |
| `reff_id` | String | no | Reff number. 169 Version 4.12.0 trace_number String trace number. |
| `trx_id` | Alphanumeric | no | transaction id. |
| `version_code` | String | no | Application version code currently in use. version_name String Application |
version
in
use.

**Success Response Code:** `success`

**Respond Sample (Success):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "1",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "TAP",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "QRIS TAP",
        "msg": "Transaksi ini sudah dilakukan dengan status cancel",
        "pan": "⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫5255",
        "periode": "N/A",

        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "074768600004",
        "reff_id": "2351956488",
        "status": "cancel",
        "trace_number": "000075",
        "transaction_date": "2026-01-06 12:00:07",
        "trx_id": "icacobabelanja_2qristap",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

**Error Response Code:** `Refund of a transaction that has already been refunded.`

**Respond Sample (Error):**

```json
    {
        "acq_mid": "000001999115921",
        "acq_tid": "10747686",
        "action": "Check Trx",
        "amount": "N/A",
        "approval": "N/A",
        "batch_number": "N/A",
        "card_category": "N/A",
        "card_name": "N/A",
        "card_type": "N/A",
        "edc_address": "192.168.10.145",
        "is_credit": "N/A",
        "is_off_us": "N/A",
        "method": "N/A",
        "msg": "Trx dengan trx id icacobabelanja_3qristap tidak ditemukan",
        "pan": "N/A",

        "periode": "N/A",
        "plan": "N/A",
        "pos_address": "172.0.0.1",
        "rc": "N/A",
        "reference_number": "N/A",
        "status": "Not Found",
        "trace_number": "N/A",
        "transaction_date": "N/A",
        "trx_id": "N/A",
        "version_code": "43",
        "version_name": "4.12.0"
    }
```

### 4.22. ACK

> **Name:** `ACK`
> **Format:** `JSON`
**Description:** Executing the Feature for Sending Notes to Merchant During POS Transactions. This feature allows the EDC system to send a text note to the merchant while the POS system is processing a transaction.

**Required Body Parameters:**

-
**Required Body Sample:**

-
**Respond Parameters:**

-

**Success Response Code:** `-`

**Respond Sample (Success):**

Connection via WiFi:

Connection via Bluetooth:

Connection via USB:
**Error Response Code:** `-`

**Respond Sample (Error):**

-

### 4.23. Information “EDC is Busy”

> **Name:** `ACK`
> **Format:** `JSON`
**Description:** EDC Busy and Invalid Timestamp Handling in POSe. When two POS systems connect to the EDC simultaneously, the POSe will respond with "EDC is busy" to one of the requests, and the connection will be immediately terminated. Additionally, if there are two transactions and 173 Version 4.12.0

the second transaction’s timestamp is earlier than the first, POSe will
disconnect with the message "Invalid timestamp."
**Required Body Parameters:**

-
**Required Body Sample:**

-
**Respond Parameters:**

-
**Success Response Code:** `-`

**Respond Sample (Success):**

**Error Response Code:** `-`

**Respond Sample (Error):**

-
