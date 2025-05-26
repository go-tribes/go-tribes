/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode via 'dark' class
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Adjust according to your src structure
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gt: {
          primary: "#D9A531",
          dark: "#1C1B18",
          bg: "#FFFFFF",
          gray: "#F5F5F4",
          muted: "#66625B",
        },
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};
