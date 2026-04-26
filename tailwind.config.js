/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EAF3DE",
          100: "#C0DD97",
          400: "#97C459",
          500: "#639922",
          600: "#3B6D11",
          700: "#27500A",
          900: "#173404",
        },
        ink: {
          900: "#1a1a1a",
          800: "#2C2C2A",
          600: "#5F5E5A",
          400: "#888780",
          200: "#D3D1C7",
          100: "#F1EFE8",
        },
        status: {
          available: "#97C459",
          "available-bg": "#EAF3DE",
          reserved: "#EF9F27",
          "reserved-bg": "#FAC775",
          sold: "#E24B4A",
          "sold-bg": "#F09595",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
