import { useTheme } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

const ThemedToaster = () => {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} />;
};

export default ThemedToaster;
