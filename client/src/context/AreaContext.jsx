import { createContext, useContext, useState } from 'react';
import { SITE } from '../config/site';

const AreaContext = createContext(null);

const read = () => {
  try {
    const saved = localStorage.getItem('qf_area');
    return SITE.areas.includes(saved) ? saved : SITE.areas[0];
  } catch {
    return SITE.areas[0];
  }
};

export function AreaProvider({ children }) {
  const [area, setAreaState] = useState(read);
  const setArea = (value) => {
    setAreaState(value);
    try {
      localStorage.setItem('qf_area', value);
    } catch {
      /* storage blocked */
    }
  };
  return <AreaContext.Provider value={{ area, setArea, areas: SITE.areas }}>{children}</AreaContext.Provider>;
}

export const useArea = () => useContext(AreaContext);
