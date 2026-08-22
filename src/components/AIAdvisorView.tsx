import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  Sliders,
  Shield,
  HelpCircle,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { Strategy } from '../types';

interface AIAdvisorViewProps {
  onApplyGeneratedStrategy: (strategy: Strategy) => void;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({ onApplyGeneratedStrategy }) => {
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<any | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const samplePrompts = [
    'RSIが30以下の売られすぎで、かつ移動平均線(SMA5)がSMA20を上抜けた時に買い。-2.5%で損切り、+6%で利確する戦略',
    '株価がボリンジャーバンド上限(+2σ)をブレイクアウトした勢いで買ってトレンドに乗る順張りルール',
    'MACDラインがシグナルを上抜き、かつRSIが45以上の時にだけ買う、高勝率狙いのモメンタム戦略',
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || promptInput;
    if (!textToSubmit.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setGeneratedStrategy(null);
    setAiAdvice(null);

    try {
      const res = await fetch('/api/gemini/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSubmit }),
      });

      const data = await res.json();
      if (data.success && data.strategy) {
        setGeneratedStrategy(data.strategy);
        setAiAdvice(data.strategy.aiAdvice);
      } else {
        setErrorMsg(data.error || 'AIでの戦略自動生成に失敗しました。');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedStrategy) return;

    const fullStrategy: Strategy = {
      id: `ai_strategy_${Date.now()}`,
      name: generatedStrategy.name || 'AI生成テクニカル戦略',
      description: generatedStrategy.description || 'Gemini AIによって自然言語から構築された自動売買ルール',
      targetSymbol: 'ALL',
      createdAt: new Date().toISOString(),
      buyRules: generatedStrategy.buyRules,
      sellRules: generatedStrategy.sellRules,
      riskManagement: {
        stopLossPercent: generatedStrategy.riskManagement?.stopLossPercent ?? 2.5,
        takeProfitPercent: generatedStrategy.riskManagement?.takeProfitPercent ?? 5.0,
        positionSizingType: generatedStrategy.riskManagement?.positionSizingType ?? 'PERCENT_CAPITAL',
        positionSizingValue: generatedStrategy.riskManagement?.positionSizingValue ?? 20,
        maxPositionsPerStock: 1,
      },
    };

    onApplyGeneratedStrategy(fullStrategy);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-purple-800/60 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
              Gemini AI 自然言語 戦略生成アシスタント
            </h2>
            <p className="text-xs text-purple-200/80">
              「どのようなタイミングで買いたいか・売りたいか」を日本語で入力するだけで、AIがテクニカル自動売買アルゴリズムコードへ自動変換します。
            </p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
        <label className="block text-xs font-bold text-slate-300">
          やりたい投資アイデア・売買ルールを自由に入力してください：
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="例: RSIが30以下で売られすぎの時に買い、20日移動平均線を上抜けしたら追撃買い。-2.5%下落で損切り、+6%で利確するルールを作って。"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
          />

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !promptInput.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition disabled:opacity-50 whitespace-nowrap self-end sm:self-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                アルゴリズム生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                AIルール生成実行
              </>
            )}
          </button>
        </div>

        {/* Preset Prompt Buttons */}
        <div className="pt-2 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            サンプルプロンプト（クリックで即テスト）:
          </div>

          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPromptInput(p);
                  handleGenerate(p);
                }}
                className="text-[11px] text-slate-300 bg-slate-950 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-700/60 rounded-lg px-3 py-1.5 text-left transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Generated Strategy Preview Card */}
      {generatedStrategy && (
        <div className="bg-slate-900 border border-purple-700/80 rounded-2xl p-6 text-white space-y-5 shadow-2xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-semibold">
                  AI Generated Algorithm
                </span>
                <h3 className="text-lg font-bold text-white">{generatedStrategy.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{generatedStrategy.description}</p>
            </div>

            <button
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              この戦略を保存して自動売買ボットに適用する
            </button>
          </div>

          {/* AI Advisor Advice Note */}
          {aiAdvice && (
            <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl p-4 text-xs text-purple-200 leading-relaxed">
              <div className="font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                AIアドバイザーのコメント:
              </div>
              {aiAdvice}
            </div>
          )}

          {/* Buy & Sell Rules Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-400 mb-2">新規買い条件 (Entry Buy)</div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                {generatedStrategy.buyRules?.conditions?.map((c: any, i: number) => (
                  <li key={i} className="bg-slate-900 p-2 rounded border border-slate-800">
                    条件 #{i + 1}: {c.leftIndicator?.type} ({c.leftIndicator?.period || c.leftIndicator?.value || ''}) {c.operator} {c.rightIndicator?.type} ({c.rightIndicator?.period || c.rightIndicator?.value || ''})
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-rose-400 mb-2">売り決済条件 (Exit Sell)</div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                {generatedStrategy.sellRules?.conditions?.map((c: any, i: number) => (
                  <li key={i} className="bg-slate-900 p-2 rounded border border-slate-800">
                    条件 #{i + 1}: {c.leftIndicator?.type} ({c.leftIndicator?.period || c.leftIndicator?.value || ''}) {c.operator} {c.rightIndicator?.type} ({c.rightIndicator?.period || c.rightIndicator?.value || ''})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk Management Config */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono flex flex-wrap gap-6 text-slate-300">
            <div>
              <span className="text-slate-500">損切り (Stop Loss):</span>{' '}
              <span className="text-rose-400 font-bold">-{generatedStrategy.riskManagement?.stopLossPercent}%</span>
            </div>
            <div>
              <span className="text-slate-500">利確 (Take Profit):</span>{' '}
              <span className="text-emerald-400 font-bold">+{generatedStrategy.riskManagement?.takeProfitPercent}%</span>
            </div>
            <div>
              <span className="text-slate-500">1回あたり投下金額:</span>{' '}
              <span className="text-cyan-400 font-bold">{generatedStrategy.riskManagement?.positionSizingValue}% 資金</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
