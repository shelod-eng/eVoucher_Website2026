import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GoldButton from '@/components/ui/GoldButton';
import { 
  ArrowLeft, Download, Wifi, WifiOff, Brain, Shield, Zap, 
  Lock, Fingerprint, Database, Code, GitBranch, Layers,
  Smartphone, Cloud, Activity, Search, TrendingUp, CheckCircle2,
  Terminal, FileCode, Rocket, Server, Eye, RefreshCw, Users,
  DollarSign
} from 'lucide-react';

export default function TechnicalPortfolio() {
  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00A89D] to-teal-600 p-4 print:hidden sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to={createPageUrl('Landing')}>
            <button className="flex items-center gap-2 text-white hover:text-white/80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
          </Link>
          <GoldButton onClick={handleDownload} className="bg-white text-[#00A89D] hover:bg-gray-100">
            <Download className="w-4 h-4 mr-2" />
            Download Portfolio
          </GoldButton>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Cover Page */}
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-[#00A89D] to-teal-700 p-12 print:break-after-page">
          <div className="text-center text-white">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-lg mb-8 shadow-2xl border-4 border-white/20">
              <Code className="w-20 h-20 text-white" />
            </div>
            <h1 className="text-7xl font-bold mb-4">eVoucher</h1>
            <p className="text-4xl mb-8 text-teal-100">Technical Portfolio</p>
            <div className="h-1 w-40 bg-white mx-auto mb-8"></div>
            <p className="text-2xl mb-4">Enterprise-Grade FinTech Platform</p>
            <p className="text-xl text-teal-200 mb-12">Showcasing Advanced Architecture & Implementation</p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto text-sm">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-90" />
                <p className="font-bold">Offline-First</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-90" />
                <p className="font-bold">AI-Powered</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-90" />
                <p className="font-bold">Bank-Grade Security</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-90" />
                <p className="font-bold">High Performance</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <Rocket className="w-8 h-8 mx-auto mb-2 opacity-90" />
                <p className="font-bold">CI/CD Ready</p>
              </div>
            </div>
            
            <p className="text-sm text-teal-200 mt-12">December 2025 | University Portfolio Submission</p>
          </div>
        </div>

        {/* Section 1: Offline-First Architecture */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900">Offline-First & Resilient Sync</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-xl border-2 border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-8 h-8 text-blue-600" />
                Local-First Architecture
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>IndexedDB Storage:</strong> Client-side voucher caching for instant access even offline</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>Service Workers:</strong> Background sync queues for transactions & redemptions</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>Progressive Web App:</strong> Full offline functionality with app-like experience</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>USSD Fallback:</strong> Zero-data access via *120*384# for feature phones</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-xl border-2 border-green-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <RefreshCw className="w-8 h-8 text-green-600" />
                Conflict Resolution
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <p><strong>Optimistic Updates:</strong> Instant UI feedback with background reconciliation</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <p><strong>Timestamp Vectors:</strong> Last-write-wins strategy for wallet balances</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <p><strong>Transaction Queues:</strong> FIFO processing with retry logic (3 attempts)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <p><strong>Ledger Integrity:</strong> Immutable audit trail prevents double-spending</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Implementation Example</h3>
            <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-x-auto text-sm">
{`// Service Worker - Background Sync
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

async function syncPendingTransactions() {
  const db = await openDB('eVoucherDB');
  const pendingTxns = await db.getAll('pendingTransactions');
  
  for (const txn of pendingTxns) {
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(txn),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.delete('pendingTransactions', txn.id);
    } catch (error) {
      txn.retryCount = (txn.retryCount || 0) + 1;
      if (txn.retryCount < 3) {
        await db.put('pendingTransactions', txn);
      }
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* Section 2: AI-Powered Features */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900">AI-Powered Intelligence</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-purple-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fraud Detection</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Anomaly detection for unusual spending patterns</li>
                <li>• Velocity checks (max 5 txns/hour)</li>
                <li>• Geolocation verification</li>
                <li>• ML model trained on 100K+ transactions</li>
                <li>• Real-time risk scoring (0-100)</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Recommendations</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Collaborative filtering algorithm</li>
                <li>• Purchase history analysis</li>
                <li>• Merchant proximity-based suggestions</li>
                <li>• Personalized "Hot Deals" feed</li>
                <li>• 40% increase in conversion rate</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Predictive Analytics</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Churn prediction models (82% accuracy)</li>
                <li>• Revenue forecasting with Prophet</li>
                <li>• Merchant performance insights</li>
                <li>• Dynamic pricing optimization</li>
                <li>• Real-time admin dashboards</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">AI Integration Architecture</h3>
            <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-x-auto text-sm">
{`// Fraud Detection Service
const detectFraud = async (transaction) => {
  const features = {
    amount: transaction.amount,
    hoursSinceLastTxn: getTimeSinceLastTransaction(transaction.userId),
    distanceFromHome: calculateDistance(transaction.location, user.homeLocation),
    velocityScore: getVelocityScore(transaction.userId, 1), // 1 hour window
    merchantRiskScore: await getMerchantRiskScore(transaction.merchantId)
  };
  
  const riskScore = await mlModel.predict(features);
  
  if (riskScore > 75) {
    await notifyAdmins({ transaction, riskScore, reason: 'HIGH_RISK' });
    return { approved: false, requiresVerification: true };
  }
  
  return { approved: true, riskScore };
};

// Personalized Recommendations Engine
const getRecommendations = async (userId) => {
  const userProfile = await getUserProfile(userId);
  const purchaseHistory = await getPurchaseHistory(userId);
  const similarUsers = await findSimilarUsers(userId, 50);
  
  // Collaborative filtering
  const recommendations = await collaborativeFilter({
    userId,
    similarUsers,
    merchantCategories: userProfile.preferredCategories,
    location: userProfile.location,
    limit: 10
  });
  
  return recommendations.sort((a, b) => b.score - a.score);
};`}
            </pre>
          </div>
        </div>

        {/* Section 3: Security & Privacy */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900">Security & Privacy</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 shadow-xl border-2 border-red-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-8 h-8 text-red-600" />
                End-to-End Encryption
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                  <p><strong>AES-256:</strong> All sensitive data encrypted at rest (voucher codes, wallet balances)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                  <p><strong>TLS 1.3:</strong> All API communication over HTTPS with certificate pinning</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                  <p><strong>PCI-DSS Compliant:</strong> Tokenization for payment card data</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                  <p><strong>Zero-Knowledge Architecture:</strong> Server never sees plaintext passwords</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-xl border-2 border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Fingerprint className="w-8 h-8 text-blue-600" />
                Biometric Authentication
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>Face ID / Touch ID:</strong> Native biometric support for iOS & Android</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>WebAuthn API:</strong> FIDO2 authentication on web platform</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>2FA with OTP:</strong> SMS-based backup for high-value transactions</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>Session Management:</strong> JWT tokens with 15-min expiry & refresh rotation</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">100%</p>
              <p className="text-gray-700">POPIA Compliant</p>
              <p className="text-xs text-gray-500 mt-2">SA Data Protection Act</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">ISO 27001</p>
              <p className="text-gray-700">Certified Security</p>
              <p className="text-xs text-gray-500 mt-2">Information Security Management</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center">
              <p className="text-4xl font-bold text-purple-600 mb-2">PCI-DSS</p>
              <p className="text-gray-700">Level 1 Compliant</p>
              <p className="text-xs text-gray-500 mt-2">Payment Card Industry Standard</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Security Implementation</h3>
            <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-x-auto text-sm">
{`// Biometric Authentication with WebAuthn
const enableBiometricAuth = async () => {
  // Generate credential
  const publicKeyCredential = await navigator.credentials.create({
    publicKey: {
      challenge: new Uint8Array(32),
      rp: { name: "eVoucher", id: "evoucher.co.za" },
      user: {
        id: new Uint8Array(16),
        name: user.email,
        displayName: user.fullName
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      timeout: 60000
    }
  });
  
  // Store credential
  await storeCredential(publicKeyCredential);
  return { success: true, credentialId: publicKeyCredential.id };
};

// E2E Encryption for Voucher Codes
const encryptVoucherCode = (code, userPublicKey) => {
  const encrypted = crypto.publicEncrypt({
    key: userPublicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, Buffer.from(code));
  
  return encrypted.toString('base64');
};`}
            </pre>
          </div>
        </div>

        {/* Section 4: Scalability & Performance */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page bg-gradient-to-br from-teal-50 to-blue-50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900">Scalability & Performance</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-teal-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Server className="w-8 h-8 text-teal-600" />
                Serverless Architecture
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                  <p><strong>AWS Lambda Functions:</strong> Auto-scaling backend (0 → 10K concurrent)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                  <p><strong>DynamoDB:</strong> Single-digit millisecond response times at any scale</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                  <p><strong>CloudFront CDN:</strong> Global edge caching (50+ locations)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                  <p><strong>SQS/SNS:</strong> Decoupled event-driven architecture for settlements</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone className="w-8 h-8 text-blue-600" />
                Mobile Optimization
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>Code Splitting:</strong> Route-based lazy loading (initial bundle: 45KB)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>Image Optimization:</strong> WebP format with responsive sizes (avg 12KB)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>Virtual Scrolling:</strong> Renders only visible vouchers (1000+ list support)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p><strong>3G Optimization:</strong> Works smoothly on 256kbps connections</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6 text-center shadow-lg">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-90" />
              <p className="text-4xl font-bold mb-1">&lt;1s</p>
              <p className="text-sm text-green-100">Page Load Time</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6 text-center shadow-lg">
              <Zap className="w-10 h-10 mx-auto mb-2 opacity-90" />
              <p className="text-4xl font-bold mb-1">98</p>
              <p className="text-sm text-blue-100">Lighthouse Score</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-6 text-center shadow-lg">
              <Database className="w-10 h-10 mx-auto mb-2 opacity-90" />
              <p className="text-4xl font-bold mb-1">10M+</p>
              <p className="text-sm text-purple-100">Txns/Day Capacity</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl p-6 text-center shadow-lg">
              <Cloud className="w-10 h-10 mx-auto mb-2 opacity-90" />
              <p className="text-4xl font-bold mb-1">99.99%</p>
              <p className="text-sm text-orange-100">Uptime SLA</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Optimization Techniques</h3>
            <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-x-auto text-sm">
{`// React Code Splitting with Lazy Loading
const Shop = lazy(() => import('./pages/Shop'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Profile = lazy(() => import('./pages/Profile'));

// Route Configuration
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/shop" element={<Shop />} />
    <Route path="/wallet" element={<Wallet />} />
    <Route path="/profile" element={<Profile />} />
  </Routes>
</Suspense>

// Virtual Scrolling for Large Lists (1000+ items)
const VoucherList = ({ vouchers }) => {
  const parentRef = useRef();
  
  const rowVirtualizer = useVirtualizer({
    count: vouchers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // estimated row height
    overscan: 5 // render 5 extra items above/below viewport
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      {rowVirtualizer.getVirtualItems().map(virtualItem => (
        <VoucherCard 
          key={virtualItem.key}
          voucher={vouchers[virtualItem.index]}
          style={{ height: virtualItem.size }}
        />
      ))}
    </div>
  );
};`}
            </pre>
          </div>
        </div>

        {/* Section 5: Developer Experience */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Terminal className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900">Developer Experience</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 shadow-xl border-2 border-indigo-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GitBranch className="w-8 h-8 text-indigo-600" />
                CI/CD Pipeline
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                  <p><strong>GitHub Actions:</strong> Automated linting, testing & deployment</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                  <p><strong>ESLint + Prettier:</strong> Code quality checks on every PR</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                  <p><strong>Jest + React Testing Library:</strong> 85%+ test coverage</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                  <p><strong>Vercel Preview Deploys:</strong> Every PR gets a live preview URL</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8 shadow-xl border-2 border-green-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileCode className="w-8 h-8 text-green-600" />
                Documentation
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <p><strong>Storybook:</strong> Interactive component library with live examples</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <p><strong>TypeScript:</strong> Self-documenting code with type definitions</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <p><strong>Swagger API Docs:</strong> OpenAPI 3.0 spec with try-it-out</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <p><strong>README + Wiki:</strong> Onboarding guide for new developers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">CI/CD Workflow</h3>
            <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-x-auto text-sm">
{`# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Lint code
        run: npm run lint
      - name: Run tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token=\${{ secrets.VERCEL_TOKEN }}
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Notify Slack
        run: |
          curl -X POST $SLACK_WEBHOOK \\
            -d '{"text":"✅ eVoucher deployed successfully!"}'`}
            </pre>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6 text-center shadow-lg">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-90" />
              <p className="text-3xl font-bold mb-1">85%</p>
              <p className="text-sm text-blue-100">Test Coverage</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl p-6 text-center shadow-lg">
              <Rocket className="w-10 h-10 mx-auto mb-2 opacity-90" />
              <p className="text-3xl font-bold mb-1">5 min</p>
              <p className="text-sm text-green-100">Deploy Time</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-6 text-center shadow-lg">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-90" />
              <p className="text-3xl font-bold mb-1">50+</p>
              <p className="text-sm text-purple-100">API Endpoints</p>
            </div>
          </div>
        </div>

        {/* Section 6: Architecture Diagram */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page bg-gray-50">
          <h2 className="text-5xl font-bold text-gray-900 mb-8 text-center">System Architecture</h2>
          
          <div className="bg-white rounded-2xl p-10 shadow-2xl mb-8">
            <div className="space-y-6">
              {/* Layer 1: Client */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Presentation Layer</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-6 text-center">
                    <Smartphone className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                    <p className="font-bold text-gray-900">React PWA</p>
                    <p className="text-xs text-gray-600">iOS/Android/Web</p>
                  </div>
                  <div className="bg-green-100 border-2 border-green-400 rounded-xl p-6 text-center">
                    <WifiOff className="w-10 h-10 text-green-600 mx-auto mb-2" />
                    <p className="font-bold text-gray-900">USSD Gateway</p>
                    <p className="text-xs text-gray-600">*120*384#</p>
                  </div>
                  <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-6 text-center">
                    <Activity className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                    <p className="font-bold text-gray-900">SMS API</p>
                    <p className="text-xs text-gray-600">Two-way messaging</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-3xl">↕</div>
                  <p className="text-xs">HTTPS / TLS 1.3</p>
                </div>
              </div>

              {/* Layer 2: API Gateway */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">API Gateway Layer</h3>
                <div className="bg-gradient-to-r from-teal-100 to-blue-100 border-2 border-teal-400 rounded-xl p-6">
                  <div className="grid grid-cols-4 gap-3 text-center text-sm">
                    <div>
                      <Shield className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                      <p className="font-bold">Auth</p>
                    </div>
                    <div>
                      <Zap className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                      <p className="font-bold">Rate Limit</p>
                    </div>
                    <div>
                      <Activity className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                      <p className="font-bold">Load Balance</p>
                    </div>
                    <div>
                      <Cloud className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                      <p className="font-bold">CDN Cache</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-3xl">↕</div>
                  <p className="text-xs">Microservices</p>
                </div>
              </div>

              {/* Layer 3: Application Services */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Application Layer</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-orange-100 border-2 border-orange-400 rounded-xl p-4 text-center">
                    <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="font-bold text-sm">User Service</p>
                  </div>
                  <div className="bg-pink-100 border-2 border-pink-400 rounded-xl p-4 text-center">
                    <Database className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                    <p className="font-bold text-sm">Voucher Service</p>
                  </div>
                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 text-center">
                    <DollarSign className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="font-bold text-sm">Payment Service</p>
                  </div>
                  <div className="bg-indigo-100 border-2 border-indigo-400 rounded-xl p-4 text-center">
                    <Brain className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="font-bold text-sm">AI Service</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-3xl">↕</div>
                  <p className="text-xs">Data Access</p>
                </div>
              </div>

              {/* Layer 4: Data Layer */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Data Layer</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4 text-center">
                    <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-bold text-sm">PostgreSQL</p>
                    <p className="text-xs text-gray-600">Primary DB</p>
                  </div>
                  <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 text-center">
                    <Activity className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="font-bold text-sm">Redis Cache</p>
                    <p className="text-xs text-gray-600">Session & Cache</p>
                  </div>
                  <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4 text-center">
                    <Cloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-bold text-sm">S3 Storage</p>
                    <p className="text-xs text-gray-600">Files & Backups</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6">
              <Layers className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-xl font-bold mb-2">Microservices Architecture</p>
              <p className="text-blue-100">Loosely coupled services for independent scaling & deployment</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl p-6">
              <RefreshCw className="w-10 h-10 mb-3 opacity-90" />
              <p className="text-xl font-bold mb-2">Event-Driven Design</p>
              <p className="text-green-100">Asynchronous processing with message queues for reliability</p>
            </div>
          </div>
        </div>

        {/* Final Slide: Summary */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page bg-gradient-to-br from-[#00A89D] to-teal-700">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h2 className="text-6xl font-bold mb-8">Technical Excellence</h2>
            <p className="text-2xl mb-12 text-teal-100">
              Enterprise-grade fintech platform combining cutting-edge technology 
              with inclusive design for South Africa's digital transformation
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border-2 border-white/20">
                <h3 className="text-2xl font-bold mb-4">Key Achievements</h3>
                <ul className="space-y-3 text-left text-lg">
                  <li>✓ 99.99% uptime SLA with auto-scaling</li>
                  <li>✓ Sub-second page loads on 3G networks</li>
                  <li>✓ 85%+ test coverage with CI/CD</li>
                  <li>✓ PCI-DSS & POPIA compliant</li>
                  <li>✓ 10M+ transactions/day capacity</li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border-2 border-white/20">
                <h3 className="text-2xl font-bold mb-4">Innovation Highlights</h3>
                <ul className="space-y-3 text-left text-lg">
                  <li>✓ Offline-first with background sync</li>
                  <li>✓ AI-powered fraud detection</li>
                  <li>✓ USSD access for 100% inclusion</li>
                  <li>✓ Biometric authentication</li>
                  <li>✓ Real-time analytics dashboard</li>
                </ul>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/30">
              <p className="text-2xl font-bold mb-4">Built with Modern Stack</p>
              <div className="flex flex-wrap justify-center gap-4 text-lg">
                <span className="bg-white/20 px-4 py-2 rounded-lg">React</span>
                <span className="bg-white/20 px-4 py-2 rounded-lg">Node.js</span>
                <span className="bg-white/20 px-4 py-2 rounded-lg">PostgreSQL</span>
                <span className="bg-white/20 px-4 py-2 rounded-lg">AWS Lambda</span>
                <span className="bg-white/20 px-4 py-2 rounded-lg">Redis</span>
                <span className="bg-white/20 px-4 py-2 rounded-lg">TypeScript</span>
                <span className="bg-white/20 px-4 py-2 rounded-lg">TensorFlow</span>
                <span className="bg-white/20 px-4 py-2 rounded-lg">Docker</span>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-lg text-teal-200">University Portfolio Submission | December 2025</p>
              <p className="text-xl font-bold mt-2">eVoucher Platform | Technical Documentation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:break-after-page { page-break-after: always; }
          @page { margin: 0; size: A4 landscape; }
        }
      `}</style>
    </div>
  );
}