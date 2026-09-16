import { theme as antdTheme, type ThemeConfig } from 'antd';

// Colors sampled directly from the NEATLAB Admin Dashboard UI Design Kit
// (Figma, community file) — https://www.figma.com/design/lB38lahA0li8QE7oU2PPDx
// A dark, indigo-navy admin theme. Kept in one file so the palette can be
// swapped for a final brand later without hunting through components.
export const palette = {
  bg: '#28243D', // page / sidebar / topbar background
  bgContainer: '#312D4B', // cards, inputs, modals
  border: '#46425F',
  primary: '#264CC8', // buttons, links, primary actions
  primaryActive: '#2C7EE4', // sidebar selected-item accent (brighter blue)
  textBase: '#E7E3FC', // headings, primary text (soft lavender-white)
  textSecondary: '#ADA8C3', // body text
  textTertiary: '#736E8B', // muted / helper text
  placeholder: '#5C5875',
  warningBg: '#4A3E42',
};

export const decorationTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: palette.primary,
    colorBgBase: palette.bg,
    colorBgContainer: palette.bgContainer,
    colorBgElevated: palette.bgContainer,
    colorBgLayout: palette.bg,
    colorBorder: palette.border,
    colorBorderSecondary: palette.border,
    colorText: palette.textBase,
    colorTextSecondary: palette.textSecondary,
    colorTextTertiary: palette.textTertiary,
    colorTextPlaceholder: palette.placeholder,
    borderRadius: 10,
    borderRadiusLG: 14,
    // Cairo covers Arabic; browsers fall through to it automatically for
    // Arabic glyphs while Latin text keeps using Public Sans.
    fontFamily: "'Public Sans', 'Cairo', -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: {
      siderBg: palette.bg,
      headerBg: palette.bg,
      bodyBg: palette.bg,
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: palette.primaryActive,
      itemSelectedColor: '#FFFFFF',
      itemHoverBg: 'rgba(255,255,255,0.04)',
      itemHoverColor: palette.textBase,
      itemColor: palette.textSecondary,
      itemBorderRadius: 999, // pill-shaped active item, matching the kit
    },
    Card: {
      colorBgContainer: palette.bgContainer,
      borderRadiusLG: 14,
    },
    Table: {
      colorBgContainer: palette.bgContainer,
      headerBg: '#2B2743',
      headerColor: palette.textTertiary,
      borderColor: palette.border,
    },
    Modal: {
      contentBg: palette.bgContainer,
      headerBg: palette.bgContainer,
    },
    Input: {
      colorBgContainer: palette.bgContainer,
      colorBorder: palette.border,
    },
    Select: {
      colorBgContainer: palette.bgContainer,
      colorBorder: palette.border,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
  },
};
