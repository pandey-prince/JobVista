import { RouterProvider } from "react-router-dom";
import { appRouter } from "@/app/router";
import SessionBootstrap from "@/components/shared/SessionBootstrap";
import JobMateChatbot from "@/components/JobMateChatbot";

function App() {
  return (
    <>
      <SessionBootstrap />
      <RouterProvider router={appRouter} />
      <JobMateChatbot />
    </>
  );
}

export default App;
