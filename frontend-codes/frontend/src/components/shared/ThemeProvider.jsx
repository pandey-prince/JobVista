import { ThemeProvider as NextThemesProvider } from "next-themes";

const ThemeProvider = ({ children, ...props }) => (
  <NextThemesProvider attribute="class" defaultTheme="system" enableSystem storageKey="jobvista-theme" {...props}>
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
