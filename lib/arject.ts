import arject from "@arcjet/next";
import { getEnv } from "./utils";

const aj = arject({
  key: getEnv("ARJECT_API_KEY"), // ajkey_01jvsm8d66fhd845m49grpsgj6
  rules: [],
});

export default aj;
