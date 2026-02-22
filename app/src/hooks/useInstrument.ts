import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Instrument } from "../types/api";

const KEY = "@chordfinder:instrument";

export function useInstrument() {
  const [instrument, setInstrumentState] = useState<Instrument>("guitar");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      if (val) setInstrumentState(val as Instrument);
    });
  }, []);

  const setInstrument = (inst: Instrument) => {
    setInstrumentState(inst);
    AsyncStorage.setItem(KEY, inst);
  };

  return { instrument, setInstrument };
}
