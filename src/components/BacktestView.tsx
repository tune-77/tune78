import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Play,
  Sparkles,
  Award,
  TrendingUp,
  Percent,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  FileText,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Strategy, StockInfo, BacktestResult } from '../types';
import { runBacktest } from '../utils/backtestEngine';

interface BacktestViewProps {
  strategies: Strategy[];
  activeStrategy: Strategy;
  stocks: StockInfo[];
}

export const BacktestView: React.FC<BacktestViewProps> = ({
  strategies,
  activeStrategy,
  stocks,
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState(activeStrategy.id);
  const [selectedSymbol, setSelectedSymbol] = useState(stocks[0].symbol);
  const [initialCapital, setInitialCapital] = useState(1000000);

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  // Gemini AI Analysis State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentStrategy = strategies.find((s) => s.id === selectedStrategyId) || activeStrategy;
  const currentStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];

  const handleRunBacktest = () => {
    setAiAnalysisResult(null);
    setAiError(null);
    const result = runBacktest(currentStrategy, currentStock.symbol, currentStock.history, initialCapital);
    setBacktestResult(result);
  };

  useEffect(() => {
    handleRunBacktest();
  }, [selectedStrategyId, selectedSymbol]);

  const handleRunAiAnalysis = async () => {
    if (!backtestResult) return;
    setIsAiAnalyzing(true);
    setAiError(null);

    try {
      const res = await fetch('/api/gemini/analyze-backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backtestResult,
          strategy: currentStrategy,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiAnalysisResult(data.analysis);
      } else {
        setAiError(data.error || 'AI診断中にエラーが発生しました。');
      }
    } catch (err: any) {
      setAiError(err.message || '通信エラーが発生しました。');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Backtest Controller Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            過去データによる戦略バックテスト（シミュレーション）
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            過去150日間の日足データをもとに、作成したルールがどの程度の収益性・勝率・最大ドローダウンを記録したか評価します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">検証戦略</label>
            <select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              {strategies.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">検証銘柄</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              {stocks.map((st) => (
                <option key={st.symbol} value={st.symbol}>
                  {st.name} ({st.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">初期元本 (JPY)</label>
            <input
              type="number"
              step={100000}
              value={initialCapital}
              onChange={(e) => setInitialCapital(parseInt(e.target.value) || 1000000)}
              className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
            />
          </div>

          <button
            onClick={handleRunBacktest}
            className="mt-4 sm:mt-0 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-cyan-950/40"
          >
            <Play className="w-4 h-4 fill-current" />
            バックテスト実行
          </button>
        </div>
      </div>

      {backtestResult && (
        <>
          {/* Performance KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">トータルリターン</div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  backtestResult.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {backtestResult.totalReturnPercent >= 0 ? '+' : ''}
                {backtestResult.totalReturnPercent}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                保有のみ: {backtestResult.benchmarkReturnPercent}%
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">勝率 (Win Rate)</div>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                {backtestResult.winRatePercent}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {backtestResult.winningTrades}勝 {backtestResult.losingTrades}敗 / 全{backtestResult.totalTrades}回
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">PF (Profit Factor)</div>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                {backtestResult.profitFactor}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">総利益 ÷ 総損失</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">最大ドローダウン</div>
              <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                -{backtestResult.maxDrawdownPercent}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">資産の最大落下率</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">シャープレシオ</div>
              <div className="text-lg font-bold font-mono text-purple-400 mt-1">
                {backtestResult.sharpeRatio}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">リスク調整後リターン</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">1取引平均損益</div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  backtestResult.avgProfitPerTrade >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {backtestResult.avgProfitPerTrade >= 0 ? '+' : ''}¥
                {backtestResult.avgProfitPerTrade.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">期待値</div>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">資産推移チャート (Equity Curve vs Benchmark)</h3>
                <p className="text-xs text-slate-400">
                  【緑線】アルゴリズム自動売買 / 【灰線】ただ保有し続けた場合 (Buy & Hold)
                </p>
              </div>

              {/* AI Diagnostic Button */}
              <button
                onClick={handleRunAiAnalysis}
                disabled={isAiAnalyzing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/50 transition disabled:opacity-50"
              >
                {isAiAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AIが戦略を分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Gemini AIで戦略を無料診断
                  </>
                )}
              </button>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={backtestResult.equityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(val) => `¥${(val / 10000).toFixed(0)}万`}
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, '資産額']}
                  />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    name="自動売買ポートフォリオ"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                    name="ベンチマーク(保有のみ)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gemini AI Strategic Analysis Output Box */}
          {aiAnalysisResult && (
            <div className="bg-slate-900 border border-purple-800/80 rounded-2xl p-6 text-white space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-base pb-2 border-b border-purple-900/60">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Gemini AI クオンツ診断レポート
              </div>
              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                {aiAnalysisResult}
              </div>
            </div>
          )}

          {aiError && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {aiError}
            </div>
          )}

          {/* Trade Execution History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-base text-white mb-3">バックテスト取引一覧 ({backtestResult.trades.length}件)</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-2">日付</th>
                    <th className="pb-2">売買種別</th>
                    <th className="pb-2">株数</th>
                    <th className="pb-2">約定価格</th>
                    <th className="pb-2">取引総額</th>
                    <th className="pb-2 text-right">実現損益</th>
                    <th className="pb-2 text-right">トリガー理由</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {backtestResult.trades.map((t) => {
                    const isBuy = t.type === 'BUY';
                    const hasPnL = t.realizedPnL !== undefined;
                    const isProfit = (t.realizedPnL || 0) > 0;

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 text-slate-300">{t.timestamp}</td>
                        <td className="py-2.5 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              isBuy ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {isBuy ? '買い (BUY)' : '売り (SELL)'}
                          </span>
                        </td>
                        <td className="py-2.5">{t.shares}株</td>
                        <td className="py-2.5">¥{t.price.toLocaleString()}</td>
                        <td className="py-2.5">¥{t.totalAmount.toLocaleString()}</td>
                        <td
                          className={`py-2.5 text-right font-bold ${
                            hasPnL ? (isProfit ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'
                          }`}
                        >
                          {hasPnL
                            ? `${isProfit ? '+' : ''}¥${t.realizedPnL?.toLocaleString()} (${isProfit ? '+' : ''}${t.realizedPnLPercent}%)`
                            : '—'}
                        </td>
                        <td className="py-2.5 text-right text-slate-400 text-[11px] font-sans truncate max-w-xs">
                          {t.triggerReason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
