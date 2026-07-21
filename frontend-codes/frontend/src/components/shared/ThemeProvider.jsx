import { ThemeProvider as NextThemesProvider } from "next-themes";

const ThemeProvider = ({ children, ...props }) => (
  <NextThemesProvider attribute="class" defaultTheme="light" enableSystem storageKey="jobvista-theme" {...props}>
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
