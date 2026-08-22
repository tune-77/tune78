import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { CandleData } from '../types';

interface StockChartProps {
  candles: CandleData[];
  symbol: string;
  stockName: string;
}

export const StockChart: React.FC<StockChartProps> = ({ candles, symbol, stockName }) => {
  const [showSMA, setShowSMA] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [activeSubChart, setActiveSubChart] = useState<'RSI' | 'MACD' | 'VOLUME'>('RSI');

  if (!candles || candles.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        チャートデータが準備中または見つかりません
      </div>
    );
  }

  const latest = candles[candles.length - 1];
  const prev = candles.length > 1 ? candles[candles.length - 2] : latest;
  const isUp = latest.close >= prev.close;

  // Custom Tooltip for Main Chart
  const CustomMainTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CandleData;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-lg text-xs shadow-xl font-mono text-slate-200">
          <div className="font-semibold text-slate-400 mb-1">{data.time}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <div>始値: <span className="text-white">¥{data.open.toLocaleString()}</span></div>
            <div>高値: <span className="text-emerald-400">¥{data.high.toLocaleString()}</span></div>
            <div>安値: <span className="text-rose-400">¥{data.low.toLocaleString()}</span></div>
            <div>終値: <span className="font-bold text-white">¥{data.close.toLocaleString()}</span></div>
            {data.sma5 && <div className="text-amber-400">SMA5: ¥{data.sma5}</div>}
            {data.sma20 && <div className="text-blue-400">SMA20: ¥{data.sma20}</div>}
            {data.rsi14 && <div className="text-purple-400">RSI(14): {data.rsi14}</div>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white">
      {/* Chart Top Header & Overlay Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{stockName}</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {symbol}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 font-mono text-sm">
            <span className="text-xl font-bold text-white">
              ¥{latest.close.toLocaleString()}
            </span>
            <span className={isUp ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {isUp ? '+' : ''}
              {(latest.close - prev.close).toFixed(1)} (
              {(((latest.close - prev.close) / prev.close) * 100).toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`px-3 py-1.5 rounded-lg font-medium border transition ${
              showSMA
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            移動平均 (SMA 5/20)
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-3 py-1.5 rounded-lg font-medium border transition ${
              showBollinger
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            ボリンジャーバンド (±2σ)
          </button>

          <div className="h-4 w-px bg-slate-800 my-auto" />

          {/* Sub Chart Switcher */}
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            {(['RSI', 'MACD', 'VOLUME'] as const).map((chartType) => (
              <button
                key={chartType}
                onClick={() => setActiveSubChart(chartType)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  activeSubChart === chartType
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {chartType === 'VOLUME' ? '出来高' : chartType}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stock Price Chart */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={candles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity={0.25} />
                <stop offset="95%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              orientation="right"
              tickFormatter={(val) => `¥${val.toLocaleString()}`}
            />
            <Tooltip content={<CustomMainTooltip />} />

            {/* Bollinger Band Range */}
            {showBollinger && (
              <>
                <Line
                  type="monotone"
                  dataKey="bollingerUpper"
                  stroke="#06b6d4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bollingerLower"
                  stroke="#06b6d4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </>
            )}

            {/* Price Area/Line */}
            <Area
              type="monotone"
              dataKey="close"
              stroke={isUp ? '#10b981' : '#f43f5e'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#priceGradient)"
            />

            {/* Moving Averages */}
            {showSMA && (
              <>
                <Line
                  type="monotone"
                  dataKey="sma5"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  name="SMA 5"
                />
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                  name="SMA 20"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub Indicator Chart (RSI / MACD / Volume) */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-slate-300">
            {activeSubChart === 'RSI' && 'RSI (相対力指数 14日)'}
            {activeSubChart === 'MACD' && 'MACD (12, 26, 9)'}
            {activeSubChart === 'VOLUME' && '出来高 (Volume)'}
          </span>
          <span className="font-mono text-[11px]">
            {activeSubChart === 'RSI' && `現在値: ${latest.rsi14 ?? 'N/A'}`}
            {activeSubChart === 'MACD' &&
              `MACD: ${latest.macdMain ?? 'N/A'} / Signal: ${latest.macdSignal ?? 'N/A'}`}
            {activeSubChart === 'VOLUME' && `出来高: ${latest.volume.toLocaleString()}`}
          </span>
        </div>

        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeSubChart === 'RSI' ? (
              <LineChart data={candles} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} ticks={[30, 50, 70]} tick={{ fill: '#64748b', fontSize: 10 }} orientation="right" />
                <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '過熱70', fill: '#f43f5e', fontSize: 10 }} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: '売安30', fill: '#10b981', fontSize: 10 }} />
                <Line type="monotone" dataKey="rsi14" stroke="#a855f7" strokeWidth={1.8} dot={false} />
              </LineChart>
            ) : activeSubChart === 'MACD' ? (
              <ComposedChart data={candles} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} orientation="right" />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="macdHist" fill="#38bdf8" opacity={0.6} />
                <Line type="monotone" dataKey="macdMain" stroke="#10b981" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="macdSignal" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            ) : (
              <BarChart data={candles} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" hide />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} orientation="right" />
                <Bar dataKey="volume" fill="#64748b" opacity={0.8} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
