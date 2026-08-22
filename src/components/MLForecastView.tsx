import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Cpu,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Layers,
} from 'lucide-react';
import { StockInfo, Strategy } from '../types';
import { calculateMLPrediction, MLPredictionResult } from '../utils/mlPredictor';

interface MLForecastViewProps {
  stocks: StockInfo[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  onApplyMLStrategy: (mlStrategy: Strategy) => void;
}

export const MLForecastView: React.FC<MLForecastViewProps> = ({
  stocks,
  selectedSymbol,
  setSelectedSymbol,
  onApplyMLStrategy,
}) => {
  const currentStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];
  const [localPrediction, setLocalPrediction] = useState<MLPredictionResult>(() =>
    calculateMLPrediction(currentStock.history, currentStock.symbol)
  );

  const [aiServerPrediction, setAiServerPrediction] = useState<{
    bullishProbPercent: number;
    confidenceScore: number;
    trendSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    falseBreakoutRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestedAction: string;
    analysisSummary: string;
    keyIndicators: string[];
  } | null>(null);

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const prevSymbolRef = React.useRef(selectedSymbol);

  // Recalculate local ensemble ML prediction when stock history updates
  useEffect(() => {
    setLocalPrediction(calculateMLPrediction(currentStock.history, currentStock.symbol));
  }, [currentStock.currentPrice, currentStock.history.length]);

  // Only reset AI server prediction when switching to a DIFFERENT stock
  useEffect(() => {
    if (prevSymbolRef.current !== selectedSymbol) {
      prevSymbolRef.current = selectedSymbol;
      setAiServerPrediction(null);
      setAiError(null);
    }
  }, [selectedSymbol]);

