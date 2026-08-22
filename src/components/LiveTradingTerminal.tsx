import React, { useState } from 'react';
import {
  Play,
  Pause,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sliders,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Plus,
} from 'lucide-react';
import { StockInfo, Strategy, Position, BotLog, AccountState } from '../types';
import { StockChart } from './StockChart';
import { StockManagerModal } from './StockManagerModal';
import { PresetStockCandidate } from '../data/sampleStocks';

interface LiveTradingTerminalProps {
  stocks: StockInfo[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  strategies: Strategy[];
  activeStrategy: Strategy;
  setActiveStrategyId: (id: string) => void;
  account: AccountState;
  onToggleBot: () => void;
  openPositions: Position[];
  onClosePosition: (positionId: string, reason: string) => void;
  botLogs: BotLog[];
  onManualTrade: (symbol: string, type: 'BUY' | 'SELL', shares: number) => void;
  onAddPresetStock: (preset: PresetStockCandidate) => void;
  onAddCustomStock: (stock: { symbol: string; name: string; category: string; price: number }) => void;
  onToggleStockActive: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
}

export const LiveTradingTerminal: React.FC<LiveTradingTerminalProps> = ({
  stocks,
  selectedSymbol,
  setSelectedSymbol,
  strategies,
  activeStrategy,
  setActiveStrategyId,
  account,
  onToggleBot,
  openPositions,
  onClosePosition,
  botLogs,
  onManualTrade,
  onAddPresetStock,
  onAddCustomStock,
  onToggleStockActive,
  onRemoveStock,
}) => {
  const currentStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];
  const [manualShares, setManualShares] = useState(100);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const activeStockCount = stocks.filter((s) => s.isActive !== false).length;

