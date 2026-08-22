import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LiveTradingTerminal } from './components/LiveTradingTerminal';
import { StrategyBuilder } from './components/StrategyBuilder';
import { BacktestView } from './components/BacktestView';
import { AIAdvisorView } from './components/AIAdvisorView';
import { TradeHistoryView } from './components/TradeHistoryView';
import { PresetStrategiesView } from './components/PresetStrategiesView';
import { BrokerSettingsView, BrokerMode } from './components/BrokerSettingsView';
import { MLForecastView } from './components/MLForecastView';

import { StockInfo, Strategy, Position, Trade, BotLog, AccountState, CandleData } from './types';
import { INITIAL_STOCKS, PRESET_STOCK_CATALOG, PresetStockCandidate, generateHistoricalCandles } from './data/sampleStocks';
import { PRESET_STRATEGIES } from './data/presetStrategies';
import { enrichCandlesWithIndicators } from './utils/technicalIndicators';
import { evaluateRuleGroup, checkPositionRiskExit } from './utils/strategyEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState('terminal');

  // Broker Mode State
  const [brokerMode, setBrokerMode] = useState<BrokerMode>('SIMULATION');
  const [maxOrderLimitJPY, setMaxOrderLimitJPY] = useState<number>(1000000);

  // Stock Data State
  const [stocks, setStocks] = useState<StockInfo[]>(INITIAL_STOCKS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('7203.T');

  // Strategy State
  const [strategies, setStrategies] = useState<Strategy[]>(PRESET_STRATEGIES);
  const [activeStrategyId, setActiveStrategyId] = useState<string>(PRESET_STRATEGIES[0].id);

  // Portfolio & Bot State
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);

  const [account, setAccount] = useState<AccountState>({
    initialCapital: 1000000,
    availableCash: 1000000,
    investedCapital: 0,
    totalAssetValue: 1000000,
    totalRealizedPnL: 0,
    isBotRunning: true, // Start running automatically for an instant live experience!
    activeStrategyId: PRESET_STRATEGIES[0].id,
    tickSpeedMs: 1500,
  });

  const activeStrategy = strategies.find((s) => s.id === activeStrategyId) || strategies[0];

  // Helper to add log
  const addLog = (symbol: string, level: BotLog['level'], message: string) => {
    const timeStr = new Date().toLocaleTimeString('ja-JP');
    setBotLogs((prev) => [
      {
        id: `log_${Date.now()}_${Math.random()}`,
        timestamp: timeStr,
        symbol,
        level,
        message,
      },
      ...prev.slice(0, 99), // Keep latest 100 logs
    ]);
  };

  // Bot Simulation Loop
  useEffect(() => {
    if (!account.isBotRunning) return;

    const interval = setInterval(() => {
      setStocks((prevStocks) => {
        return prevStocks.map((stock) => {
          // 1. Simulate Price Tick
          const volatility = 0.008;
          const randomFactor = (Math.random() - 0.49) * volatility;
          const newPrice = Math.max(10, Math.round(stock.currentPrice * (1 + randomFactor) * 10) / 10);
          const change = Math.round((newPrice - stock.history[0].open) * 10) / 10;
          const changePercent = Number(((change / stock.history[0].open) * 100).toFixed(2));

          // Append/Update current candle
          const updatedHistory = [...stock.history];
          const lastCandle = updatedHistory[updatedHistory.length - 1];

          const updatedLastCandle: CandleData = {
            ...lastCandle,
            close: newPrice,
            high: Math.max(lastCandle.high, newPrice),
            low: Math.min(lastCandle.low, newPrice),
            volume: lastCandle.volume + Math.floor(Math.random() * 500),
          };

          updatedHistory[updatedHistory.length - 1] = updatedLastCandle;
          const enrichedHistory = enrichCandlesWithIndicators(updatedHistory);

          return {
            ...stock,
            currentPrice: newPrice,
            change,
            changePercent,
            high24h: Math.max(stock.high24h, newPrice),
            low24h: Math.min(stock.low24h, newPrice),
            history: enrichedHistory,
          };
        });
      });
    }, account.tickSpeedMs);

    return () => clearInterval(interval);
  }, [account.isBotRunning, account.tickSpeedMs]);

  // Evaluate Positions & Bot Rules whenever Stocks update
  useEffect(() => {
    if (!account.isBotRunning) return;

    stocks.filter((s) => s.isActive !== false).forEach((stock) => {
      const history = stock.history;
      if (history.length < 2) return;
      const lastIdx = history.length - 1;

      // Check open position exit
      const existingPos = openPositions.find((p) => p.symbol === stock.symbol);

      if (existingPos) {
        // Update position current price & unrealized PnL
        const updatedPos: Position = {
          ...existingPos,
          currentPrice: stock.currentPrice,
          highestPriceSinceEntry: Math.max(existingPos.highestPriceSinceEntry, stock.currentPrice),
          unrealizedPnL: (stock.currentPrice - existingPos.entryPrice) * existingPos.shares,
          unrealizedPnLPercent: ((stock.currentPrice - existingPos.entryPrice) / existingPos.entryPrice) * 100,
        };

        // 1. Check Risk Management (SL / TP)
        const riskExit = checkPositionRiskExit(updatedPos, stock.currentPrice);
        const sellRuleEval = evaluateRuleGroup(activeStrategy.sellRules, history, lastIdx);

        let shouldClose = false;
        let closeReason = '';

        if (riskExit.shouldExit) {
          shouldClose = true;
          closeReason = riskExit.reason || '自動リスク管理決済';
        } else if (sellRuleEval.isMet) {
          shouldClose = true;
          closeReason = `売買ルール達成: ${sellRuleEval.matchedReasons.join(' / ')}`;
        }

        if (shouldClose) {
          handleExecuteSell(updatedPos, closeReason);
        } else {
          // Update open position state
          setOpenPositions((prev) => prev.map((p) => (p.id === existingPos.id ? updatedPos : p)));
        }
      } else {
        // Check Buy Entry Rule if no open position for this stock
        const buyRuleEval = evaluateRuleGroup(activeStrategy.buyRules, history, lastIdx);

        if (buyRuleEval.isMet) {
          addLog(stock.symbol, 'TRIGGER', `買いシグナル検知! (${buyRuleEval.matchedReasons.join(' & ')})`);

          // Execute Buy Order
          const risk = activeStrategy.riskManagement;
          let allocateCash = account.availableCash;

          if (risk.positionSizingType === 'PERCENT_CAPITAL') {
            allocateCash = account.availableCash * (risk.positionSizingValue / 100);
          }

          const buyShares = Math.floor(allocateCash / stock.currentPrice);

          if (buyShares > 0 && account.availableCash >= buyShares * stock.currentPrice) {
            handleExecuteBuy(stock, buyShares, `自動買いルール達成: ${buyRuleEval.matchedReasons.join(' & ')}`);
          } else {
            addLog(stock.symbol, 'WARN', '余力不足のため自動発注スキップ');
          }
        }
      }
    });
  }, [stocks]);

  // Dispatch order to Real Broker API if enabled
  const dispatchRealBrokerOrder = async (
    symbol: string,
    side: 'buy' | 'sell',
    qty: number,
    price: number
  ) => {
    if (brokerMode === 'SIMULATION') return;

    const totalCost = qty * price;
    if (totalCost > maxOrderLimitJPY) {
      addLog(
        symbol,
        'WARN',
        `【安全装置発動】発注額(¥${totalCost.toLocaleString()})が許容上限上限(¥${maxOrderLimitJPY.toLocaleString()})を超過したため実注文の送信をブロックしました。`
      );
      return;
    }

    try {
      const targetBroker = brokerMode === 'ALPACA' ? 'alpaca' : 'kabucom';
      addLog(symbol, 'INFO', `[${brokerMode} API] 証券サーバーへ注文送信中... (${side.toUpperCase()} ${qty}株)`);

      const res = await fetch('/api/broker/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: targetBroker,
          symbol,
          side,
          qty,
          price,
          orderType: 'market',
        }),
      });

      const data = await res.json();
      if (data.success) {
        addLog(
          symbol,
          'EXECUTION',
          `【証券API発注成功】${brokerMode} 注文受付完了 (OrderID: ${data.orderId || 'ACCEPTED'})`
        );
      } else {
        addLog(
          symbol,
          'ERROR',
          `【証券API発注拒否】${brokerMode}: ${data.error || '注文失敗'}`
        );
      }
    } catch (err: any) {
      addLog(symbol, 'ERROR', `【証券API通信エラー】${err.message || '接続エラー'}`);
    }
  };

  // Execute Buy Action
  const handleExecuteBuy = (stock: StockInfo, shares: number, reason: string) => {
    const totalCost = shares * stock.currentPrice;
    if (account.availableCash < totalCost) return;

    const stopLossPrice = stock.currentPrice * (1 - activeStrategy.riskManagement.stopLossPercent / 100);
    const takeProfitPrice = stock.currentPrice * (1 + activeStrategy.riskManagement.takeProfitPercent / 100);

    const newPos: Position = {
      id: `pos_${Date.now()}_${Math.random()}`,
      symbol: stock.symbol,
      stockName: stock.name,
      strategyId: activeStrategy.id,
      strategyName: activeStrategy.name,
      type: 'BUY',
      shares,
      entryPrice: stock.currentPrice,
      currentPrice: stock.currentPrice,
      entryTime: new Date().toLocaleTimeString('ja-JP'),
      stopLossPrice,
      takeProfitPrice,
      highestPriceSinceEntry: stock.currentPrice,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
    };

    setOpenPositions((prev) => [...prev, newPos]);
    setAccount((prev) => ({
      ...prev,
      availableCash: prev.availableCash - totalCost,
      investedCapital: prev.investedCapital + totalCost,
    }));

    const newTrade: Trade = {
      id: `trade_${Date.now()}`,
      symbol: stock.symbol,
      stockName: stock.name,
      strategyName: activeStrategy.name,
      type: 'BUY',
      shares,
      price: stock.currentPrice,
      totalAmount: totalCost,
      timestamp: new Date().toLocaleTimeString('ja-JP'),
      triggerReason: reason,
    };

    setTradeHistory((prev) => [newTrade, ...prev]);
    addLog(
      stock.symbol,
      'EXECUTION',
      `新規【買い成行】約定: ${shares}株 @ ¥${stock.currentPrice.toLocaleString()} (合計: ¥${totalCost.toLocaleString()})`
    );

    // If real broker mode is active, dispatch real order
    dispatchRealBrokerOrder(stock.symbol, 'buy', shares, stock.currentPrice);
  };

  // Execute Sell Action
  const handleExecuteSell = (pos: Position, reason: string) => {
    const proceeds = pos.shares * pos.currentPrice;
    const pnl = (pos.currentPrice - pos.entryPrice) * pos.shares;
    const pnlPct = ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

    setOpenPositions((prev) => prev.filter((p) => p.id !== pos.id));
    setAccount((prev) => ({
      ...prev,
      availableCash: prev.availableCash + proceeds,
      investedCapital: Math.max(0, prev.investedCapital - pos.entryPrice * pos.shares),
      totalRealizedPnL: prev.totalRealizedPnL + pnl,
    }));

    const newTrade: Trade = {
      id: `trade_${Date.now()}`,
      symbol: pos.symbol,
      stockName: pos.stockName,
      strategyName: pos.strategyName,
      type: 'SELL',
      shares: pos.shares,
      price: pos.currentPrice,
      totalAmount: proceeds,
      timestamp: new Date().toLocaleTimeString('ja-JP'),
      triggerReason: reason,
      realizedPnL: Math.round(pnl),
      realizedPnLPercent: Number(pnlPct.toFixed(2)),
    };

    setTradeHistory((prev) => [newTrade, ...prev]);
    addLog(
      pos.symbol,
      'EXECUTION',
      `決済【売り成行】約定: ${pos.shares}株 @ ¥${pos.currentPrice.toLocaleString()} (損益: ${pnl >= 0 ? '+' : ''}¥${Math.round(pnl).toLocaleString()} / ${reason})`
    );

    // If real broker mode is active, dispatch real order
    dispatchRealBrokerOrder(pos.symbol, 'sell', pos.shares, pos.currentPrice);
  };

  // Manual Position Close
  const handleClosePosition = (positionId: string, reason: string) => {
    const pos = openPositions.find((p) => p.id === positionId);
    if (pos) {
      handleExecuteSell(pos, reason);
    }
  };

  // Manual Trade Execution
  const handleManualTrade = (symbol: string, type: 'BUY' | 'SELL', shares: number) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) return;

    if (type === 'BUY') {
      handleExecuteBuy(stock, shares, 'ユーザー手動成り買い注文');
    } else {
      const pos = openPositions.find((p) => p.symbol === symbol);
      if (pos) {
        handleExecuteSell(pos, 'ユーザー手動成り売り注文');
      } else {
        addLog(symbol, 'WARN', '保有ポジションがないため売り注文を実行できません');
      }
    }
  };

  // Stock Selection Handlers
  const handleAddPresetStock = (preset: PresetStockCandidate) => {
    if (stocks.some((s) => s.symbol === preset.symbol)) return;

    const newStock: StockInfo = {
      symbol: preset.symbol,
      name: preset.name,
      category: preset.category,
      currentPrice: preset.defaultPrice,
      change: 0,
      changePercent: 0,
      high24h: preset.defaultPrice * 1.02,
      low24h: preset.defaultPrice * 0.98,
      volume24h: 5000000,
      isActive: true,
      history: generateHistoricalCandles(preset.defaultPrice, 150, 0.02),
    };

    setStocks((prev) => [...prev, newStock]);
    addLog(preset.symbol, 'INFO', `「${preset.name}」を監視・買付リストに追加しました`);
  };

  const handleAddCustomStock = (custom: { symbol: string; name: string; category: string; price: number }) => {
    if (stocks.some((s) => s.symbol === custom.symbol)) return;

    const newStock: StockInfo = {
      symbol: custom.symbol,
      name: custom.name,
      category: custom.category,
      currentPrice: custom.price,
      change: 0,
      changePercent: 0,
      high24h: custom.price * 1.02,
      low24h: custom.price * 0.98,
      volume24h: 1000000,
      isActive: true,
      history: generateHistoricalCandles(custom.price, 150, 0.02),
    };

    setStocks((prev) => [...prev, newStock]);
    addLog(custom.symbol, 'INFO', `カスタム銘柄「${custom.name} (${custom.symbol})」を監視・買付リストに登録しました`);
  };

  const handleToggleStockActive = (symbol: string) => {
    setStocks((prev) =>
      prev.map((s) => (s.symbol === symbol ? { ...s, isActive: s.isActive === false ? true : false } : s))
    );
  };

  const handleRemoveStock = (symbol: string) => {
    setStocks((prev) => {
      const filtered = prev.filter((s) => s.symbol !== symbol);
      if (selectedSymbol === symbol && filtered.length > 0) {
        setSelectedSymbol(filtered[0].symbol);
      }
      return filtered;
    });
    addLog(symbol, 'INFO', `銘柄を監視リストから削除しました`);
  };

  // Strategy Handlers
  const handleSaveStrategy = (savedStrategy: Strategy) => {
    setStrategies((prev) => {
      const idx = prev.findIndex((s) => s.id === savedStrategy.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedStrategy;
        return copy;
      }
      return [...prev, savedStrategy];
    });
    setActiveStrategyId(savedStrategy.id);
  };

  const handleDeleteStrategy = (strategyId: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== strategyId));
    if (activeStrategyId === strategyId) {
      setActiveStrategyId(PRESET_STRATEGIES[0].id);
    }
  };

  const handleResetAccount = () => {
    setAccount({
      initialCapital: 1000000,
      availableCash: 1000000,
      investedCapital: 0,
      totalAssetValue: 1000000,
      totalRealizedPnL: 0,
      isBotRunning: false,
      activeStrategyId: PRESET_STRATEGIES[0].id,
      tickSpeedMs: 1500,
    });
    setOpenPositions([]);
    setTradeHistory([]);
    setBotLogs([]);
    addLog('SYSTEM', 'INFO', '口座残高および取引データを初期化しました。');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Header
        account={account}
        openPositions={openPositions}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleBot={() => setAccount((prev) => ({ ...prev, isBotRunning: !prev.isBotRunning }))}
        onResetAccount={handleResetAccount}
        activeStrategyName={activeStrategy.name}
        brokerMode={brokerMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'terminal' && (
          <LiveTradingTerminal
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
            strategies={strategies}
            activeStrategy={activeStrategy}
            setActiveStrategyId={setActiveStrategyId}
            account={account}
            onToggleBot={() => setAccount((prev) => ({ ...prev, isBotRunning: !prev.isBotRunning }))}
            openPositions={openPositions}
            onClosePosition={handleClosePosition}
            botLogs={botLogs}
            onManualTrade={handleManualTrade}
            onAddPresetStock={handleAddPresetStock}
            onAddCustomStock={handleAddCustomStock}
            onToggleStockActive={handleToggleStockActive}
            onRemoveStock={handleRemoveStock}
          />
        )}

        {activeTab === 'builder' && (
          <StrategyBuilder
            strategies={strategies}
            activeStrategy={activeStrategy}
            onSaveStrategy={handleSaveStrategy}
            onDeleteStrategy={handleDeleteStrategy}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestView
            strategies={strategies}
            activeStrategy={activeStrategy}
            stocks={stocks}
          />
        )}

        {activeTab === 'ml-forecast' && (
          <MLForecastView
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
            onApplyMLStrategy={(mlStrategy) => {
              handleSaveStrategy(mlStrategy);
              setActiveTab('terminal');
            }}
          />
        )}

        {activeTab === 'ai-advisor' && (
          <AIAdvisorView
            onApplyGeneratedStrategy={(newStrategy) => {
              handleSaveStrategy(newStrategy);
              setActiveTab('terminal');
            }}
          />
        )}

        {activeTab === 'history' && (
          <TradeHistoryView trades={tradeHistory} botLogs={botLogs} />
        )}

        {activeTab === 'presets' && (
          <PresetStrategiesView
            onSelectPreset={(st) => {
              setActiveStrategyId(st.id);
              setActiveTab('terminal');
            }}
            activeStrategyId={activeStrategyId}
          />
        )}

        {activeTab === 'broker' && (
          <BrokerSettingsView
            currentMode={brokerMode}
            onModeChange={setBrokerMode}
            maxOrderLimitJPY={maxOrderLimitJPY}
            setMaxOrderLimitJPY={setMaxOrderLimitJPY}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>AutoTrader Algorithmic Trading Simulator Engine</div>
          <div>※ 本システムはペパートレード（シミュレーション）専用の学習・検証アプリケーションです。</div>
        </div>
      </footer>
    </div>
  );
}
