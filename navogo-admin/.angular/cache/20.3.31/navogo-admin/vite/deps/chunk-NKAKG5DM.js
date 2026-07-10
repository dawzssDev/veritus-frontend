import {
  MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER,
  MatTooltip,
  TooltipComponent
} from "./chunk-PRREGPT4.js";
import {
  OverlayModule
} from "./chunk-HSDYA55W.js";
import {
  CdkScrollableModule
} from "./chunk-HUU6TVAI.js";
import {
  A11yModule,
  MatCommonModule
} from "./chunk-XJIYCFKV.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineNgModule
} from "./chunk-6ZB2BPTH.js";
import {
  ɵɵdefineInjector
} from "./chunk-P7SIV3KW.js";

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
//# sourceMappingURL=chunk-NKAKG5DM.js.map
