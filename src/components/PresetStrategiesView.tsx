import React from 'react';
import { BookOpen, Zap, ArrowRight, ShieldCheck, Layers, Percent } from 'lucide-react';
import { Strategy } from '../types';
import { PRESET_STRATEGIES } from '../data/presetStrategies';

interface PresetStrategiesViewProps {
  onSelectPreset: (strategy: Strategy) => void;
  activeStrategyId: string;
}

export const PresetStrategiesView: React.FC<PresetStrategiesViewProps> = ({
  onSelectPreset,
  activeStrategyId,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          プロ仕様 プリセットアルゴリズム戦略ライブラリ
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          検証済みのテクニカル指標ルールテンプレートです。ワンクリックで自動売買ボットに適用、または必要に応じてカスタマイズ可能です。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRESET_STRATEGIES.map((preset) => {
          const isActive = activeStrategyId === preset.id;

          return (
            <div
              key={preset.id}
              className={`bg-slate-900 border rounded-2xl p-5 text-white flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-emerald-500/80 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                    PRESET TEMPLATE
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ● 現在適用中
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-2">{preset.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{preset.description}</p>

                {/* Strategy Summary Pill Badge List */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-xs font-mono mb-4">
                  <div>
                    <span className="text-slate-500 text-[10px]">買いルール:</span>
                    <div className="text-emerald-400 font-semibold text-[11px] truncate mt-0.5">
                      {preset.buyRules.conditions.map((c) => `${c.leftIndicator.type} ${c.operator} ${c.rightIndicator.type}`).join(' & ')}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px]">リスク管理:</span>
                    <div className="text-slate-300 text-[11px] flex items-center gap-3 mt-0.5">
                      <span>損切り: <strong className="text-rose-400">-{preset.riskManagement.stopLossPercent}%</strong></span>
                      <span>利確: <strong className="text-emerald-400">+{preset.riskManagement.takeProfitPercent}%</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectPreset(preset)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40'
                }`}
              >
                <Zap className="w-4 h-4" />
                {isActive ? '現在この戦略で稼働中' : 'この戦略を選択してボットに適用'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
