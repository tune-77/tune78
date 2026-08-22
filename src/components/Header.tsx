import React from 'react';
import {
  Play,
  Pause,
  TrendingUp,
  Activity,
  Sliders,
  BarChart3,
  Bot,
  History,
  BookOpen,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Building2,
  Cpu,
} from 'lucide-react';
import { AccountState, Position } from '../types';
import { BrokerMode } from './BrokerSettingsView';

interface HeaderProps {
  account: AccountState;
  openPositions: Position[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleBot: () => void;
  onResetAccount: () => void;
  activeStrategyName: string;
  brokerMode: BrokerMode;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  openPositions,
  activeTab,
  setActiveTab,
  onToggleBot,
  onResetAccount,
  activeStrategyName,
  brokerMode,
}) => {
  const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const totalAssetValue = account.availableCash + openPositions.reduce((sum, p) => sum + p.currentPrice * p.shares, 0);
  const totalNetPnL = totalAssetValue - account.initialCapital;
  const netPnLPercent = ((totalNetPnL / account.initialCapital) * 100).toFixed(2);

  const navItems = [
    { id: 'terminal', label: 'ライブ端末・自動売買', icon: Activity },
    { id: 'builder', label: '売買ルール作成', icon: Sliders },
    { id: 'backtest', label: 'バックテスト', icon: BarChart3 },
    { id: 'ml-forecast', label: '🤖 ML・精度予測', icon: Cpu },
    { id: 'ai-advisor', label: 'AI戦略アシスタント', icon: Bot },
    { id: 'history', label: '注文履歴・実行ログ', icon: History },
    { id: 'presets', label: 'プリセット戦略', icon: BookOpen },
    { id: 'broker', label: '証券API実発注設定', icon: Building2 },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      {/* Top Banner with Account Balance & Bot Control */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  AutoTrader <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-medium">v2.4 PRO</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">テクニカル指標に基づく全自動株式売買システム</p>
            </div>
          </div>

          {/* Account Key Stats */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider">総資産 (Total Assets)</div>
              <div className="font-mono font-semibold text-white">
                ¥{Math.round(totalAssetValue).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider">利用可能余力 (Cash)</div>
              <div className="font-mono text-slate-200">
                ¥{Math.round(account.availableCash).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider">累計損益 (Total PnL)</div>
              <div
                className={`font-mono font-semibold ${
                  totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalNetPnL >= 0 ? '+' : ''}¥{Math.round(totalNetPnL).toLocaleString()} ({netPnLPercent}%)
              </div>
            </div>

            {/* Active Strategy & Broker Mode Badges */}
            <div className="hidden lg:block bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-lg text-emerald-300">
              <div className="text-[10px] text-emerald-400/80 uppercase">稼働中戦略 (Active Strategy)</div>
              <div className="font-medium truncate max-w-[160px] text-xs">{activeStrategyName}</div>
            </div>

            <div
              onClick={() => setActiveTab('broker')}
              className="cursor-pointer hidden lg:block bg-slate-800/80 border border-slate-700/80 hover:border-cyan-500/50 px-3 py-1.5 rounded-lg text-slate-300 transition"
            >
              <div className="text-[10px] text-slate-400 uppercase">執行モード (Broker Mode)</div>
              <div className="font-semibold text-xs flex items-center gap-1 mt-0.5">
                {brokerMode === 'SIMULATION' && <span className="text-emerald-400">🧪 ペーパー模擬</span>}
                {brokerMode === 'ALPACA' && <span className="text-cyan-400">🦙 Alpaca API</span>}
                {brokerMode === 'KABUCOM' && <span className="text-indigo-400">🏦 auカブコム</span>}
              </div>
            </div>

            {/* Bot Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleBot}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg ${
                  account.isBotRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 animate-pulse'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
                }`}
              >
                {account.isBotRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>自動実行停止</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>自動売買ボット起動</span>
                  </>
                )}
              </button>

              <button
                onClick={onResetAccount}
                title="口座残高・取引データを初期化"
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
