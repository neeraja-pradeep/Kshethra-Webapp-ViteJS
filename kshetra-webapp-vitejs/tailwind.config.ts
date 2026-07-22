import type { Config } from 'tailwindcss'

/**
 * Kshetra Admin design tokens.
 *
 * The token *values* live once as CSS custom properties in
 * `src/styles/tokens.css` (generated from the design-system bundle + the v3
 * refinement layer). This config maps Tailwind's named scales onto those
 * variables so components reference tokens by name (`bg-card`, `text-ink`,
 * `shadow-card`, `rounded-2xl`) and never paste raw hex or arbitrary values.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Design radii come straight from the Espresso scale — replace defaults.
    borderRadius: {
      none: '0',
      xs: 'var(--radius-xs)', // 4
      sm: 'var(--radius-sm)', // 5
      md: 'var(--radius-md)', // 6
      lg: 'var(--radius-lg)', // 8
      xl: 'var(--radius-xl)', // 10
      '2xl': 'var(--radius-2xl)', // 12
      '3xl': 'var(--radius-3xl)', // 16
      '4xl': 'var(--radius-4xl)', // 20
      full: 'var(--radius-full)',
    },
    extend: {
      colors: {
        // brand maroon
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          contrast: 'var(--color-primary-contrast)',
          subtle: 'var(--color-primary-subtle)',
          'subtle-hover': 'var(--color-primary-subtle-hover)',
          'subtle-text': 'var(--color-primary-subtle-text)',
          border: 'var(--color-primary-border)',
          50: 'var(--ks-primary-50)',
          100: 'var(--ks-primary-100)',
          200: 'var(--ks-primary-200)',
          300: 'var(--ks-primary-300)',
          400: 'var(--ks-primary-400)',
          500: 'var(--ks-primary-500)',
          600: 'var(--ks-primary-600)',
          700: 'var(--ks-primary-700)',
          800: 'var(--ks-primary-800)',
          900: 'var(--ks-primary-900)',
        },
        // surfaces
        card: 'var(--surface-card)',
        page: 'var(--surface-page)',
        sunken: 'var(--surface-sunken)',
        sidebar: 'var(--surface-sidebar)',
        hover: 'var(--surface-hover)',
        active: 'var(--surface-active)',
        overlay: 'var(--surface-overlay)',
        'side-hover': 'var(--ks-side-hover)',
        'side-divider': 'var(--ks-side-divider)',
        // text ramp (warm near-black)
        ink: {
          strong: 'var(--text-strong)',
          DEFAULT: 'var(--text-default)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
          disabled: 'var(--text-disabled)',
          'on-primary': 'var(--text-on-primary)',
          table: 'var(--ks-table-head)',
        },
        // hairline borders
        stroke: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        // neutral gray ramp (Espresso, warm-shifted by v3 for 50/100/200)
        gray: {
          50: 'var(--light-gray-50)',
          100: 'var(--light-gray-100)',
          200: 'var(--light-gray-200)',
          300: 'var(--light-gray-300)',
          400: 'var(--light-gray-400)',
          500: 'var(--light-gray-500)',
          600: 'var(--light-gray-600)',
          700: 'var(--light-gray-700)',
          800: 'var(--light-gray-800)',
          900: 'var(--light-gray-900)',
        },
        // status (surface tint · border · strong text · subtle-hover)
        success: {
          DEFAULT: 'var(--color-success)',
          surface: 'var(--color-success-surface)',
          border: 'var(--color-success-border)',
          strong: 'var(--light-green-800)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          surface: 'var(--color-warning-surface)',
          border: 'var(--color-warning-border)',
          strong: 'var(--light-amber-800)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          surface: 'var(--color-danger-surface)',
          border: 'var(--color-danger-border)',
          strong: 'var(--light-red-700)',
          'subtle-hover': 'var(--light-red-100)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          surface: 'var(--color-info-surface)',
          border: 'var(--color-info-border)',
          strong: 'var(--light-blue-800)',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
        malayalam: 'var(--font-malayalam)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        // the bumped scale as rendered in the shell
        tiny: 'var(--text-tiny)', // 13
        '2xs': 'var(--text-2xs)', // 13
        xs: 'var(--text-xs)', // 14
        sm: 'var(--text-sm)', // 15
        base: 'var(--text-base)', // 16
        lg: 'var(--text-lg)', // 18
        xl: 'var(--text-xl)', // 20
        '2xl': 'var(--text-2xl)', // 22
        '3xl': 'var(--text-3xl)', // 26
        '4xl': 'var(--text-4xl)', // 28
        '5xl': 'var(--text-5xl)', // 34
        '6xl': 'var(--text-6xl)', // 42
        '7xl': 'var(--text-7xl)', // 46
        '8xl': 'var(--text-8xl)', // 66
        '9xl': 'var(--text-9xl)', // 90
      },
      fontWeight: {
        extralight: 'var(--weight-extralight)',
        light: 'var(--weight-light)',
        normal: 'var(--weight-regular)',
        medium: 'var(--weight-medium)',
        semibold: 'var(--weight-semibold)',
        heading: 'var(--weight-heading)', // 650 — page titles
        bold: 'var(--weight-bold)',
        black: 'var(--weight-black)',
      },
      lineHeight: {
        tight: 'var(--leading-tight)', // 1.3
        snug: 'var(--leading-snug)', // 1.4
        normal: 'var(--leading-normal)', // 1.48
        relaxed: 'var(--leading-relaxed)', // 1.6
      },
      letterSpacing: {
        title: '-0.02em', // page titles
        tight: 'var(--tracking-tight)', // -0.01
        normal: 'var(--tracking-normal)', // 0.005
        wide: 'var(--tracking-wide)', // 0.01
        overline: '0.05em', // 2xs overline labels
        'overline-lg': '0.07em', // card overline title
        header: '0.075em', // table header
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        focus: 'var(--shadow-focus)',
      },
      spacing: {
        // quarter-step + odd-pixel additions so the design's bespoke paddings
        // (3/7/9/11/13/15/18/22/26/30px …) stay token-named — no arbitrary values.
        '0.75': '3px',
        '1.25': '5px',
        '1.75': '7px',
        '2.25': '9px',
        '2.75': '11px',
        '3.25': '13px',
        '3.75': '15px',
        '4.5': '18px',
        '5.5': '22px',
        '6.5': '26px',
        '7.5': '30px',
        '8.5': '34px',
        '9.5': '38px',
        '11.5': '46px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
        '58': '232px', // sidebar rail (expanded)
        '60': '240px',
      },
      transitionTimingFunction: {
        ks: 'ease',
      },
      transitionDuration: {
        '120': '120ms',
        '140': '140ms',
        '160': '160ms',
        '240': '240ms',
      },
      maxWidth: {
        dashboard: '1240px',
      },
      zIndex: {
        drawer: '25',
        topbar: '30',
        scrim: '40',
        menu: '50',
      },
    },
  },
  plugins: [],
}

export default config
