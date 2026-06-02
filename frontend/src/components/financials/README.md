# Sprint 1 Financial Components

This folder contains reusable production components for the BBV Inversiones financial dashboards.

## FinancialKpiCard

Purpose: renders a compact financial metric card for dashboards.

Inputs:
- `title`: metric label.
- `value`: formatted value.
- `helper`: optional explanatory text.
- `tone`: semantic color tone.
- `icon`: optional visual icon.

Data source: receives already formatted values from the page or utility layer.

## FinancialHealthScore

Purpose: summarizes liquidity, leverage and equity trend into a single explainable health score.

Inputs:
- `snapshot`: result of `buildFinancialSnapshot`.
- `audience`: `analyst` or `investor`, used only to tune explanatory copy.

Data source: `ReporteFinanciero[]` converted with `utils/financialMetrics`.

## CompanySelector

Purpose: canonical company selector for financial dashboards.

Inputs:
- `companies`: `Empresa[]` from `/api/empresas/`.
- `selectedCompanyId`: current selected company id.
- `onChange`: selection callback.
- `isLoading`: optional loading state.
- `label`: optional visible label.

Data source: existing company API.

## Watchlist

Purpose: displays investor-selected companies without creating or simulating financial data.

Inputs:
- `companies`: selected `Empresa[]`.
- `selectedCompanyId`: current selected company.
- `onSelect`: callback to open a company.
- `onRemove`: optional callback to remove a saved company.

Data source: company API plus parent-managed local persistence.

## RiskGauge

Purpose: renders a compact SVG risk gauge consistent with the health score.

Inputs:
- `snapshot`: preferred input, result of `buildFinancialSnapshot`.
- `reportes`: compatibility input for existing screens; internally converted to snapshot.

Data source: existing report API filtered by company.

## FinancialChartCard

Purpose: standard chart container for balance-based Recharts visualizations.

Inputs:
- `title`: chart title.
- `subtitle`: optional explanation.
- `data`: `FinancialPoint[]`.
- `mode`: `patrimonio`, `balance`, `liquidez`, `endeudamiento`, or `capitalTrabajo`.

Data source: `ReporteFinanciero[]` converted with `utils/financialMetrics`.