  // Request Deep Gemini ML Inference from Server
  const handleRunAiInference = async () => {
    setIsLoadingAi(true);
    setAiError(null);

    const history = currentStock.history;
    const last = history[history.length - 1] || {};
    const recentCandles = history.slice(-5).map((c) => ({
      time: c.time,
      open: c.open,
      close: c.close,
      high: c.high,
      low: c.low,
    }));

    try {
      const res = await fetch('/api/gemini/ml-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: currentStock.symbol,
          stockName: currentStock.name,
          currentPrice: currentStock.currentPrice,
          technicals: {
            rsi14: last.rsi14,
            macdMain: last.macdMain,
            macdSignal: last.macdSignal,
            macdHist: last.macdHist,
            sma5: last.sma5,
            sma20: last.sma20,
            sma50: last.sma50,
            bollingerUpper: last.bollingerUpper,
            bollingerMiddle: last.bollingerMiddle,
            bollingerLower: last.bollingerLower,
            stochK: last.stochK,
            stochD: last.stochD,
          },
          recentCandles,
        }),
      });

      const data = await res.json();
      if (data.success && data.prediction) {
        setAiServerPrediction(data.prediction);
      } else {
        throw new Error(data.error || 'AIモデル推論の解析に失敗しました。');
      }
    } catch (err: any) {
      setAiError(err.message || '通信エラーが発生しました。');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Generate an ML-Filter Enhanced Strategy
  const handleCreateMLFilterStrategy = () => {
    const mlStrategy: Strategy = {
      id: `ml-strategy-${Date.now()}`,
      name: `🤖 ML予測フィルター戦略 (${currentStock.symbol})`,
      description: `機械学習モデルの確信度(ML_CONFIDENCE ≥ 70%)と上昇確率(ML_BULLISH_PROB ≥ 65%)を必須フィルターとして組み合わせた高精度自動売買ルール`,
      targetSymbol: currentStock.symbol,
      buyRules: {
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            leftIndicator: { type: 'ML_BULLISH_PROB' },
            operator: 'GREATER_THAN',
            rightIndicator: { type: 'CONSTANT', value: 60 },
          },
          {
            id: 'c2',
            leftIndicator: { type: 'ML_CONFIDENCE' },
            operator: 'GREATER_THAN',
            rightIndicator: { type: 'CONSTANT', value: 65 },
          },
          {
            id: 'c3',
            leftIndicator: { type: 'RSI', period: 14 },
            operator: 'LESS_THAN',
            rightIndicator: { type: 'CONSTANT', value: 65 },
          },
        ],
      },
      sellRules: {
        logic: 'OR',
        conditions: [
          {
            id: 's1',
            leftIndicator: { type: 'ML_BULLISH_PROB' },
            operator: 'LESS_THAN',
            rightIndicator: { type: 'CONSTANT', value: 40 },
          },
          {
            id: 's2',
            leftIndicator: { type: 'RSI', period: 14 },
            operator: 'GREATER_THAN',
            rightIndicator: { type: 'CONSTANT', value: 75 },
          },
        ],
      },
      riskManagement: {
        stopLossPercent: 2.0,
        takeProfitPercent: 5.0,
        positionSizingType: 'PERCENT_CAPITAL',
        positionSizingValue: 20,
        maxPositionsPerStock: 1,
      },
      createdAt: new Date().toISOString(),
    };

    onApplyMLStrategy(mlStrategy);
  };

  const isBullish = localPrediction.bullishProbPercent >= 55;
  const isBearish = localPrediction.bullishProbPercent <= 45;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              機械学習 (ML) 予測モデル & 精度向上エンジン
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono">
                ML v2.4 ENSEMBLE
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              多次元テクニカル特徴量（RSI, MACD, SMA乖離率, ボリンジャー%B, ROC）からノイズを除去し、次期の価格トレンド方向と確信度を確率算出します。
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateMLFilterStrategy}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          このML条件を自動売買ルールに適用する
        </button>
      </div>

      {/* Stock Picker & Main ML Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Ticker Selector */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            AI/ML予測対象の選択
          </h3>

          <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar">
            {stocks.map((s) => {
              const isSelected = s.symbol === selectedSymbol;
              const pred = calculateMLPrediction(s.history, s.symbol);
              return (
                <button
                  key={s.symbol}
                  onClick={() => setSelectedSymbol(s.symbol)}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/60 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.symbol}</div>
                    </div>

                    <div className="text-right font-mono">
                      <div
                        className={`text-xs font-bold ${
                          pred.bullishProbPercent >= 55
                            ? 'text-emerald-400'
                            : pred.bullishProbPercent <= 45
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {pred.bullishProbPercent}% 上昇率
                      </div>
                      <div className="text-[10px] text-slate-500">確信度 {pred.confidenceScore}%</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ML Meter & Predictions Dashboard */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {currentStock.name} ({currentStock.symbol}) の機械学習推論結果
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  現在価格: <span className="font-mono text-white font-bold">¥{currentStock.currentPrice.toLocaleString()}</span>
                </p>
              </div>

              <button
                onClick={handleRunAiInference}
                disabled={isLoadingAi}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
                {isLoadingAi ? 'Gemini 3.7 AI解析中...' : '🤖 Gemini AIクオンツモデルでリアルタイム深層解析'}
              </button>
            </div>

            {/* Prediction Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bullish Probability Meter */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="text-xs font-semibold text-slate-400">次期 上昇確率 (Bullish Prob)</div>
                <div className="my-3 flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-extrabold font-mono ${
                      isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {localPrediction.bullishProbPercent}%
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {isBullish ? '▲ 上昇優勢' : isBearish ? '▼ 下落優勢' : '➡ 揉み合いレンジ'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${localPrediction.bullishProbPercent}%` }}
                  />
                </div>
              </div>

              {/* Confidence Score */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="text-xs font-semibold text-slate-400">シグナル確信度 (Confidence Score)</div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-cyan-400">
                    {localPrediction.confidenceScore}%
                  </span>
                  <span className="text-xs text-slate-400">高信頼シグナル</span>
                </div>
                <div className="text-[11px] text-slate-500">指標群のシグナル整合度から算出</div>
              </div>

              {/* Predicted Target Price */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="text-xs font-semibold text-slate-400">5期先 予測期待株価 (Target Price)</div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-white">
                    ¥{localPrediction.predictedTargetPrice.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  想定変動: {localPrediction.predictedTargetPrice >= currentStock.currentPrice ? '+' : ''}
                  {((localPrediction.predictedTargetPrice - currentStock.currentPrice) / currentStock.currentPrice * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Deep Gemini AI Server Response Panel (If run) */}
            {aiError && (
              <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {aiError}
              </div>
            )}

            {aiServerPrediction && (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-5 space-y-4 animate-fade-in shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">Gemini 3.7 クオンツAIモデル推論結果</h4>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    推奨アクション: {aiServerPrediction.suggestedAction}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400">ダマシ・ノイズ発生リスク:</span>{' '}
                    <span
                      className={`font-bold ${
                        aiServerPrediction.falseBreakoutRisk === 'LOW'
                          ? 'text-emerald-400'
                          : aiServerPrediction.falseBreakoutRisk === 'HIGH'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {aiServerPrediction.falseBreakoutRisk} （{aiServerPrediction.falseBreakoutRisk === 'LOW' ? '低い（信頼度高）' : '注意が必要'}）
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400">根拠となった重要指標:</span>{' '}
                    <span className="text-slate-200 font-mono">
                      {aiServerPrediction.keyIndicators.join(', ')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                  {aiServerPrediction.analysisSummary}
                </p>
              </div>
            )}

            {/* Feature Importance & Attribution Table */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                機械学習モデルの特徴量寄与度 (Feature Attribution)
              </h4>

              <div className="space-y-2">
                {localPrediction.featureImportance.map((feat) => (
                  <div
                    key={feat.featureName}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 max-w-sm">
                      <div className="font-semibold text-white">{feat.featureName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        現在値: {feat.value} · モデル重み: {(feat.weight * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          feat.impact === 'POSITIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : feat.impact === 'NEGATIVE'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {feat.impact === 'POSITIVE' ? '▲ 上昇に寄与' : feat.impact === 'NEGATIVE' ? '▼ 下落に寄与' : '中立'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
