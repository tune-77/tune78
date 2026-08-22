import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Percent,
  Download,
  Upload,
  Layers,
} from 'lucide-react';
import {
  Strategy,
  RuleCondition,
  RuleGroup,
  IndicatorType,
  ComparisonOperator,
  IndicatorConfig,
} from '../types';

interface StrategyBuilderProps {
  strategies: Strategy[];
  activeStrategy: Strategy;
  onSaveStrategy: (strategy: Strategy) => void;
  onDeleteStrategy: (strategyId: string) => void;
}

const INDICATOR_OPTIONS: { type: IndicatorType; label: string; hasPeriod?: boolean; hasValue?: boolean }[] = [
  { type: 'PRICE', label: '株価 (終値)' },
  { type: 'SMA', label: '移動平均 (SMA)', hasPeriod: true },
  { type: 'EMA', label: '指数平滑移動平均 (EMA)', hasPeriod: true },
  { type: 'RSI', label: 'RSI (相対力指数)', hasPeriod: true },
  { type: 'MACD_MAIN', label: 'MACDライン' },
  { type: 'MACD_SIGNAL', label: 'MACDシグナル' },
  { type: 'MACD_HIST', label: 'MACDヒストグラム' },
  { type: 'BOLLINGER_UPPER', label: 'ボリンジャー上限 (+2σ)' },
  { type: 'BOLLINGER_MIDDLE', label: 'ボリンジャー中央 (SMA20)' },
  { type: 'BOLLINGER_LOWER', label: 'ボリンジャー下限 (-2σ)' },
  { type: 'STOCH_K', label: 'ストキャスティクス %K' },
  { type: 'STOCH_D', label: 'ストキャスティクス %D' },
  { type: 'CONSTANT', label: '固定数値 (定数)', hasValue: true },
];

