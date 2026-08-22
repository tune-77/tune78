import { Strategy, CandleData, BacktestResult, Trade } from '../types';
import { evaluateRuleGroup, checkPositionRiskExit } from './strategyEngine';

export function runBacktest(
  strategy: Strategy,
  symbol: string,
  history: CandleData[],
  initialCapital = 1000000
): BacktestResult {
  let cash = initialCapital;
  let shares = 0;
  let entryPrice = 0;
  let highestPriceSinceEntry = 0;
  let stopLossPrice = 0;
  let takeProfitPrice = 0;

  const trades: Trade[] = [];
  const equityCurve: { time: string; equity: number; benchmark: number }[] = [];

  const firstPrice = history.length > 0 ? history[0].close : 1;
  const initialSharesBenchmark = initialCapital / firstPrice;

  let peakEquity = initialCapital;
  let maxDrawdown = 0;

  for (let i = 0; i < history.length; i++) {
    const candle = history[i];
    const currentPrice = candle.close;

    // Check open position exit first
    if (shares > 0) {
      if (currentPrice > highestPriceSinceEntry) {
        highestPriceSinceEntry = currentPrice;
      }

      // Risk management check (SL / TP)
      const mockPos = {
        id: 'backtest_pos',
        symbol,
        stockName: symbol,
        strategyId: strategy.id,
        strategyName: strategy.name,
        type: 'BUY' as const,
        shares,
        entryPrice,
        currentPrice,
        entryTime: candle.time,
        stopLossPrice,
        takeProfitPrice,
        highestPriceSinceEntry,
        unrealizedPnL: (currentPrice - entryPrice) * shares,
        unrealizedPnLPercent: ((currentPrice - entryPrice) / entryPrice) * 100,
      };

      const riskExit = checkPositionRiskExit(mockPos, currentPrice);
      const sellRuleCheck = evaluateRuleGroup(strategy.sellRules, history, i);

      let shouldSell = false;
      let sellReason = '';

      if (riskExit.shouldExit) {
        shouldSell = true;
        sellReason = riskExit.reason || '損切り/利確自動決済';
      } else if (sellRuleCheck.isMet) {
        shouldSell = true;
        sellReason = `売りルール達成: ${sellRuleCheck.matchedReasons.join(' / ')}`;
      }

      if (shouldSell) {
        const proceeds = shares * currentPrice;
        const pnl = (currentPrice - entryPrice) * shares;
        const pnlPct = ((currentPrice - entryPrice) / entryPrice) * 100;
        cash += proceeds;

        trades.push({
          id: `bt_trade_${trades.length + 1}`,
          symbol,
          stockName: symbol,
          strategyName: strategy.name,
          type: 'SELL',
          shares,
          price: currentPrice,
          totalAmount: proceeds,
          timestamp: candle.time,
          triggerReason: sellReason,
          realizedPnL: Math.round(pnl),
          realizedPnLPercent: Number(pnlPct.toFixed(2)),
        });

        shares = 0;
        entryPrice = 0;
      }
    } else {
      // Check entry buy rules if no open position
      const buyRuleCheck = evaluateRuleGroup(strategy.buyRules, history, i);
      if (buyRuleCheck.isMet) {
        // Calculate position size
        const risk = strategy.riskManagement;
        let allocateCash = cash;

        if (risk.positionSizingType === 'FIXED_AMOUNT') {
          allocateCash = Math.min(cash, risk.positionSizingValue);
        } else if (risk.positionSizingType === 'PERCENT_CAPITAL') {
          allocateCash = cash * (risk.positionSizingValue / 100);
        }

        const buyShares = Math.floor(allocateCash / currentPrice);

        if (buyShares > 0) {
          const cost = buyShares * currentPrice;
          cash -= cost;
          shares = buyShares;
          entryPrice = currentPrice;
          highestPriceSinceEntry = currentPrice;

          stopLossPrice = currentPrice * (1 - risk.stopLossPercent / 100);
          takeProfitPrice = currentPrice * (1 + risk.takeProfitPercent / 100);

          trades.push({
            id: `bt_trade_${trades.length + 1}`,
            symbol,
            stockName: symbol,
            strategyName: strategy.name,
            type: 'BUY',
            shares: buyShares,
            price: currentPrice,
            totalAmount: cost,
            timestamp: candle.time,
            triggerReason: `買いルール達成: ${buyRuleCheck.matchedReasons.join(' / ')}`,
          });
        }
      }
    }

    // Calculate current total equity
    const currentEquity = cash + shares * currentPrice;
    const benchmarkEquity = initialSharesBenchmark * currentPrice;

    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    equityCurve.push({
      time: candle.time,
      equity: Math.round(currentEquity),
      benchmark: Math.round(benchmarkEquity),
    });
  }

  // Calculate final performance metrics
  const finalEquity = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].equity : initialCapital;
  const totalReturnPercent = Number((((finalEquity - initialCapital) / initialCapital) * 100).toFixed(2));
  const benchmarkReturnPercent = Number(
    (((equityCurve[equityCurve.length - 1]?.benchmark - initialCapital) / initialCapital) * 100).toFixed(2)
  );

  const sellTrades = trades.filter((t) => t.type === 'SELL');
  const winningTradesList = sellTrades.filter((t) => (t.realizedPnL || 0) > 0);
  const losingTradesList = sellTrades.filter((t) => (t.realizedPnL || 0) <= 0);

  const winningTrades = winningTradesList.length;
  const losingTrades = losingTradesList.length;
  const totalTradesCount = sellTrades.length;

  const winRatePercent = totalTradesCount > 0 ? Number(((winningTrades / totalTradesCount) * 100).toFixed(1)) : 0;

  const totalGains = winningTradesList.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
  const totalLosses = Math.abs(losingTradesList.reduce((sum, t) => sum + (t.realizedPnL || 0), 0));

  const profitFactor = totalLosses > 0 ? Number((totalGains / totalLosses).toFixed(2)) : totalGains > 0 ? 99.9 : 0;

  const avgProfitPerTrade = totalTradesCount > 0 ? Math.round((totalGains - totalLosses) / totalTradesCount) : 0;

  // Simple Sharpe ratio estimation based on daily equity returns
  let sharpeRatio = 0;
  if (equityCurve.length > 5) {
    const dailyReturns: number[] = [];
    for (let j = 1; j < equityCurve.length; j++) {
      const prev = equityCurve[j - 1].equity;
      const curr = equityCurve[j].equity;
      dailyReturns.push((curr - prev) / prev);
    }
    const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const stdDev = Math.sqrt(
      dailyReturns.reduce((sq, r) => sq + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length
    );

    if (stdDev > 0) {
      sharpeRatio = Number(((avgReturn / stdDev) * Math.sqrt(252)).toFixed(2));
    }
  }

  const startDate = history.length > 0 ? history[0].time : '';
  const endDate = history.length > 0 ? history[history.length - 1].time : '';

  return {
    strategyName: strategy.name,
    symbol,
    timeframe: '日足 (Daily)',
    startDate,
    endDate,
    initialCapital,
    finalCapital: Math.round(finalEquity),
    totalReturnPercent,
    benchmarkReturnPercent,
    winRatePercent,
    totalTrades: totalTradesCount,
    winningTrades,
    losingTrades,
    profitFactor,
    maxDrawdownPercent: Number(maxDrawdown.toFixed(2)),
    sharpeRatio,
    avgProfitPerTrade,
    trades,
    equityCurve,
  };
}
