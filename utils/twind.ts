import { IS_BROWSER } from "$fresh/runtime.ts";
import { Configuration, setup } from "twind";
export * from "twind";
export const config: Configuration = {
  darkMode: "class",
  mode: "silent",
  // theme: {
  //   colors: {
  //     "blue": "#eff6ff",
  //     "green": "#14532d",
  //   }
  // },
};
if (IS_BROWSER) setup(config);
