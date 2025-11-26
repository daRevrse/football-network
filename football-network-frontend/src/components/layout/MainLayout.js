import React from "react";
import Navbar from "./Navbar";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      <main className="flex-1 w-full relative">{children}</main>
    </div>
  );
};

export default MainLayout;
