// theme.ts
import {
  MD3DarkTheme as PaperDark,
  MD3LightTheme as PaperLight,
} from 'react-native-paper';

/* --- PALETA-SEMENTE (hex) ---------------------------------------------- */
const brand = {
  primary: '#6750A4', // tom-40 do Deep Purple
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF', // tom-90
  onPrimaryContainer: '#21005E', // tom-10

  secondary: '#F50057', // Pink A400
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFD9E3', // tom-90
  onSecondaryContainer: '#3F0024', // tom-10
};

/* --- LIGHT -------------------------------------------------------------- */
export const LightTheme: PaperTheme = {
  ...PaperLight,
  colors: {
    ...PaperLight.colors,
    primary: brand.primary,
    onPrimary: brand.onPrimary,
    primaryContainer: brand.primaryContainer,
    onPrimaryContainer: brand.onPrimaryContainer,

    secondary: brand.secondary,
    onSecondary: brand.onSecondary,
    secondaryContainer: brand.secondaryContainer,
    onSecondaryContainer: brand.onSecondaryContainer,

    background: '#FFFBFF',
    onBackground: '#1C1B1F',

    surface: '#FFFBFF',
    onSurface: '#1C1B1F',

    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',

    outline: '#79747E',

    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',

    surfaceTint: brand.primary,
  },
};

/* --- DARK --------------------------------------------------------------- */
export const DarkTheme: PaperTheme = {
  ...PaperDark,
  colors: {
    ...PaperDark.colors,
    primary: '#D0BCFF',
    onPrimary: '#371E73',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',

    secondary: '#FFB3C8',
    onSecondary: '#780035',
    secondaryContainer: '#BB0044',
    onSecondaryContainer: '#FFD9E3',

    background: '#1C1B1F',
    onBackground: '#E6E1E5',

    surface: '#1C1B1F',
    onSurface: '#E6E1E5',

    surfaceVariant: '#49454F',
    onSurfaceVariant: '#CAC4D0',

    outline: '#938F99',

    error: '#F2B8B5',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',

    surfaceTint: '#D0BCFF',
  },
};
