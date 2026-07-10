import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER,
  MatTooltip,
  TooltipComponent
} from "./chunk-UIG55XFI.js";
import {
  OverlayModule
} from "./chunk-CZ26DZQM.js";
import {
  A11yModule,
  MatCommonModule
} from "./chunk-E33IUIG6.js";
import {
  CdkScrollableModule
} from "./chunk-EIHTYSMT.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineNgModule
} from "./chunk-UBWSCTSF.js";
import {
  ɵɵdefineInjector
} from "./chunk-ZMYHUZBX.js";

// node_modules/@angular/material/fesm2022/tooltip-module.mjs
var MatTooltipModule = class _MatTooltipModule {
  static ɵfac = function MatTooltipModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatTooltipModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatTooltipModule,
    imports: [A11yModule, OverlayModule, MatCommonModule, MatTooltip, TooltipComponent],
    exports: [MatTooltip, TooltipComponent, MatCommonModule, CdkScrollableModule]
  });
  static ɵinj = ɵɵdefineInjector({
    providers: [MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER],
    imports: [A11yModule, OverlayModule, MatCommonModule, MatCommonModule, CdkScrollableModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTooltipModule, [{
    type: NgModule,
    args: [{
      imports: [A11yModule, OverlayModule, MatCommonModule, MatTooltip, TooltipComponent],
      exports: [MatTooltip, TooltipComponent, MatCommonModule, CdkScrollableModule],
      providers: [MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER]
    }]
  }], null, null);
})();

export {
  MatTooltipModule
};
//# sourceMappingURL=chunk-3HW6YH4E.js.map
