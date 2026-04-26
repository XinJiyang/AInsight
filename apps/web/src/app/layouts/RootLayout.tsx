import { Outlet } from "react-router";
import { Header } from "../components/Header";
import { useState } from "react";

export type AppContext = {
  searchQuery: string;
};

export function RootLayout() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-brand-50 text-brand-900 font-sans">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Outlet context={{ searchQuery } satisfies AppContext} />
    </div>
  );
}
