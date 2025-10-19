# إعداد حسابات Hedera للمنصة

## متطلبات الحسابات

### 1. حساب المزارع (Farmer Account)
يحتاج المزارع إلى:
- **Account ID**: مثل `0.0.xxxxx`
- **Private Key**: للتوقيع على المعاملات
- **Token**: يجب إنشاء Token للمزرعة أولاً قبل البيع

#### خطوات المزارع:
1. إنشاء حساب على Hedera Testnet
2. ربط المحفظة في صفحة "ربط المحفظة"
3. إنشاء مزرعة - سيتم تلقائياً إنشاء Token وmint الكمية المطلوبة
4. انتظار موافقة الإدارة على المزرعة

### 2. حساب المستثمر (Investor Account)
يحتاج المستثمر إلى:
- **Account ID**: مثل `0.0.xxxxx`
- **Private Key**: للتوقيع على عمليات التحويل
- **Associate Token**: يجب أن يكون الحساب مرتبطاً (associated) بالـ Token قبل استلامه

#### خطوات المستثمر:
1. إنشاء حساب على Hedera Testnet
2. ربط المحفظة في صفحة "ربط المحفظة"
3. Associate مع Token المزرعة (يمكن عمله من HashScan أو من الكود)
4. شراء الكمية المطلوبة

## كيفية الحصول على حساب Hedera Testnet

### الطريقة 1: Hedera Portal
1. اذهب إلى: https://portal.hedera.com/
2. قم بإنشاء حساب جديد
3. اختر Testnet
4. احصل على Account ID و Private Key

### الطريقة 2: HashScan Testnet Faucet
1. اذهب إلى: https://portal.hedera.com/register
2. أنشئ حساب جديد
3. احصل على HBAR مجاني للاختبار

## عملية التحويل (Transfer Process)

عندما يشتري المستثمر من مزرعة:
1. يتم التحقق من أن المستثمر لديه محفظة متصلة
2. يتم التحقق من أن المزارع لديه محفظة متصلة (محفوظة في قاعدة البيانات)
3. يتم تحويل Tokens من حساب المستثمر إلى حساب المزارع باستخدام `transferTokens`
4. يستخدم `token_id` الخاص بالمزرعة (تم إنشاؤه عند إضافة المزرعة)
5. يتم حفظ `transaction_id` في قاعدة البيانات للمراجعة

## Token Association (مهم جداً!)

قبل أن يستطيع أي حساب استقبال Token معين، يجب أن يكون مرتبطاً (associated) به.

### كيفية Associate من HashScan:
1. اذهب إلى حساب المستثمر على HashScan
2. اختر "Associate Token"
3. أدخل Token ID من المزرعة
4. وقع على المعاملة

### كيفية Associate برمجياً:
```typescript
import { TokenAssociateTransaction } from "@hashgraph/sdk";

await new TokenAssociateTransaction()
  .setAccountId(investorAccountId)
  .setTokenIds([tokenId])
  .freezeWith(client)
  .sign(investorPrivateKey)
  .execute(client);
```

## الأمان (Security)

⚠️ **تحذير هام**: Private Keys حساسة جداً!
- لا تشارك Private Key أبداً
- في الإنتاج، استخدم Hedera Wallet Solutions بدلاً من تخزين Private Keys
- حالياً نحفظ Private Key في localStorage للتطوير فقط

## للإنتاج (Production)

يُنصح باستخدام:
- **HashPack Wallet**: محفظة متصفح
- **Blade Wallet**: محفظة متصفح أخرى
- **WalletConnect**: للربط الآمن

## روابط مفيدة

- Hedera Portal: https://portal.hedera.com/
- HashScan Testnet: https://hashscan.io/testnet
- Hedera Docs: https://docs.hedera.com/
- SDK Docs: https://docs.hedera.com/hedera/sdks-and-apis/sdks
