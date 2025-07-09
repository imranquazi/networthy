module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        networthyBlue: '#2176ae',
        networthyYellow: '#ffe066',
        networthyGreen: '#53fc18',
        networthyDark: '#1a2639',
        networthyLight: '#f4faff',
      },
      fontFamily: {
        display: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '2rem',
      },
      boxShadow: {
        networthy: '0 4px 32px 0 rgba(33, 118, 174, 0.10)',
      },
    },
  },
  plugins: [],
}; 