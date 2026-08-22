import React, { useState } from 'react';
import {
  X,
  Plus,
  Check,
  Search,
  Trash2,
  TrendingUp,
  Globe,
  Building2,
  Sliders,
  Sparkles,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { StockInfo } from '../types';
import { PRESET_STOCK_CATALOG, PresetStockCandidate } from '../data/sampleStocks';

interface StockManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockInfo[];
  onAddPresetStock: (preset: PresetStockCandidate) => void;
  onAddCustomStock: (stock: { symbol: string; name: string; category: string; price: number }) => void;
  onToggleStockActive: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
}

export const StockManagerModal: React.FC<StockManagerModalProps> = ({
  isOpen,
  onClose,
  stocks,
  onAddPresetStock,
  onAddCustomStock,
  onToggleStockActive,
  onRemoveStock,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'presets' | 'custom'>('presets');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'JP' | 'US'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Form State
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('一般銘柄');
  const [customPrice, setCustomPrice] = useState(1000);
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSymbols = new Set(stocks.map((s) => s.symbol));

  const filteredPresets = PRESET_STOCK_CATALOG.filter((item) => {
    const matchesRegion = regionFilter === 'ALL' || item.region === regionFilter;
    const matchesSearch =
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    const cleanSymbol = customSymbol.trim().toUpperCase();
    if (!cleanSymbol) {
      setCustomError('銘柄シンボルを入力してください (例: 8306.T または TSLA)');
      return;
    }

    if (currentSymbols.has(cleanSymbol)) {
      setCustomError(`「${cleanSymbol}」はすでに監視リストに存在します。`);
      return;
    }

    if (!customName.trim()) {
      setCustomError('銘柄名を入力してください。');
      return;
    }

    onAddCustomStock({
      symbol: cleanSymbol,
      name: customName.trim(),
      category: customCategory.trim() || '一般銘柄',
      price: Number(customPrice) > 0 ? Number(customPrice) : 1000,
    });

    // Reset Form
    setCustomSymbol('');
    setCustomName('');
    setCustomCategory('一般銘柄');
    setCustomPrice(1000);
    setActiveTab('current');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                買いたい銘柄の選択・監視設定 (Watchlist Management)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                自動売買ボットが監視・注文を行う対象銘柄の追加・削除・監視ON/OFFを設定します。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 pt-3 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'presets'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            人気銘柄カタログから追加
          </button>

          <button
            onClick={() => setActiveTab('current')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'current'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            現在の監視リスト ({stocks.length}銘柄)
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'custom'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            銘柄を直接カスタム登録
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: Preset Stock Catalog */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="銘柄名・コード（例: 8306, TSLA）..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Region Filter Buttons */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setRegionFilter('ALL')}
                    className={`px-3 py-1 rounded-lg transition ${
                      regionFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    すべて
                  </button>
                  <button
                    onClick={() => setRegionFilter('JP')}
                    className={`px-3 py-1 rounded-lg transition ${
                      regionFilter === 'JP' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇯🇵 日本株
                  </button>
                  <button
                    onClick={() => setRegionFilter('US')}
                    className={`px-3 py-1 rounded-lg transition ${
                      regionFilter === 'US' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇺🇸 米国株
                  </button>
                </div>
              </div>

              {/* Grid of Candidate Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {filteredPresets.map((candidate) => {
                  const isAdded = currentSymbols.has(candidate.symbol);
                  return (
                    <div
                      key={candidate.symbol}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isAdded
                          ? 'bg-slate-950/60 border-slate-800/80 opacity-80'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{candidate.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {candidate.region === 'JP' ? '東証' : 'US'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {candidate.symbol} · <span className="text-slate-500">{candidate.category}</span>
                        </div>
                        <div className="text-xs font-semibold text-emerald-400 font-mono pt-0.5">
                          想定株価: {candidate.region === 'JP' ? `¥${candidate.defaultPrice.toLocaleString()}` : `$${candidate.defaultPrice}`}
                        </div>
                      </div>

                      <button
                        onClick={() => onAddPresetStock(candidate)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          isAdded
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            追加済み
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            リストに追加
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Current Active Watchlist */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span>
                  トグルスイッチがONの銘柄のみが、自動売買ボットによる技術指標の判定および売買注文の対象となります。
                </span>
              </div>

              <div className="space-y-2">
                {stocks.map((s) => {
                  const isActive = s.isActive !== false;
                  return (
                    <div
                      key={s.symbol}
                      className={`p-4 rounded-xl border flex items-center justify-between transition ${
                        isActive
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-slate-950/40 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => onToggleStockActive(s.symbol)}
                          className="text-slate-400 hover:text-emerald-400 transition"
                          title={isActive ? 'ボット監視から外す' : 'ボット監視を有効化'}
                        >
                          {isActive ? (
                            <ToggleRight className="w-7 h-7 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-600" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{s.name}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                isActive
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}
                            >
                              {isActive ? '● 監視中' : '○ 除外中'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {s.symbol} · {s.category} · 現在価格: ¥{s.currentPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onRemoveStock(s.symbol)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="リストから削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Add Custom Stock Form */}
          {activeTab === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-4 max-w-lg mx-auto py-2">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  任意銘柄の新規登録フォーム
                </h3>

                {customError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{customError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    銘柄シンボル / 銘柄コード *
                  </label>
                  <input
                    type="text"
                    placeholder="例: 8306.T や NFLX"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    ※ 日本株の場合は「8306.T」のように「.T」を付けるとkabuStation APIでの発注に対応します。
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    銘柄名 *
                  </label>
                  <input
                    type="text"
                    placeholder="例: 三井住友フィナンシャルグループ"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      業種・カテゴリ
                    </label>
                    <input
                      type="text"
                      placeholder="例: 銀行業 / 半導体"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      想定基準株価
                    </label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  チャート用ヒストリカルデータを生成して登録
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
          <div className="text-slate-400 font-mono">
            現在有効な監視対象: <span className="text-emerald-400 font-bold">{stocks.filter(s => s.isActive !== false).length}</span> / {stocks.length} 銘柄
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
          >
            完了して閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
