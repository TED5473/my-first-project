/**
 * Ultra-lightweight i18n. Two locales: en + he (RTL).
 * For prod, swap to next-intl or lingui.
 */

export type Locale = "en" | "he";

type Dict = Record<string, string>;

const en: Dict = {
  app_name: "IL CarLens",
  app_tagline: "Israel Passenger Car Market Intelligence",
  nav_dashboard: "Dashboard",
  nav_models: "Models",
  nav_simulator: "Launch Simulator",
  nav_alerts: "Alerts",
  nav_admin: "Admin",
  period: "Period",
  compare: "Compare",
  filters: "Filters",
  reset_filters: "Reset filters",
  search_placeholder: "Search brand, model, trim…",
  kpi_total_units: "Total units",
  kpi_yoy: "YoY growth",
  kpi_ev_share: "BEV share",
  kpi_phev_share: "PHEV share",
  kpi_cn_share: "Chinese brand share",
  kpi_avg_price: "Avg on-road price",
  kpi_top_brand: "Top brand",
  kpi_top_model: "Top model",
  chart_title: "Market Positioning — Length × On-road Price × Volume",
  chart_hint: "Hover for specs · Click bubble for trim matrix",
  table_title: "All models & trims",
  export_csv: "Export CSV",
  export_xlsx: "Export Excel",
  export_pdf: "Export PDF",
  simulator_title: "Launch Simulator",
  simulator_sub: "Position a hypothetical model in the Israeli market",
  alerts_title: "Weekly intelligence alerts",
  refresh_now: "Refresh data",
  powertrain: "Powertrain",
  brand: "Brand",
  origin: "Origin",
  segment: "Segment",
  length_mm: "Length (mm)",
  on_road_price: "On-road price",
  volume: "Volume",
  all: "All",
  apply: "Apply",
  loading: "Loading…",
  rtl: "ltr",
};

const he: Dict = {
  app_name: "IL CarLens",
  app_tagline: "פלטפורמת מודיעין לשוק הרכב הישראלי",
  nav_dashboard: "לוח מחוונים",
  nav_models: "דגמים",
  nav_simulator: "סימולטור השקה",
  nav_alerts: "התראות",
  nav_admin: "ניהול",
  period: "תקופה",
  compare: "השוואה",
  filters: "סינון",
  reset_filters: "איפוס סינון",
  search_placeholder: "חיפוש מותג, דגם, גימור…",
  kpi_total_units: 'סה"כ יחידות',
  kpi_yoy: "צמיחה שנתית",
  kpi_ev_share: "נתח חשמלי",
  kpi_phev_share: "נתח PHEV",
  kpi_cn_share: "נתח מותגים סיניים",
  kpi_avg_price: "מחיר נוחת ממוצע",
  kpi_top_brand: "מותג מוביל",
  kpi_top_model: "דגם מוביל",
  chart_title: "מיצוב שוק — אורך × מחיר נוחת × נפח",
  chart_hint: "מעבר על בועה לפרטים · לחיצה לפתיחת מטריצת גימורים",
  table_title: "כל הדגמים והגימורים",
  export_csv: "ייצוא CSV",
  export_xlsx: "ייצוא Excel",
  export_pdf: "ייצוא PDF",
  simulator_title: "סימולטור השקה",
  simulator_sub: "מקם דגם היפותטי בשוק הישראלי",
  alerts_title: "התראות מודיעין שבועיות",
  refresh_now: "רענן נתונים",
  powertrain: "הנעה",
  brand: "מותג",
  origin: "מקור",
  segment: "מקטע",
  length_mm: 'אורך (מ"מ)',
  on_road_price: "מחיר נוחת",
  volume: "נפח",
  all: "הכל",
  apply: "החל",
  loading: "טוען…",
  rtl: "rtl",
};

export const dicts: Record<Locale, Dict> = { en, he };

export function t(locale: Locale, key: keyof typeof en): string {
  return dicts[locale][key] ?? (en[key] ?? key);
}

export function isRtl(locale: Locale) {
  return locale === "he";
}
