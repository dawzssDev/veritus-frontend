import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  MatTooltipModule
} from "./chunk-3HW6YH4E.js";
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY,
  MAT_TOOLTIP_SCROLL_STRATEGY,
  MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY,
  MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER,
  MatTooltip,
  SCROLL_THROTTLE_MS,
  TOOLTIP_PANEL_CLASS,
  TooltipComponent,
  getMatTooltipInvalidPositionError
} from "./chunk-UIG55XFI.js";
import "./chunk-CZ26DZQM.js";
import "./chunk-ENS4BP6D.js";
import "./chunk-5J64DKEU.js";
import "./chunk-5XYFHA5V.js";
import "./chunk-WMCF36ZG.js";
import "./chunk-WXMSZRL6.js";
import "./chunk-E33IUIG6.js";
import "./chunk-EIHTYSMT.js";
import "./chunk-AW5BJYQ4.js";
import "./chunk-4NRDWZRV.js";
import "./chunk-4GVG5X4N.js";
import "./chunk-BN4I422C.js";
import "./chunk-2JCKFGSA.js";
import "./chunk-UJQIVWSY.js";
import "./chunk-47WBPA2L.js";
import "./chunk-XTNIOMTS.js";
import "./chunk-UBWSCTSF.js";
import "./chunk-ZMYHUZBX.js";
import {
  require_operators
} from "./chunk-KTQEUXG5.js";
import {
  require_cjs
} from "./chunk-5J6XMCTS.js";
import "./chunk-S6HF3TWB.js";
import {
  __toESM
} from "./chunk-UUWW2VJQ.js";

// node_modules/@angular/material/fesm2022/tooltip.mjs
var import_operators = __toESM(require_operators(), 1);
var import_rxjs = __toESM(require_cjs(), 1);
var matTooltipAnimations = {
  // Represents:
  // trigger('state', [
  //   state('initial, void, hidden', style({opacity: 0, transform: 'scale(0.8)'})),
  //   state('visible', style({transform: 'scale(1)'})),
  //   transition('* => visible', animate('150ms cubic-bezier(0, 0, 0.2, 1)')),
  //   transition('* => hidden', animate('75ms cubic-bezier(0.4, 0, 1, 1)')),
  // ])
  /** Animation that transitions a tooltip in and out. */
  tooltipState: {
    type: 7,
    name: "state",
    definitions: [
      {
        type: 0,
        name: "initial, void, hidden",
        styles: { type: 6, styles: { opacity: 0, transform: "scale(0.8)" }, offset: null }
      },
      {
        type: 0,
        name: "visible",
        styles: { type: 6, styles: { transform: "scale(1)" }, offset: null }
      },
      {
        type: 1,
        expr: "* => visible",
        animation: { type: 4, styles: null, timings: "150ms cubic-bezier(0, 0, 0.2, 1)" },
        options: null
      },
      {
        type: 1,
        expr: "* => hidden",
        animation: { type: 4, styles: null, timings: "75ms cubic-bezier(0.4, 0, 1, 1)" },
        options: null
      }
    ],
    options: {}
  }
};
export {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY,
  MAT_TOOLTIP_SCROLL_STRATEGY,
  MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY,
  MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER,
  MatTooltip,
  MatTooltipModule,
  SCROLL_THROTTLE_MS,
  TOOLTIP_PANEL_CLASS,
  TooltipComponent,
  getMatTooltipInvalidPositionError,
  matTooltipAnimations
};
//# sourceMappingURL=@angular_material_tooltip.js.map