const OPERATOR_OPTIONS: { type: ComparisonOperator; label: string }[] = [
  { type: 'GREATER_THAN', label: '＞ (上回る)' },
  { type: 'LESS_THAN', label: '＜ (下回る)' },
  { type: 'CROSS_ABOVE', label: '▲ ゴールデンクロス (上抜け)' },
  { type: 'CROSS_BELOW', label: '▼ デッドクロス (下抜け)' },
  { type: 'EQUALS', label: '＝ (一致)' },
];

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  strategies,
  activeStrategy,
  onSaveStrategy,
  onDeleteStrategy,
}) => {
  const [editingStrategy, setEditingStrategy] = useState<Strategy>({ ...activeStrategy });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handleSelectStrategy = (id: string) => {
    const found = strategies.find((s) => s.id === id);
    if (found) {
      setEditingStrategy({ ...found });
    }
  };

  const handleCreateNew = () => {
    const newSt: Strategy = {
      id: `custom_strategy_${Date.now()}`,
      name: '新規テクニカル戦略',
      description: '独自の指標組み合わせによる売買ルール',
      targetSymbol: 'ALL',
      createdAt: new Date().toISOString(),
      buyRules: {
        logic: 'AND',
        conditions: [
          {
            id: 'cond_buy_1',
            leftIndicator: { type: 'RSI', period: 14 },
            operator: 'LESS_THAN',
            rightIndicator: { type: 'CONSTANT', value: 30 },
          },
        ],
      },
      sellRules: {
        logic: 'AND',
        conditions: [
          {
            id: 'cond_sell_1',
            leftIndicator: { type: 'RSI', period: 14 },
            operator: 'GREATER_THAN',
            rightIndicator: { type: 'CONSTANT', value: 70 },
          },
        ],
      },
      riskManagement: {
        stopLossPercent: 2.5,
        takeProfitPercent: 5.0,
        positionSizingType: 'PERCENT_CAPITAL',
        positionSizingValue: 20,
        maxPositionsPerStock: 1,
      },
    };
    setEditingStrategy(newSt);
  };

  const addCondition = (ruleType: 'BUY' | 'SELL') => {
    const newCond: RuleCondition = {
      id: `cond_${Date.now()}`,
      leftIndicator: { type: 'SMA', period: 5 },
      operator: 'CROSS_ABOVE',
      rightIndicator: { type: 'SMA', period: 20 },
    };

    if (ruleType === 'BUY') {
      setEditingStrategy({
        ...editingStrategy,
        buyRules: {
          ...editingStrategy.buyRules,
          conditions: [...editingStrategy.buyRules.conditions, newCond],
        },
      });
    } else {
      setEditingStrategy({
        ...editingStrategy,
        sellRules: {
          ...editingStrategy.sellRules,
          conditions: [...editingStrategy.sellRules.conditions, newCond],
        },
      });
    }
  };

  const removeCondition = (ruleType: 'BUY' | 'SELL', condId: string) => {
    if (ruleType === 'BUY') {
      setEditingStrategy({
        ...editingStrategy,
        buyRules: {
          ...editingStrategy.buyRules,
          conditions: editingStrategy.buyRules.conditions.filter((c) => c.id !== condId),
        },
      });
    } else {
      setEditingStrategy({
        ...editingStrategy,
        sellRules: {
          ...editingStrategy.sellRules,
          conditions: editingStrategy.sellRules.conditions.filter((c) => c.id !== condId),
        },
      });
    }
  };

  const updateCondition = (
    ruleType: 'BUY' | 'SELL',
    condId: string,
    updated: Partial<RuleCondition>
  ) => {
    const targetGroup = ruleType === 'BUY' ? editingStrategy.buyRules : editingStrategy.sellRules;
    const updatedConditions = targetGroup.conditions.map((c) => {
      if (c.id === condId) {
        return { ...c, ...updated };
      }
      return c;
    });

    if (ruleType === 'BUY') {
      setEditingStrategy({
        ...editingStrategy,
        buyRules: { ...editingStrategy.buyRules, conditions: updatedConditions },
      });
    } else {
      setEditingStrategy({
        ...editingStrategy,
        sellRules: { ...editingStrategy.sellRules, conditions: updatedConditions },
      });
    }
  };

  const handleSave = () => {
    onSaveStrategy(editingStrategy);
    setSaveSuccessMsg('売買ルールを正常に保存しました！');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const renderConditionRow = (ruleType: 'BUY' | 'SELL', cond: RuleCondition, index: number) => {
    return (
      <div key={cond.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 font-mono">条件 #{index + 1}</span>
          <button
            onClick={() => removeCondition(ruleType, cond.id)}
            className="text-slate-500 hover:text-rose-400 p-1 transition"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          {/* Left Indicator */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">指標 1 (比較元)</label>
            <select
              value={cond.leftIndicator.type}
              onChange={(e) =>
                updateCondition(ruleType, cond.id, {
                  leftIndicator: { ...cond.leftIndicator, type: e.target.value as IndicatorType },
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              {INDICATOR_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Period or Value input if applicable */}
            {cond.leftIndicator.type === 'SMA' ||
            cond.leftIndicator.type === 'EMA' ||
            cond.leftIndicator.type === 'RSI' ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400">期間:</span>
                <input
                  type="number"
                  min={1}
                  value={cond.leftIndicator.period ?? 14}
                  onChange={(e) =>
                    updateCondition(ruleType, cond.id, {
                      leftIndicator: { ...cond.leftIndicator, period: parseInt(e.target.value) || 14 },
                    })
                  }
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-white"
                />
              </div>
            ) : null}

            {cond.leftIndicator.type === 'CONSTANT' && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400">数値:</span>
                <input
                  type="number"
                  value={cond.leftIndicator.value ?? 30}
                  onChange={(e) =>
                    updateCondition(ruleType, cond.id, {
                      leftIndicator: { ...cond.leftIndicator, value: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-white"
                />
              </div>
            )}
          </div>

          {/* Operator */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">条件比較 (Operator)</label>
            <select
              value={cond.operator}
              onChange={(e) =>
                updateCondition(ruleType, cond.id, {
                  operator: e.target.value as ComparisonOperator,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-400"
            >
              {OPERATOR_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Right Indicator */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">指標 2 (比較対象)</label>
            <select
              value={cond.rightIndicator.type}
              onChange={(e) =>
                updateCondition(ruleType, cond.id, {
                  rightIndicator: { ...cond.rightIndicator, type: e.target.value as IndicatorType },
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              {INDICATOR_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label}
                </option>
              ))}
            </select>

            {cond.rightIndicator.type === 'SMA' ||
            cond.rightIndicator.type === 'EMA' ||
            cond.rightIndicator.type === 'RSI' ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400">期間:</span>
                <input
                  type="number"
                  min={1}
                  value={cond.rightIndicator.period ?? 20}
                  onChange={(e) =>
                    updateCondition(ruleType, cond.id, {
                      rightIndicator: { ...cond.rightIndicator, period: parseInt(e.target.value) || 20 },
                    })
                  }
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-white"
                />
              </div>
            ) : null}

            {cond.rightIndicator.type === 'CONSTANT' && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400">数値:</span>
                <input
                  type="number"
                  value={cond.rightIndicator.value ?? 30}
                  onChange={(e) =>
                    updateCondition(ruleType, cond.id, {
                      rightIndicator: { ...cond.rightIndicator, value: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Strategy Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            テクニカル自動売買ルール作成・ビルダー
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            複数のテクニカル指標（移動平均, RSI, MACD, ボリンジャー等）と論理演算（AND/OR）を組み合わせた売買ルールを作成できます。
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={editingStrategy.id}
            onChange={(e) => handleSelectStrategy(e.target.value)}
            className="flex-1 md:w-64 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          >
            {strategies.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} {st.isPreset ? ' (プリセット)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreateNew}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            新規作成
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {saveSuccessMsg}
        </div>
      )}

      {/* Basic Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
        <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">基本情報設定</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">戦略名 (Strategy Name)</label>
            <input
              type="text"
              value={editingStrategy.name}
              onChange={(e) => setEditingStrategy({ ...editingStrategy, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">説明 (Description)</label>
            <input
              type="text"
              value={editingStrategy.description}
              onChange={(e) => setEditingStrategy({ ...editingStrategy, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* BUY Rules (新規買いルール) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="font-bold text-base text-white">新規買い条件 (Entry Buy Rules)</h3>
          </div>

          {/* Logic Selector (AND / OR) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">複数条件の論理結合:</span>
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() =>
                  setEditingStrategy({
                    ...editingStrategy,
                    buyRules: { ...editingStrategy.buyRules, logic: 'AND' },
                  })
                }
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  editingStrategy.buyRules.logic === 'AND'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400'
                }`}
              >
                AND (すべて達成)
              </button>
              <button
                onClick={() =>
                  setEditingStrategy({
                    ...editingStrategy,
                    buyRules: { ...editingStrategy.buyRules, logic: 'OR' },
                  })
                }
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  editingStrategy.buyRules.logic === 'OR'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400'
                }`}
              >
                OR (いずれか達成)
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {editingStrategy.buyRules.conditions.map((cond, idx) =>
            renderConditionRow('BUY', cond, idx)
          )}
        </div>

        <button
          onClick={() => addCondition('BUY')}
          className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 text-xs font-semibold text-emerald-400 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          買い条件を追加する
        </button>
      </div>

      {/* SELL Rules (売り決済ルール) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <h3 className="font-bold text-base text-white">売り決済条件 (Exit Sell Rules)</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">複数条件の論理結合:</span>
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() =>
                  setEditingStrategy({
                    ...editingStrategy,
                    sellRules: { ...editingStrategy.sellRules, logic: 'AND' },
                  })
                }
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  editingStrategy.sellRules.logic === 'AND'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-400'
                }`}
              >
                AND (すべて達成)
              </button>
              <button
                onClick={() =>
                  setEditingStrategy({
                    ...editingStrategy,
                    sellRules: { ...editingStrategy.sellRules, logic: 'OR' },
                  })
                }
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  editingStrategy.sellRules.logic === 'OR'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-400'
                }`}
              >
                OR (いずれか達成)
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {editingStrategy.sellRules.conditions.map((cond, idx) =>
            renderConditionRow('SELL', cond, idx)
          )}
        </div>

        <button
          onClick={() => addCondition('SELL')}
          className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 text-xs font-semibold text-rose-400 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          売り条件を追加する
        </button>
      </div>

      {/* Risk Management & Position Sizing */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
        <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          リスク管理・資金配分設定 (Stop Loss & Position Sizing)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              ストップロス / 損切りライン (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="20"
                value={editingStrategy.riskManagement.stopLossPercent}
                onChange={(e) =>
                  setEditingStrategy({
                    ...editingStrategy,
                    riskManagement: {
                      ...editingStrategy.riskManagement,
                      stopLossPercent: parseFloat(e.target.value) || 2.5,
                    },
                  })
                }
                className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-400"
              />
              <span className="text-xs text-slate-400">% 下落で成行強制損切り</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              テイクプロフィット / 利確ライン (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={editingStrategy.riskManagement.takeProfitPercent}
                onChange={(e) =>
                  setEditingStrategy({
                    ...editingStrategy,
                    riskManagement: {
                      ...editingStrategy.riskManagement,
                      takeProfitPercent: parseFloat(e.target.value) || 5.0,
                    },
                  })
                }
                className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400"
              />
              <span className="text-xs text-slate-400">% 上昇で成行自動利確</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              1トレードあたり資金割り当て (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="5"
                min="5"
                max="100"
                value={editingStrategy.riskManagement.positionSizingValue}
                onChange={(e) =>
                  setEditingStrategy({
                    ...editingStrategy,
                    riskManagement: {
                      ...editingStrategy.riskManagement,
                      positionSizingValue: parseInt(e.target.value) || 20,
                    },
                  })
                }
                className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-400"
              />
              <span className="text-xs text-slate-400">%（総資金に対する比率）</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save & Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {!editingStrategy.isPreset && (
          <button
            onClick={() => onDeleteStrategy(editingStrategy.id)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 border border-slate-700 text-rose-400 text-xs font-semibold transition"
          >
            この戦略を削除
          </button>
        )}

        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition"
        >
          <Save className="w-4 h-4" />
          売買ルールを保存＆適用
        </button>
      </div>
    </div>
  );
};
