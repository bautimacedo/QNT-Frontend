/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#113e4c',
          hover: '#2b555b',
        },
        secondary: '#536c6b',
        'bg-app': '#f3f5f5',
        'bg-hover': '#e8eded',
        border: '#e0e5e5',
      },
    },
  },
  plugins: [],
}

