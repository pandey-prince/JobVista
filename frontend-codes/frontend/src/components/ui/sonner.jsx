import { Toaster as Sonner } from "sonner";

const Toaster = ({ theme = "system", ...props }) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "!border-brand/40 !bg-brand-muted !text-brand dark:!bg-brand/20 dark:!text-brand-foreground",
          error:
            "!border-destructive/50 !bg-destructive/10 !text-destructive",
          warning:
            "!border-border !bg-muted !text-foreground",
          info: "!border-border !bg-background !text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
