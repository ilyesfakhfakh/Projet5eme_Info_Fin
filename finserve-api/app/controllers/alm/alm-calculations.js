/**
 * Module de calculs ALM (Asset-Liability Management)
 * Contient toutes les fonctions mathématiques pour les calculs financiers
 */

class AlmCalculations {

  /**
   * Interpolation linéaire pour obtenir le taux à une maturité donnée
   * @param {Array} maturityPoints - Points de la courbe des taux [{maturity, rate}, ...]
   * @param {number} targetMaturity - Maturité cible en années
   * @returns {number} Taux interpolé
   */
  static linearInterpolation(maturityPoints, targetMaturity) {
    // Trier par maturité
    const sortedPoints = maturityPoints.sort((a, b) => a.maturity - b.maturity);

    // Trouver les points encadrants
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const current = sortedPoints[i];
      const next = sortedPoints[i + 1];

      if (targetMaturity >= current.maturity && targetMaturity <= next.maturity) {
        // Interpolation linéaire
        const ratio = (targetMaturity - current.maturity) / (next.maturity - current.maturity);
        return current.rate + ratio * (next.rate - current.rate);
      }
    }

    // Extrapolation si hors des bornes
    if (targetMaturity < sortedPoints[0].maturity) {
      return sortedPoints[0].rate;
    } else {
      return sortedPoints[sortedPoints.length - 1].rate;
    }
  }

  /**
   * Calcule la valeur présente d'un cashflow
   * @param {number} cashflow - Montant du cashflow
   * @param {number} maturity - Maturité en années
   * @param {Array} yieldCurve - Courbe des taux
   * @returns {number} Valeur présente
   */
  static presentValue(cashflow, maturity, yieldCurve) {
    const rate = this.linearInterpolation(yieldCurve, maturity);
    const discountFactor = Math.pow(1 + rate / 100, -maturity);
    return cashflow * discountFactor;
  }

  /**
   * Calcule la duration de Macaulay
   * @param {Array} cashflows - Array de {date: string, amount: number}
   * @param {Array} yieldCurve - Courbe des taux
   * @param {number} faceValue - Valeur faciale
   * @returns {number} Duration de Macaulay
   */
  static macaulayDuration(cashflows, yieldCurve, faceValue = 100) {
    const valuationDate = new Date();
    let weightedSum = 0;
    let totalPV = 0;

    cashflows.forEach(cashflow => {
      const cashflowDate = new Date(cashflow.date);
      const timeToMaturity = (cashflowDate - valuationDate) / (365.25 * 24 * 60 * 60 * 1000); // en années

      const pv = this.presentValue(cashflow.amount, timeToMaturity, yieldCurve);
      weightedSum += timeToMaturity * pv;
      totalPV += pv;
    });

    return totalPV > 0 ? weightedSum / totalPV : 0;
  }

  /**
   * Calcule la duration modifiée
   * @param {number} macaulayDuration - Duration de Macaulay
   * @param {number} ytm - Yield to Maturity en %
   * @returns {number} Duration modifiée
   */
  static modifiedDuration(macaulayDuration, ytm) {
    return macaulayDuration / (1 + ytm / 100);
  }

  /**
   * Calcule la convexité
   * @param {Array} cashflows - Array de {date: string, amount: number}
   * @param {Array} yieldCurve - Courbe des taux
   * @param {number} faceValue - Valeur faciale
   * @returns {number} Convexité
   */
  static convexity(cashflows, yieldCurve, faceValue = 100) {
    const valuationDate = new Date();
    let weightedSum = 0;
    let totalPV = 0;

    cashflows.forEach(cashflow => {
      const cashflowDate = new Date(cashflow.date);
      const timeToMaturity = (cashflowDate - valuationDate) / (365.25 * 24 * 60 * 60 * 1000);

      const pv = this.presentValue(cashflow.amount, timeToMaturity, yieldCurve);
      weightedSum += (timeToMaturity * timeToMaturity + timeToMaturity) * pv;
      totalPV += pv;
    });

    return totalPV > 0 ? weightedSum / (totalPV * Math.pow(1 + this.linearInterpolation(yieldCurve, 0.01) / 100, 2)) : 0;
  }

  /**
   * Calcule le DV01 (Dollar Value of 01)
   * @param {number} modifiedDuration - Duration modifiée
   * @param {number} marketValue - Valeur de marché
   * @returns {number} DV01
   */
  static dv01(modifiedDuration, marketValue) {
    return modifiedDuration * marketValue * 0.0001; // 1 bp = 0.01%
  }

  /**
   * Projette les cashflows actifs et passifs
   * @param {Array} positions - Positions du portefeuille
   * @param {number} horizonYears - Horizon en années
   * @param {string} frequency - 'MONTHLY' ou 'QUARTERLY'
   * @returns {Object} Cashflows projetés
   */
  static projectCashflows(positions, horizonYears, frequency) {
    const periodsPerYear = frequency === 'MONTHLY' ? 12 : 4;
    const totalPeriods = horizonYears * periodsPerYear;

    const assets = new Array(totalPeriods).fill(0);
    const liabilities = new Array(totalPeriods).fill(0);

    const valuationDate = new Date();

    positions.forEach(position => {
      const cashflows = position.cashflows || [];
      const assetLiability = position.asset_liability;

      console.log(`Processing position ${position.asset_symbol || position.position_id} with ${cashflows.length} cashflows`);

      cashflows.forEach((cashflow, index) => {
        const cashflowDate = new Date(cashflow.date);

        // Calculate months from valuation date
        const monthsDiff = (cashflowDate.getFullYear() - valuationDate.getFullYear()) * 12 +
                           (cashflowDate.getMonth() - valuationDate.getMonth());

        let periodIndex;
        if (frequency === 'MONTHLY') {
          periodIndex = monthsDiff;
        } else {
          periodIndex = Math.floor(monthsDiff / 3);
        }

        console.log(`Cashflow ${index}: date=${cashflow.date}, monthsDiff=${monthsDiff}, periodIndex=${periodIndex}, amount=${cashflow.amount}`);

        if (periodIndex >= 0 && periodIndex < totalPeriods) {
          if (assetLiability === 'ASSET') {
            assets[periodIndex] += cashflow.amount;
            console.log(`Added ${cashflow.amount} to assets[${periodIndex}]`);
          } else {
            liabilities[periodIndex] += cashflow.amount;
            console.log(`Added ${cashflow.amount} to liabilities[${periodIndex}]`);
          }
        } else {
          console.log(`Period index ${periodIndex} out of range [0, ${totalPeriods})`);
        }
      });
    });

    // Log summary
    const totalAssetsSum = assets.reduce((sum, val) => sum + val, 0);
    const totalLiabilitiesSum = liabilities.reduce((sum, val) => sum + val, 0);
    console.log(`Cashflow projection summary: ${totalAssetsSum} total assets, ${totalLiabilitiesSum} total liabilities`);

    return {
      assets,
      liabilities,
      periods: totalPeriods,
      frequency,
      horizonYears
    };
  }

  /**
   * Calcule le gap de liquidité par bucket de maturité
   * @param {Array} positions - Positions du portefeuille
   * @returns {Object} Gaps par bucket
   */
  static calculateLiquidityGap(positions) {
    const buckets = {
      '0-1m': { assets: 0, liabilities: 0 },
      '1-3m': { assets: 0, liabilities: 0 },
      '3-12m': { assets: 0, liabilities: 0 },
      '1-3y': { assets: 0, liabilities: 0 },
      '3-5y': { assets: 0, liabilities: 0 },
      '5y+': { assets: 0, liabilities: 0 }
    };

    const valuationDate = new Date();

    positions.forEach(position => {
      const assetLiability = position.asset_liability;
      const marketValue = position.market_value || 0;
      const maturityDate = position.maturity_date ? new Date(position.maturity_date) : null;

      let bucket;

      if (maturityDate) {
        // Fixed maturity assets (bonds, etc.)
        const daysToMaturity = (maturityDate - valuationDate) / (24 * 60 * 60 * 1000);
        const monthsToMaturity = daysToMaturity / 30.44;
        const yearsToMaturity = daysToMaturity / 365.25;

        if (monthsToMaturity <= 1) bucket = '0-1m';
        else if (monthsToMaturity <= 3) bucket = '1-3m';
        else if (monthsToMaturity <= 12) bucket = '3-12m';
        else if (yearsToMaturity <= 3) bucket = '1-3y';
        else if (yearsToMaturity <= 5) bucket = '3-5y';
        else bucket = '5y+';
      } else {
        // Assets without fixed maturity (stocks, ETFs, cash) - assume perpetual
        // For liquidity gap analysis, we can put them in 5y+ bucket
        bucket = '5y+';
      }

      if (assetLiability === 'ASSET') {
        buckets[bucket].assets += marketValue;
      } else {
        buckets[bucket].liabilities += marketValue;
      }
    });

    // Calculer les gaps
    const gaps = {};
    Object.keys(buckets).forEach(bucket => {
      gaps[bucket] = buckets[bucket].assets - buckets[bucket].liabilities;
    });

    return {
      buckets,
      gaps,
      total_gap: Object.values(gaps).reduce((sum, gap) => sum + gap, 0)
    };
  }

  /**
   * Applique un choc de taux à la courbe des taux
   * @param {Array} yieldCurve - Courbe originale
   * @param {number} shockBps - Choc en bps
   * @param {string} scenarioType - Type de scénario
   * @returns {Array} Nouvelle courbe
   */
  static applyRateShock(yieldCurve, shockBps, scenarioType) {
    const shock = shockBps / 100; // Convertir en %

    return yieldCurve.map(point => {
      let adjustedShock = shock;

      if (scenarioType === 'STEEPENING') {
        // Plus de choc sur les longues maturités
        adjustedShock = shock * (1 + point.maturity / 10);
      } else if (scenarioType === 'FLATTENING') {
        // Plus de choc sur les courtes maturités
        adjustedShock = shock * (1 - point.maturity / 10);
      } else if (scenarioType === 'TWIST') {
        // Choc opposé sur courtes et longues maturités
        adjustedShock = point.maturity <= 5 ? shock : -shock;
      }

      return {
        maturity: point.maturity,
        rate: point.rate + adjustedShock
      };
    });
  }

  /**
   * Calcule la sensibilité aux taux d'intérêt
   * @param {Array} positions - Positions du portefeuille
   * @param {Array} yieldCurve - Courbe des taux
   * @param {number} shockBps - Choc en bps
   * @param {string} scenarioType - Type de scénario
   * @returns {Object} Résultats de sensibilité
   */
  static calculateInterestRateSensitivity(positions, yieldCurve, shockBps, scenarioType) {
    const shockedCurve = this.applyRateShock(yieldCurve, shockBps, scenarioType);

    let assetsPVChange = 0;
    let liabilitiesPVChange = 0;
    let assetsDuration = 0;
    let liabilitiesDuration = 0;

    positions.forEach(position => {
      const cashflows = position.cashflows || [];
      const marketValue = position.market_value || 0;
      const assetLiability = position.asset_liability;
      const assetType = position.asset_type;

      if (cashflows.length > 0) {
        // Positions with defined cashflows (bonds, structured products)
        let newPV = 0;
        cashflows.forEach(cashflow => {
          const cashflowDate = new Date(cashflow.date);
          const valuationDate = new Date();
          const timeToMaturity = (cashflowDate - valuationDate) / (365.25 * 24 * 60 * 60 * 1000);

          newPV += this.presentValue(cashflow.amount, timeToMaturity, shockedCurve);
        });

        const pvChange = newPV - marketValue;

        if (assetLiability === 'ASSET') {
          assetsPVChange += pvChange;
          assetsDuration += this.modifiedDuration(
            this.macaulayDuration(cashflows, yieldCurve),
            position.yield_to_maturity || 0.04
          ) * marketValue;
        } else {
          liabilitiesPVChange += pvChange;
          liabilitiesDuration += this.modifiedDuration(
            this.macaulayDuration(cashflows, yieldCurve),
            position.yield_to_maturity || 0.04
          ) * marketValue;
        }
      } else if (assetType === 'STOCK' || assetType === 'ETF') {
        // Equity positions - use duration approximation based on dividend discount model
        // Assume 2-3 year duration for equities
        const equityDuration = 2.5; // years
        const pvChange = -equityDuration * (shockBps / 100) * marketValue;

        if (assetLiability === 'ASSET') {
          assetsPVChange += pvChange;
          assetsDuration += equityDuration * marketValue;
        } else {
          liabilitiesPVChange += pvChange;
          liabilitiesDuration += equityDuration * marketValue;
        }
      } else if (assetType === 'CASH' || assetType === 'LIQUIDITY') {
        // Cash positions - zero duration
        // No PV change from rate shocks
      } else {
        // Other assets - assume some duration
        const defaultDuration = 1.0; // 1 year default
        const pvChange = -defaultDuration * (shockBps / 100) * marketValue;

        if (assetLiability === 'ASSET') {
          assetsPVChange += pvChange;
          assetsDuration += defaultDuration * marketValue;
        } else {
          liabilitiesPVChange += pvChange;
          liabilitiesDuration += defaultDuration * marketValue;
        }
      }
    });

    const netPVChange = assetsPVChange - liabilitiesPVChange;
    const durationGap = assetsDuration - liabilitiesDuration;

    return {
      assets_pv_change: assetsPVChange,
      liabilities_pv_change: liabilitiesPVChange,
      net_pv_change: netPVChange,
      assets_duration: assetsDuration,
      liabilities_duration: liabilitiesDuration,
      duration_gap: durationGap,
      scenario_type: scenarioType,
      shock_bps: shockBps
    };
  }

  /**
   * Calcule les ratios de liquidité simplifiés (LCR-like)
   * @param {Object} liquidityGap - Résultats du gap de liquidité
   * @returns {Object} Ratios de liquidité
   */
  static calculateLiquidityRatios(liquidityGap) {
    const highQualityAssets = liquidityGap.buckets['0-1m'].assets + liquidityGap.buckets['1-3m'].assets;
    const netCashOutflows = Math.abs(Math.min(0, liquidityGap.gaps['0-1m'])) +
                           Math.abs(Math.min(0, liquidityGap.gaps['1-3m']));

    const lcr = netCashOutflows > 0 ? (highQualityAssets / netCashOutflows) * 100 : 0;

    return {
      lcr_ratio: lcr,
      high_quality_assets: highQualityAssets,
      net_cash_outflows: netCashOutflows,
      minimum_required: 100 // LCR minimum réglementaire
    };
  }
}

module.exports = AlmCalculations;