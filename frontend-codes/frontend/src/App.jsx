import { RouterProvider } from "react-router-dom";
import { appRouter } from "@/app/router";
import SessionBootstrap from "@/components/shared/SessionBootstrap";
import JobMateChatbot from "@/components/JobMateChatbot";
import { JobMateProvider } from "@/context/JobMateContext";

function App() {
  return (
    <JobMateProvider>
      <SessionBootstrap />
      <RouterProvider router={appRouter} />
      <JobMateChatbot />
    </JobMateProvider>
  );
}

export default App;
