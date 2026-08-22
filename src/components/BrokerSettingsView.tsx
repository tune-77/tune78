import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Globe,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Loader2,
  Lock,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

export type BrokerMode = 'SIMULATION' | 'ALPACA' | 'KABUCOM';

interface BrokerSettingsViewProps {
  currentMode: BrokerMode;
  onModeChange: (mode: BrokerMode) => void;
  maxOrderLimitJPY: number;
  setMaxOrderLimitJPY: (val: number) => void;
}

export const BrokerSettingsView: React.FC<BrokerSettingsViewProps> = ({
  currentMode,
  onModeChange,
  maxOrderLimitJPY,
  setMaxOrderLimitJPY,
}) => {
  const [status, setStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Broker Accounts State
  const [alpacaAccount, setAlpacaAccount] = useState<any>(null);
  const [kabuAccount, setKabuAccount] = useState<any>(null);
  const [accError, setAccError] = useState<string | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Test Order State
  const [testSymbol, setTestSymbol] = useState('AAPL');
  const [testQty, setTestQty] = useState(1);
  const [testSide, setTestSide] = useState<'BUY' | 'SELL'>('BUY');
  const [testBroker, setTestBroker] = useState<'alpaca' | 'kabucom'>('alpaca');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/broker/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch broker status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchAccountInfo = async (broker: 'alpaca' | 'kabucom') => {
    setLoadingAccount(true);
    setAccError(null);
    try {
      const res = await fetch(`/api/broker/account?broker=${broker}`);
      const data = await res.json();
      if (data.success) {
        if (broker === 'alpaca') setAlpacaAccount(data.account);
        if (broker === 'kabucom') setKabuAccount(data.account);
      } else {
        setAccError(data.error);
      }
    } catch (err: any) {
      setAccError(err.message || '接続エラーが発生しました');
    } finally {
      setLoadingAccount(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestOrder = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/broker/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: testBroker,
          symbol: testSymbol,
          side: testSide.toLowerCase(),
          qty: testQty,
          orderType: 'market',
        }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || '通信エラー' });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                実発注・証券会社API連携設定 (Broker Order Dispatch)
              </h2>
              <p className="text-xs text-slate-400">
                ペーパーシミュレーションから、Alpaca Trading API（米国株）や auカブコム kabuStation API（日本株）への実発注モードへ切り替えます。
              </p>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
            状態更新
          </button>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Simulation Mode */}
        <div
          onClick={() => onModeChange('SIMULATION')}
          className={`cursor-pointer bg-slate-900 border rounded-2xl p-5 transition-all relative ${
            currentMode === 'SIMULATION'
              ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-slate-900/90 shadow-xl'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {currentMode === 'SIMULATION' && (
            <span className="absolute top-4 right-4 text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
              選択中
            </span>
          )}
          <div className="text-2xl mb-2">🧪</div>
          <h3 className="font-bold text-white text-base">ペーパーシミュレーション</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            仮想資金によるセーフモード。実際の資金や口座を一切使用せず、自動売買エンジンのルール検証を行えます。
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold">
            ✓ 認証キー不要・完全安全
          </div>
        </div>

        {/* Card 2: Alpaca API */}
        <div
          onClick={() => onModeChange('ALPACA')}
          className={`cursor-pointer bg-slate-900 border rounded-2xl p-5 transition-all relative ${
            currentMode === 'ALPACA'
              ? 'border-cyan-500 ring-2 ring-cyan-500/40 bg-slate-900/90 shadow-xl'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {currentMode === 'ALPACA' && (
            <span className="absolute top-4 right-4 text-[10px] bg-cyan-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
              選択中
            </span>
          )}
          <div className="text-2xl mb-2">🦙</div>
          <h3 className="font-bold text-white text-base">Alpaca Trading API</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            米国株・ETF（NVDA, AAPL, TSLAなど）に対応したアルゴリズム取引API。Paper Trading（仮想環境）とLive Tradingの両方に対応。
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">環境変数設定:</span>
            {status?.alpaca?.configured ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 設定済み
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> .env未設定
              </span>
            )}
          </div>
        </div>

        {/* Card 3: au Kabucom kabuStation */}
        <div
          onClick={() => onModeChange('KABUCOM')}
          className={`cursor-pointer bg-slate-900 border rounded-2xl p-5 transition-all relative ${
            currentMode === 'KABUCOM'
              ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-slate-900/90 shadow-xl'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {currentMode === 'KABUCOM' && (
            <span className="absolute top-4 right-4 text-[10px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full">
              選択中
            </span>
          )}
          <div className="text-2xl mb-2">🏦</div>
          <h3 className="font-bold text-white text-base">auカブコム kabuStation API</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            日本株（東証全銘柄）に対応したAPI。PC上でkabuStationソフトを起動し、ローカルポート経由で自動発注を実行します。
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">APIパスワード:</span>
            {status?.kabucom?.configured ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 設定済み
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> .env未設定
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Safety Guard Config & Limits */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          実発注リスク制限ガード (Safety Limit Constraints)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              1注文あたりの最大発注許容上限 (JPY):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={100000}
                value={maxOrderLimitJPY}
                onChange={(e) => setMaxOrderLimitJPY(parseInt(e.target.value) || 1000000)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white w-48"
              />
              <span className="text-slate-400">円</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              この上限を超える注文条件が検知された場合、自動ボットは発注を中断します。
            </p>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              環境変数 (Secrets) の登録方法:
            </label>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono space-y-1">
              <div>ALPACA_API_KEY="your_key"</div>
              <div>ALPACA_SECRET_KEY="your_secret"</div>
              <div>KABUCOM_API_PASSWORD="your_password"</div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              .env または Settings の Secrets パネルで設定すると、サーバー側に自動反映されます。
            </p>
          </div>
        </div>
      </div>

      {/* Broker Diagnostics & Real Balance Checker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alpaca Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Alpaca Trading API 接続診断
            </h3>
            <button
              onClick={() => fetchAccountInfo('alpaca')}
              disabled={loadingAccount}
              className="px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs flex items-center gap-1 font-semibold transition"
            >
              {loadingAccount && <Loader2 className="w-3 h-3 animate-spin" />}
              口座残高テスト取得
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl p-3 text-xs font-mono space-y-2 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">環境:</span>
              <span className="text-slate-200">
                {status?.alpaca?.isPaper ? 'Paper Trading (仮想)' : 'Live Trading (本番)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">API Key:</span>
              <span className="text-slate-200">{status?.alpaca?.apiKeyMasked || '未設定'}</span>
            </div>

            {alpacaAccount && (
              <div className="pt-2 border-t border-slate-800 space-y-1 text-emerald-400">
                <div>ステータス: {alpacaAccount.status}</div>
                <div>余力 (Cash): ${alpacaAccount.cash?.toLocaleString()} USD</div>
                <div>ポートフォリオ評価額: ${alpacaAccount.equity?.toLocaleString()} USD</div>
              </div>
            )}
          </div>
        </div>

        {/* Kabucom Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> auカブコム kabuStation API 接続診断
            </h3>
            <button
              onClick={() => fetchAccountInfo('kabucom')}
              disabled={loadingAccount}
              className="px-3 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 text-xs flex items-center gap-1 font-semibold transition"
            >
              {loadingAccount && <Loader2 className="w-3 h-3 animate-spin" />}
              口座残高テスト取得
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl p-3 text-xs font-mono space-y-2 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">kabuStation Base URL:</span>
              <span className="text-slate-200">{status?.kabucom?.baseUrl || '未設定'}</span>
            </div>

            {kabuAccount && (
              <div className="pt-2 border-t border-slate-800 space-y-1 text-indigo-300">
                <div>接続ステータス: {kabuAccount.status}</div>
                <div>現物買付余力: ¥{kabuAccount.cash?.toLocaleString()} JPY</div>
                <div>認証Token: {kabuAccount.token}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {accError && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono">
          [API Error]: {accError}
        </div>
      )}

      {/* Direct Order API Tester */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-cyan-400" />
          手動APIテスト発注 (Order Terminal API Tester)
        </h3>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="block text-slate-400 text-[10px] mb-1">対象証券会社</label>
            <select
              value={testBroker}
              onChange={(e: any) => setTestBroker(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="alpaca">Alpaca Trading API (US)</option>
              <option value="kabucom">auカブコム kabuStation (JP)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] mb-1">銘柄シンボル</label>
            <input
              type="text"
              value={testSymbol}
              onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. NVDA, 7203"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono w-28"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] mb-1">売買種別</label>
            <select
              value={testSide}
              onChange={(e: any) => setTestSide(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
            >
              <option value="BUY">買付 (BUY)</option>
              <option value="SELL">売却 (SELL)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] mb-1">注文株数</label>
            <input
              type="number"
              min={1}
              value={testQty}
              onChange={(e) => setTestQty(parseInt(e.target.value) || 1)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono w-20"
            />
          </div>

          <button
            onClick={handleTestOrder}
            disabled={testLoading}
            className="mt-4 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            {testLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            テスト注文を直接送信
          </button>
        </div>

        {testResult && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2">
            <div className="font-bold text-slate-300">レスポンス結果:</div>
            <pre className="text-emerald-400 overflow-x-auto text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
