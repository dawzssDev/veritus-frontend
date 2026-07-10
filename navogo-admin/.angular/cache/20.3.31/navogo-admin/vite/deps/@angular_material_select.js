import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-H4L6G2AH.js";
import "./chunk-BYOMZJS5.js";
import "./chunk-GKXKNIN7.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-4XDK2GWP.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-LOQAG7C5.js";
import "./chunk-IRZVYCSQ.js";
import "./chunk-VC6JO3HQ.js";
import "./chunk-BEPQL56U.js";
import "./chunk-NF5VUOPZ.js";
import "./chunk-SKZAYMXQ.js";
import "./chunk-LUSPYEBX.js";
import "./chunk-QSQNQKVL.js";
import "./chunk-HSDYA55W.js";
import "./chunk-HHRPW6LT.js";
import "./chunk-VENV3F3G.js";
import "./chunk-GWFLKVBH.js";
import "./chunk-HUU6TVAI.js";
import "./chunk-PWMJQREM.js";
import "./chunk-5EG33CFQ.js";
import "./chunk-7LDDXG5R.js";
import "./chunk-XJIYCFKV.js";
import "./chunk-EMXGA3VC.js";
import "./chunk-XD7SM64A.js";
import "./chunk-3IZSHG32.js";
import "./chunk-T2NETMJF.js";
import "./chunk-GQZDULI5.js";
import "./chunk-IYEWMFKI.js";
import "./chunk-6ZB2BPTH.js";
import "./chunk-P7SIV3KW.js";
import "./chunk-HWYXSU2G.js";
import "./chunk-JRFR6BLO.js";
import "./chunk-MARUHEWW.js";
import "./chunk-I6DCS273.js";

// node_modules/@angular/material/fesm2022/select.mjs
var matSelectAnimations = {
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [
      {
        type: 0,
        name: "void",
        styles: {
          type: 6,
          styles: { opacity: 0, transform: "scale(1, 0.8)" },
          offset: null
        }
      },
      {
        type: 1,
        expr: "void => showing",
        animation: {
          type: 4,
          styles: {
            type: 6,
            styles: { opacity: 1, transform: "scale(1, 1)" },
            offset: null
          },
          timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
        },
        options: null
      },
      {
        type: 1,
        expr: "* => void",
        animation: {
          type: 4,
          styles: { type: 6, styles: { opacity: 0 }, offset: null },
          timings: "100ms linear"
        },
        options: null
      }
    ],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
