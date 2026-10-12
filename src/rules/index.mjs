/** 规则注册表。每条规则：{ id, check(ctx) -> Finding[] }，Finding = { file, detail }。
 * Finding 空数组 = 通过。规则无状态、可独立测试。
 */
import aig01 from "./AIG01-explicit-label.mjs";
import aig02 from "./AIG02-clipboard-label.mjs";
import net01 from "./NET01-https-domain.mjs";
import reg01 from "./REG01-category-materials.mjs";
import base01 from "./BASE01-sdk-version.mjs";

export const RULES = [aig01, aig02, net01, reg01, base01];
