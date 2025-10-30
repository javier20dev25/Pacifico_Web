/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1976D2', // Material Blue 700
          light: '#42A5F5',  // Material Blue 400
          dark: '#1565C0',   // Material Blue 800
        },
        secondary: {
          DEFAULT: '#D81B60', // Material Pink A400
          light: '#EC407A',  // Material Pink 300
          dark: '#C2185B',   // Material Pink 700
        },
                        accent: {
                          DEFAULT: '#FFC107', // Material Amber 500
                          light: '#FFD54F',  // Material Amber 300
                          dark: '#FFB300',   // Material Amber 700
                        },
                        googleBlue: {
                          DEFAULT: '#4285F4',
                          50: '#E8F0FE', // Very light blue
                        },
                        googleRed: {
                          DEFAULT: '#EA4335',
                          50: '#FCE8E6', // Very light red
                        },
                        googleYellow: {
                          DEFAULT: '#FBBC05',
                          50: '#FFF7E6', // Very light yellow
                        },
                        googleGreen: {
                          DEFAULT: '#34A853',
                          50: '#E6F4EA', // Very light green
                        },
                                neutral: {
                                  50: '#FAFAFA',
                                  100: '#F5F5F5',
                                  200: '#EEEEEE',
                                  300: '#E0E0E0',
                                  400: '#BDBDBD',
                                  500: '#9E9E9E',
                                  600: '#757575',
                                  700: '#616161',
                                  800: '#424242',
                                  900: '#212121',
                                },
                                // Colores para Neomorfismo (Tema Claro)
                                neumoBg: '#e0e0e0', // Fondo base neomórfico
                                neumoLight: '#ffffff', // Sombra clara
                                neumoDark: '#a7a7a7', // Sombra oscura
                              },
                              boxShadow: {
                                // Sombras para el efecto neomórfico "elevado"
                                neumo: '8px 8px 16px #a7a7a7, -8px -8px 16px #ffffff',
                                // Sombras para el efecto neomórfico "hundido"
                                neumoInset: 'inset 8px 8px 16px #a7a7a7, inset -8px -8px 16px #ffffff',
                              },
                              fontFamily: {
                                sans: ['Roboto', 'sans-serif'],
                              },
                            },
                          },
                          plugins: [],
                        };
