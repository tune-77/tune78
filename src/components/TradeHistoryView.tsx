import React, { useState } from 'react';
import { History, Filter, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Terminal } from 'lucide-react';
import { Trade, BotLog } from '../types';

interface TradeHistoryViewProps {
  trades: Trade[];
  botLogs: BotLog[];
}

export const TradeHistoryView: React.FC<TradeHistoryViewProps> = ({ trades, botLogs }) => {
  const [logFilter, setLogFilter] = useState<'ALL' | 'TRIGGER' | 'EXECUTION' | 'WARN'>('ALL');
  const [tradeFilterSymbol, setTradeFilterSymbol] = useState<string>('ALL');

  const filteredTrades = trades.filter((t) => {
    if (tradeFilterSymbol !== 'ALL' && t.symbol !== tradeFilterSymbol) return false;
    return true;
  });

  const sellTrades = trades.filter((t) => t.type === 'SELL');
  const totalRealizedPnL = sellTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
  const winningTrades = sellTrades.filter((t) => (t.realizedPnL || 0) > 0).length;
  const losingTrades = sellTrades.filter((t) => (t.realizedPnL || 0) <= 0).length;
  const winRate = sellTrades.length > 0 ? ((winningTrades / sellTrades.length) * 100).toFixed(1) : '0.0';

  const filteredLogs = botLogs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.level === logFilter;
  });

  const symbolsList = Array.from(new Set(trades.map((t) => t.symbol)));

  return (
    <div className="space-y-6">
      {/* Realized PnL Performance Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">累計実現損益 (Realized PnL)</div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalRealizedPnL >= 0 ? '+' : ''}¥{Math.round(totalRealizedPnL).toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">完了取引数 (Completed Trades)</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{sellTrades.length} 件</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">勝敗 (Win / Loss)</div>
          <div className="text-xl font-bold font-mono text-slate-200 mt-1">
            <span className="text-emerald-400">{winningTrades}勝</span>{' '}
            <span className="text-rose-400">{losingTrades}敗</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">勝率 (Win Rate)</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{winRate}%</div>
        </div>
      </div>

      {/* Trades History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">自動約定 注文履歴 ({filteredTrades.length}件)</h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">銘柄絞り込み:</span>
            <select
              value={tradeFilterSymbol}
              onChange={(e) => setTradeFilterSymbol(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
            >
              <option value="ALL">すべての銘柄</option>
              {symbolsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            約定履歴はまだありません。ボットを起動してシミュレーションを開始してください。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-2 font-medium">日時</th>
                  <th className="pb-2 font-medium">銘柄</th>
                  <th className="pb-2 font-medium">注文</th>
                  <th className="pb-2 font-medium">株数</th>
                  <th className="pb-2 font-medium">約定価格</th>
                  <th className="pb-2 font-medium">総額</th>
                  <th className="pb-2 font-medium text-right">損益</th>
                  <th className="pb-2 font-medium text-right">執行理由</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTrades.map((t) => {
                  const isBuy = t.type === 'BUY';
                  const hasPnL = t.realizedPnL !== undefined;
                  const isProfit = (t.realizedPnL || 0) > 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 text-slate-400">{t.timestamp}</td>
                      <td className="py-3 font-sans font-bold text-white">{t.symbol}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {isBuy ? '買い' : '売り'}
                        </span>
                      </td>
                      <td className="py-3">{t.shares}株</td>
                      <td className="py-3">¥{t.price.toLocaleString()}</td>
                      <td className="py-3">¥{t.totalAmount.toLocaleString()}</td>
                      <td
                        className={`py-3 text-right font-bold ${
                          hasPnL ? (isProfit ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'
                        }`}
                      >
                        {hasPnL
                          ? `${isProfit ? '+' : ''}¥${t.realizedPnL?.toLocaleString()} (${isProfit ? '+' : ''}${t.realizedPnLPercent}%)`
                          : '—'}
                      </td>
                      <td className="py-3 text-right text-slate-400 text-[11px] font-sans truncate max-w-xs">
                        {t.triggerReason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bot Realtime Audit Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">全自動ボット システム監査ログ ({filteredLogs.length}件)</h3>
          </div>

          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            {(['ALL', 'TRIGGER', 'EXECUTION', 'WARN'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setLogFilter(mode)}
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  logFilter === mode ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                {mode === 'ALL' ? 'すべて' : mode}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 text-center py-8">ログはありません</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>[{log.timestamp}]</span>
                  <span className="font-bold text-slate-300">[{log.level}]</span>
                  <span className="text-amber-400 font-semibold">{log.symbol}</span>
                </div>
                <div className="text-slate-200 mt-0.5 text-xs">{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
