import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-72">
        <Header />
        <main className="p-6 md:p-8 pt-24 md:pt-28">{children}</main>
      </div>
    </div>
  );
};