  return (
    <div className="space-y-6">
      {/* Active Bot Status Bar & Strategy Selection Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${
              account.isBotRunning
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Zap className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white">自動売買アルゴリズムボット</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  account.isBotRunning
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {account.isBotRunning ? '● 稼働中 (RUNNING)' : '○ 停止中 (PAUSED)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {account.isBotRunning
                ? `1.5秒ごとに${stocks.length}銘柄のテクニカル指標をリアルタイム監視中...`
                : '自動売買を起動すると、テクニカル指標の条件達成時に自動で発注します'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Strategy Dropdown Selector */}
          <div className="flex-1 md:flex-none">
            <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">
              適用ルール戦略 (Active Strategy)
            </label>
            <select
              value={activeStrategy.id}
              onChange={(e) => setActiveStrategyId(e.target.value)}
              className="w-full md:w-64 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {strategies.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.isPreset ? ' (プリセット)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onToggleBot}
            className={`mt-4 sm:mt-0 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              account.isBotRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
            }`}
          >
            {account.isBotRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                ボットを停止する
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                自動売買を起動する
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Ticker Selector (Left) & Main Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Ticker List */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-300">監視対象銘柄</h3>
              <div className="text-[10px] text-slate-400 font-mono">
                有効: <span className="text-emerald-400 font-bold">{activeStockCount}</span> / 全{stocks.length}銘柄
              </div>
            </div>

            <button
              onClick={() => setIsStockModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              買いたい株の選択・管理
            </button>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
            {stocks.map((s) => {
              const isSelected = s.symbol === selectedSymbol;
              const isUp = s.change >= 0;
              const isActive = s.isActive !== false;

              return (
                <button
                  key={s.symbol}
                  onClick={() => setSelectedSymbol(s.symbol)}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40'
                  } ${!isActive ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{s.name}</span>
                        {!isActive && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-500">除外</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{s.symbol} · {s.category}</div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-semibold text-sm text-white">¥{s.currentPrice.toLocaleString()}</div>
                      <div
                        className={`text-xs font-medium flex items-center justify-end gap-0.5 ${
                          isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isUp ? '+' : ''}
                        {s.changePercent}%
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Manual Order Widget */}
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">手動発注テスト ({currentStock.symbol})</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                step={10}
                value={manualShares}
                onChange={(e) => setManualShares(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono text-white"
              />
              <span className="text-xs text-slate-400">株</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onManualTrade(currentStock.symbol, 'BUY', manualShares)}
                className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                手動 成行買い
              </button>
              <button
                onClick={() => onManualTrade(currentStock.symbol, 'SELL', manualShares)}
                className="py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                手動 成行売り
              </button>
            </div>
          </div>
        </div>

        {/* Main Stock Chart */}
        <div className="lg:col-span-3">
          <StockChart
            candles={currentStock.history}
            symbol={currentStock.symbol}
            stockName={currentStock.name}
          />
        </div>
      </div>

      {/* Grid: Open Positions Monitor (Left) & Real-time Bot Execution Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Positions Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">保有ポジション（含み損益）</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {openPositions.length} 件
              </span>
            </div>

            <div className="font-mono text-xs">
              含み損益合計:{' '}
              <span
                className={`font-bold ${
                  totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalUnrealizedPnL >= 0 ? '+' : ''}¥{Math.round(totalUnrealizedPnL).toLocaleString()}
              </span>
            </div>
          </div>

          {openPositions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              現在、オープンポジションはありません。ボットの売買条件達成時に自動で建玉が作成されます。
            </div>
          ) : (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-2 font-medium">銘柄</th>
                    <th className="pb-2 font-medium">株数</th>
                    <th className="pb-2 font-medium">取得単価</th>
                    <th className="pb-2 font-medium">現在値</th>
                    <th className="pb-2 font-medium">損切り/利確</th>
                    <th className="pb-2 font-medium text-right">評価損益</th>
                    <th className="pb-2 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {openPositions.map((pos) => {
                    const isProfit = pos.unrealizedPnL >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 font-sans font-bold text-white">
                          {pos.stockName}
                          <div className="text-[10px] text-slate-400 font-mono">{pos.symbol}</div>
                        </td>
                        <td className="py-3">{pos.shares}株</td>
                        <td className="py-3">¥{pos.entryPrice.toLocaleString()}</td>
                        <td className="py-3 font-semibold">¥{pos.currentPrice.toLocaleString()}</td>
                        <td className="py-3 text-[11px] text-slate-400">
                          <span className="text-rose-400">¥{Math.round(pos.stopLossPrice).toLocaleString()}</span>
                          {' / '}
                          <span className="text-emerald-400">¥{Math.round(pos.takeProfitPrice).toLocaleString()}</span>
                        </td>
                        <td
                          className={`py-3 text-right font-bold ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfit ? '+' : ''}¥{Math.round(pos.unrealizedPnL).toLocaleString()}
                          <div className="text-[10px]">
                            ({isProfit ? '+' : ''}
                            {pos.unrealizedPnLPercent.toFixed(2)}%)
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onClosePosition(pos.id, 'ユーザー手動決済')}
                            className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-500 text-white font-sans text-[11px] font-semibold transition"
                          >
                            成行手動決済
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Real-time Bot Logs Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">自動売買 判定＆実行ログ</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono">
                LIVE
              </span>
            </div>
            <div className="text-[10px] text-slate-400">最新20件表示</div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 font-mono text-xs h-64 overflow-y-auto space-y-2 custom-scrollbar">
            {botLogs.length === 0 ? (
              <div className="text-slate-600 text-center py-10">ログはまだありません</div>
            ) : (
              botLogs.slice(0, 20).map((log) => {
                let badgeClass = 'text-slate-400 border-slate-800';
                if (log.level === 'TRIGGER') badgeClass = 'text-amber-400 border-amber-900 bg-amber-950/40';
                if (log.level === 'EXECUTION') badgeClass = 'text-emerald-400 border-emerald-900 bg-emerald-950/40 font-bold';
                if (log.level === 'WARN') badgeClass = 'text-rose-400 border-rose-900 bg-rose-950/40';

                return (
                  <div key={log.id} className="border-b border-slate-900 pb-1.5 leading-relaxed">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>[{log.timestamp}]</span>
                      <span className={`px-1.5 py-0.2 rounded border ${badgeClass}`}>{log.level}</span>
                      <span className="text-slate-300 font-semibold">{log.symbol}</span>
                    </div>
                    <div className="text-slate-200 mt-0.5 text-[11px]">{log.message}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Stock Selection & Watchlist Manager Modal */}
      <StockManagerModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        stocks={stocks}
        onAddPresetStock={onAddPresetStock}
        onAddCustomStock={onAddCustomStock}
        onToggleStockActive={onToggleStockActive}
        onRemoveStock={onRemoveStock}
      />
    </div>
  );
};
