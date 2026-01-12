import type { OkxBalanceData, OkxBalanceDetail } from './types.js';

/**
 * Helper utilities for working with OKX balance data
 */

/**
 * Get balance detail for a specific currency
 */
export function getCurrencyBalance(
    balanceData: OkxBalanceData,
    currency: string
): OkxBalanceDetail | undefined {
    return balanceData.details.find(detail => detail.ccy === currency);
}

/**
 * Get available balance for a specific currency
 */
export function getAvailableBalance(
    balanceData: OkxBalanceData,
    currency: string
): string {
    const detail = getCurrencyBalance(balanceData, currency);
    return detail?.availBal || '0';
}

/**
 * Get total equity for a specific currency in USD
 */
export function getCurrencyEquityUsd(
    balanceData: OkxBalanceData,
    currency: string
): string {
    const detail = getCurrencyBalance(balanceData, currency);
    return detail?.eqUsd || '0';
}

/**
 * Get all currencies with non-zero balance
 */
export function getNonZeroCurrencies(balanceData: OkxBalanceData): OkxBalanceDetail[] {
    return balanceData.details.filter(detail => {
        const eq = parseFloat(detail.eq);
        return !isNaN(eq) && eq > 0;
    });
}

/**
 * Calculate total available balance in USD across all currencies
 */
export function getTotalAvailableUsd(balanceData: OkxBalanceData): number {
    return balanceData.details.reduce((total, detail) => {
        const availEq = parseFloat(detail.eqUsd);
        const frozen = parseFloat(detail.frozenBal);
        if (!isNaN(availEq) && !isNaN(frozen)) {
            return total + availEq - frozen;
        }
        return total;
    }, 0);
}

/**
 * Format balance data for display
 */
export function formatBalanceForDisplay(balanceData: OkxBalanceData) {
    return {
        totalEquityUsd: parseFloat(balanceData.totalEq).toFixed(2),
        marginRatio: balanceData.mgnRatio || 'N/A',
        unrealizedPnl: parseFloat(balanceData.upl).toFixed(2),
        currencies: balanceData.details.map(detail => ({
            currency: detail.ccy,
            available: parseFloat(detail.availBal).toFixed(8),
            frozen: parseFloat(detail.frozenBal).toFixed(8),
            total: parseFloat(detail.eq).toFixed(8),
            valueUsd: parseFloat(detail.eqUsd).toFixed(2),
            unrealizedPnl: parseFloat(detail.upl).toFixed(8)
        }))
    };
}

/**
 * Check if account has sufficient balance for trading
 */
export function hasSufficientBalance(
    balanceData: OkxBalanceData,
    currency: string,
    requiredAmount: number
): boolean {
    const availBal = getAvailableBalance(balanceData, currency);
    const available = parseFloat(availBal);
    return !isNaN(available) && available >= requiredAmount;
}

/**
 * Get margin health status based on margin ratio
 */
export function getMarginHealthStatus(balanceData: OkxBalanceData): {
    status: 'healthy' | 'warning' | 'danger' | 'unknown';
    ratio: string;
} {
    const ratio = balanceData.mgnRatio;

    if (!ratio || ratio === '') {
        return { status: 'unknown', ratio: 'N/A' };
    }

    const ratioNum = parseFloat(ratio);

    if (isNaN(ratioNum)) {
        return { status: 'unknown', ratio };
    }

    // Higher margin ratio is better
    // Typically: > 10 is healthy, 5-10 is warning, < 5 is danger
    if (ratioNum > 10) {
        return { status: 'healthy', ratio };
    } else if (ratioNum > 5) {
        return { status: 'warning', ratio };
    } else {
        return { status: 'danger', ratio };
    }
}
