'use client';

import React, { createContext, useContext } from 'react';

const ShellBootstrapContext = createContext(true);

export function ShellBootstrapProvider({ children, value }) {
  return (
    <ShellBootstrapContext.Provider value={value}>
      {children}
    </ShellBootstrapContext.Provider>
  );
}

export function useShellBootstrap() {
  return useContext(ShellBootstrapContext);
}
