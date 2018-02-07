import { defaults, isEqual } from "lodash";
import shallowEqual = require("fbjs/lib/shallowEqual");

export interface WhyAreYouDifferentOpts {
  maxDepth: number;
  treatAsReactProps: boolean;
  ignorePropsNamed: ReadonlySet<string>;
}

function logWhy(name: string, message: string, ...args: any[]) {
  // tslint:disable-next-line:no-console
  console.log(
    `%c${name}%c: ${message}`,
    "font-weight: bold",
    "font-weight: normal",
    ...args
  );
}

export function whyAreYouDifferent<T>(
  name: string,
  curProps: T | T[],
  nextProps: T | T[],
  optsTmp: Partial<WhyAreYouDifferentOpts> = {},
  depth: number = 0
) {
  const opts: WhyAreYouDifferentOpts = defaults({}, optsTmp, {
    maxDepth: 6,
    treatAsReactProps: true,
    ignorePropsNamed: new Set(["_owner"])
  });

  const isShallowEqual = shallowEqual(nextProps, curProps);

  if (depth === 0) {
    if (curProps === nextProps) {
      return logWhy(name, "🍾 ref equals");
    }

    if (opts.treatAsReactProps && isShallowEqual) {
      return logWhy(name, "🍾 shallow equals (but not ref equals)");
    }

    console.groupCollapsed(name);
  }
  const theEnd = (msg?: string) => {
    if (msg) {
      logWhy(name, msg);
    }
    if (depth === 0) {
      console.groupEnd();
    }
  };

  if (curProps === nextProps) {
    return theEnd(`👍 ref equals`);
  }

  if (curProps == nextProps) {
    return theEnd(`👍 loose equals`);
  }

  if (isShallowEqual) {
    return theEnd(`🤷‍ shallow equals, but not ref equals`);
  }

  const isDeepEqual = isEqual(nextProps, curProps);

  if (depth === 0) {
    logWhy(name, "🤷‍ entire tree is deep equal");
  }

  if (curProps == undefined) {
    return theEnd(`cur === undefined`);
  }

  if (nextProps == undefined) {
    return theEnd(`next === undefined`);
  }

  if (depth === opts.maxDepth) {
    return theEnd(`⚡️ Aborting due to depth`);
  }

  if (Array.isArray(nextProps) && Array.isArray(curProps)) {
    if (!isDeepEqual) {
      for (const idx in nextProps) {
        const nextProp = nextProps[idx];
        const curProp = curProps[idx];
        if (nextProp !== curProp) {
          whyAreYouDifferent(
            `${name}[${idx}]`,
            nextProp,
            curProp,
            opts,
            depth + 1
          );
        }
      }
    } else {
      logWhy(name, "🚀 skipping deep equal array");
    }
  } else if (!Array.isArray(nextProps) && !Array.isArray(curProps)) {
    for (const key of Object.keys(nextProps) as (keyof T)[]) {
      if (opts.ignorePropsNamed.has(key)) {
        logWhy(`${name}.${key}`, "Skipping due to `ignorePropsNamed`.");
      } else {
        const nextProp = nextProps[key];
        const curProp = curProps[key];
        if (nextProp !== curProp) {
          whyAreYouDifferent(
            `${name}.${key}`,
            nextProp,
            curProp,
            opts,
            depth + 1
          );
        }
      }
    }
  }
  return theEnd();
}
