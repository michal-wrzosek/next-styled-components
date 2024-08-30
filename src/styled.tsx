/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HTMLProps, PropsWithChildren } from 'react';
import { ClientStyleTag } from './client-style-tag';
import { TagToHTMLElement } from './types';
import React from 'react';
import { CollectedStyles } from './collected-styles';

export interface DefaultTheme {
  [key: string]: unknown;
}

type HTMLExtended<Props extends object, ElementType extends Element | undefined> = ElementType extends undefined
  ? Props
  : Props & HTMLProps<ElementType>;

type Keyframe = { getName: () => string };

type InterpolationFunction<
  Props extends object,
  ElementType extends Element | undefined,
> = ElementType extends undefined ? (props: Props) => any : (props: HTMLExtended<Props, ElementType>) => any;

interface StyledComponent<Props extends object, ElementType extends Element | undefined> {
  (props: HTMLExtended<Props, ElementType>): JSX.Element;
  _baseClassName: string;
}

function processTemplate<Props extends object, ElementType extends Element>(
  template: TemplateStringsArray,
  templateElements: (InterpolationFunction<Props, ElementType> | Function | Keyframe | string)[],
): {
  cssLines: (string | ((props: Props) => string))[][];
} {
  const templateLines: (string | ((props: Props) => string))[][] = [];

  for (let i = 0; i < template.length; i++) {
    const templatePart = template[i];
    const templateElement = templateElements[i];

    const templatePartLines = templatePart.split('\n');

    const previousLastLineIndex = Math.max(0, templateLines.length - 1);

    for (let templateLineIndex = 0; templateLineIndex < templatePartLines.length; templateLineIndex++) {
      const templatePartLine = templatePartLines[templateLineIndex];

      if (!templateLines[previousLastLineIndex + templateLineIndex]) {
        templateLines[previousLastLineIndex + templateLineIndex] = [];
      }

      templateLines[previousLastLineIndex + templateLineIndex].push(templatePartLine);
    }

    const currentLineIndex = templateLines.length - 1;

    if (typeof templateElement === 'string') {
      templateLines[currentLineIndex].push(templateElement);
    } else if (
      typeof templateElement === 'function' &&
      '_baseClassName' in templateElement &&
      typeof templateElement._baseClassName === 'string'
    ) {
      templateLines[currentLineIndex].push(`.${templateElement._baseClassName}`);
    } else if (typeof templateElement === 'function') {
      templateLines[currentLineIndex].push(templateElement as (props: Props) => string);
    } else if (
      typeof templateElement === 'object' &&
      'getName' in templateElement &&
      typeof templateElement.getName === 'function'
    ) {
      templateLines[currentLineIndex].push(templateElement.getName());
    }
  }

  return { cssLines: templateLines };
}

function processDynamicCssLines<Props extends object>(
  dynamicCssLines: (string | ((props: { theme: DefaultTheme } & Props) => string))[][],
  props: { theme: DefaultTheme } & Props,
): string {
  return dynamicCssLines
    .map((dynamicCssLine) =>
      dynamicCssLine
        .map((linePart) => {
          const provideProps = (input: typeof linePart): string =>
            typeof input === 'function' ? provideProps(input(props)) : input;

          return provideProps(linePart);
        })
        .join('')
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(' '),
    )
    .join('\n');
}

export function css<StyledProps extends object = {}>(
  template: TemplateStringsArray,
  ...templateElements: (InterpolationFunction<{ theme: DefaultTheme } & StyledProps, undefined> | Function | string)[]
): InterpolationFunction<StyledProps, undefined> {
  const { cssLines } = processTemplate(template, templateElements);

  const interpolationFunction = (props: HTMLExtended<StyledProps, undefined>) => {
    const dynamicStyles = processDynamicCssLines(cssLines, {
      ...props,
      theme: CollectedStyles.theme,
    });

    return dynamicStyles.split('/n').join(' ');
  };

  return interpolationFunction;
}

export function styled<Props extends object = {}>(ComponentToStyle: (props: Props) => JSX.Element) {
  return function <StyledProps extends object = {}>(
    template: TemplateStringsArray,
    ...templateElements: (
      | InterpolationFunction<{ theme: DefaultTheme } & Props & StyledProps, undefined>
      | Function
      | string
    )[]
  ): StyledComponent<Props & StyledProps, undefined> {
    const { cssLines } = processTemplate(template, templateElements);

    const baseClassName = CollectedStyles.getClassName();

    const component = (props: HTMLExtended<Props & StyledProps, undefined>) => {
      const dynamicStyles = processDynamicCssLines(cssLines, {
        ...props,
        theme: CollectedStyles.theme,
      });
      CollectedStyles.setStyles(baseClassName, dynamicStyles);

      // Filtering out style props starting with $
      const componentProps = Object.entries(props).reduce<typeof props>(
        (acc, [key, value]) => {
          return key.startsWith('$') ? acc : { ...acc, [key]: value };
        },
        {} as typeof props,
      );

      const otherClassName = 'className' in props && typeof props.className === 'string' ? props.className : undefined;

      return (
        <ComponentToStyle
          {...componentProps}
          className={[otherClassName, baseClassName].filter((className) => Boolean(className)).join(' ')}
        />
      );
    };

    component._baseClassName = baseClassName;

    return component;
  };
}

function getStyledForHTMLTag<
  Tag extends keyof JSX.IntrinsicElements,
  ElementType extends Element = TagToHTMLElement[Tag],
>(tag: Tag) {
  const attrsPropsArray: (object | ((props: object) => object))[] = [];

  function getStyledForHTMLTagWithAttrs<OuterStyledProps extends object = {}>() {
    function styledForHTMLTag<StyledProps extends object = {}>(
      template: TemplateStringsArray,
      ...templateElements: (
        | InterpolationFunction<{ theme: DefaultTheme } & OuterStyledProps & StyledProps, ElementType>
        | Function
        | Keyframe
        | string
      )[]
    ): StyledComponent<OuterStyledProps & StyledProps, ElementType> {
      const { cssLines } = processTemplate(template, templateElements);

      const baseClassName = CollectedStyles.getClassName();

      const component = (props: HTMLExtended<OuterStyledProps & StyledProps, ElementType>) => {
        const propsWithAttrs = attrsPropsArray.reduce<typeof props>((propsWithAttrs, attrsProps) => {
          return typeof attrsProps === 'function'
            ? { ...propsWithAttrs, ...attrsProps(propsWithAttrs) }
            : { ...propsWithAttrs, ...attrsProps };
        }, props);

        const dynamicStyles = processDynamicCssLines(cssLines, {
          ...propsWithAttrs,
          theme: CollectedStyles.theme,
        });

        CollectedStyles.setStyles(baseClassName, dynamicStyles);

        // Filtering out style props starting with $
        const componentProps = Object.entries(propsWithAttrs).reduce<typeof propsWithAttrs>(
          (acc, [key, value]) => {
            return key.startsWith('$') ? acc : { ...acc, [key]: value };
          },
          {} as typeof propsWithAttrs,
        );

        return React.createElement(tag, {
          ...componentProps,
          className: [props.className, baseClassName].filter((className) => Boolean(className)).join(' '),
        });
      };

      component._baseClassName = baseClassName;

      return component;
    }

    styledForHTMLTag.attrs = function attrs<StyledProps extends object = {}>(
      attrsProps:
        | Partial<HTMLExtended<{}, ElementType>>
        | ((
            props: HTMLExtended<OuterStyledProps & StyledProps, ElementType>,
          ) => Partial<HTMLExtended<{}, ElementType>>),
    ) {
      if (typeof attrsProps === 'object') {
        attrsPropsArray.push(attrsProps);
      } else {
        attrsPropsArray.push(attrsProps);
      }

      return getStyledForHTMLTagWithAttrs<OuterStyledProps & StyledProps>();
    };

    return styledForHTMLTag;
  }

  return getStyledForHTMLTagWithAttrs();
}

styled.a = getStyledForHTMLTag('a');
styled.abbr = getStyledForHTMLTag('abbr');
styled.address = getStyledForHTMLTag('address');
styled.area = getStyledForHTMLTag('area');
styled.article = getStyledForHTMLTag('article');
styled.aside = getStyledForHTMLTag('aside');
styled.audio = getStyledForHTMLTag('audio');
styled.b = getStyledForHTMLTag('b');
styled.base = getStyledForHTMLTag('base');
styled.bdi = getStyledForHTMLTag('bdi');
styled.bdo = getStyledForHTMLTag('bdo');
styled.big = getStyledForHTMLTag('big');
styled.blockquote = getStyledForHTMLTag('blockquote');
styled.body = getStyledForHTMLTag('body');
styled.br = getStyledForHTMLTag('br');
styled.button = getStyledForHTMLTag('button');
styled.canvas = getStyledForHTMLTag('canvas');
styled.caption = getStyledForHTMLTag('caption');
styled.center = getStyledForHTMLTag('center');
styled.cite = getStyledForHTMLTag('cite');
styled.code = getStyledForHTMLTag('code');
styled.col = getStyledForHTMLTag('col');
styled.colgroup = getStyledForHTMLTag('colgroup');
styled.data = getStyledForHTMLTag('data');
styled.datalist = getStyledForHTMLTag('datalist');
styled.dd = getStyledForHTMLTag('dd');
styled.del = getStyledForHTMLTag('del');
styled.details = getStyledForHTMLTag('details');
styled.dfn = getStyledForHTMLTag('dfn');
styled.dialog = getStyledForHTMLTag('dialog');
styled.div = getStyledForHTMLTag('div');
styled.dl = getStyledForHTMLTag('dl');
styled.dt = getStyledForHTMLTag('dt');
styled.em = getStyledForHTMLTag('em');
styled.embed = getStyledForHTMLTag('embed');
styled.fieldset = getStyledForHTMLTag('fieldset');
styled.figcaption = getStyledForHTMLTag('figcaption');
styled.figure = getStyledForHTMLTag('figure');
styled.footer = getStyledForHTMLTag('footer');
styled.form = getStyledForHTMLTag('form');
styled.h1 = getStyledForHTMLTag('h1');
styled.h2 = getStyledForHTMLTag('h2');
styled.h3 = getStyledForHTMLTag('h3');
styled.h4 = getStyledForHTMLTag('h4');
styled.h5 = getStyledForHTMLTag('h5');
styled.h6 = getStyledForHTMLTag('h6');
styled.head = getStyledForHTMLTag('head');
styled.header = getStyledForHTMLTag('header');
styled.hgroup = getStyledForHTMLTag('hgroup');
styled.hr = getStyledForHTMLTag('hr');
styled.html = getStyledForHTMLTag('html');
styled.i = getStyledForHTMLTag('i');
styled.iframe = getStyledForHTMLTag('iframe');
styled.img = getStyledForHTMLTag('img');
styled.input = getStyledForHTMLTag('input');
styled.ins = getStyledForHTMLTag('ins');
styled.kbd = getStyledForHTMLTag('kbd');
styled.keygen = getStyledForHTMLTag('keygen');
styled.label = getStyledForHTMLTag('label');
styled.legend = getStyledForHTMLTag('legend');
styled.li = getStyledForHTMLTag('li');
styled.link = getStyledForHTMLTag('link');
styled.main = getStyledForHTMLTag('main');
styled.map = getStyledForHTMLTag('map');
styled.mark = getStyledForHTMLTag('mark');
styled.menu = getStyledForHTMLTag('menu');
styled.menuitem = getStyledForHTMLTag('menuitem');
styled.meta = getStyledForHTMLTag('meta');
styled.meter = getStyledForHTMLTag('meter');
styled.nav = getStyledForHTMLTag('nav');
styled.noindex = getStyledForHTMLTag('noindex');
styled.noscript = getStyledForHTMLTag('noscript');
styled.object = getStyledForHTMLTag('object');
styled.ol = getStyledForHTMLTag('ol');
styled.optgroup = getStyledForHTMLTag('optgroup');
styled.option = getStyledForHTMLTag('option');
styled.output = getStyledForHTMLTag('output');
styled.p = getStyledForHTMLTag('p');
styled.param = getStyledForHTMLTag('param');
styled.picture = getStyledForHTMLTag('picture');
styled.pre = getStyledForHTMLTag('pre');
styled.progress = getStyledForHTMLTag('progress');
styled.q = getStyledForHTMLTag('q');
styled.rp = getStyledForHTMLTag('rp');
styled.rt = getStyledForHTMLTag('rt');
styled.ruby = getStyledForHTMLTag('ruby');
styled.s = getStyledForHTMLTag('s');
styled.samp = getStyledForHTMLTag('samp');
styled.search = getStyledForHTMLTag('search');
styled.slot = getStyledForHTMLTag('slot');
styled.script = getStyledForHTMLTag('script');
styled.section = getStyledForHTMLTag('section');
styled.select = getStyledForHTMLTag('select');
styled.small = getStyledForHTMLTag('small');
styled.source = getStyledForHTMLTag('source');
styled.span = getStyledForHTMLTag('span');
styled.strong = getStyledForHTMLTag('strong');
styled.style = getStyledForHTMLTag('style');
styled.sub = getStyledForHTMLTag('sub');
styled.summary = getStyledForHTMLTag('summary');
styled.sup = getStyledForHTMLTag('sup');
styled.table = getStyledForHTMLTag('table');
styled.template = getStyledForHTMLTag('template');
styled.tbody = getStyledForHTMLTag('tbody');
styled.td = getStyledForHTMLTag('td');
styled.textarea = getStyledForHTMLTag('textarea');
styled.tfoot = getStyledForHTMLTag('tfoot');
styled.th = getStyledForHTMLTag('th');
styled.thead = getStyledForHTMLTag('thead');
styled.time = getStyledForHTMLTag('time');
styled.title = getStyledForHTMLTag('title');
styled.tr = getStyledForHTMLTag('tr');
styled.track = getStyledForHTMLTag('track');
styled.u = getStyledForHTMLTag('u');
styled.ul = getStyledForHTMLTag('ul');
styled.var = getStyledForHTMLTag('var');
styled.video = getStyledForHTMLTag('video');
styled.wbr = getStyledForHTMLTag('wbr');
styled.webview = getStyledForHTMLTag('webview');
styled.svg = getStyledForHTMLTag('svg');
styled.animate = getStyledForHTMLTag('animate');
styled.animateMotion = getStyledForHTMLTag('animateMotion');
styled.animateTransform = getStyledForHTMLTag('animateTransform');
styled.circle = getStyledForHTMLTag('circle');
styled.clipPath = getStyledForHTMLTag('clipPath');
styled.defs = getStyledForHTMLTag('defs');
styled.desc = getStyledForHTMLTag('desc');
styled.ellipse = getStyledForHTMLTag('ellipse');
styled.feBlend = getStyledForHTMLTag('feBlend');
styled.feColorMatrix = getStyledForHTMLTag('feColorMatrix');
styled.feComponentTransfer = getStyledForHTMLTag('feComponentTransfer');
styled.feComposite = getStyledForHTMLTag('feComposite');
styled.feConvolveMatrix = getStyledForHTMLTag('feConvolveMatrix');
styled.feDiffuseLighting = getStyledForHTMLTag('feDiffuseLighting');
styled.feDisplacementMap = getStyledForHTMLTag('feDisplacementMap');
styled.feDistantLight = getStyledForHTMLTag('feDistantLight');
styled.feDropShadow = getStyledForHTMLTag('feDropShadow');
styled.feFlood = getStyledForHTMLTag('feFlood');
styled.feFuncA = getStyledForHTMLTag('feFuncA');
styled.feFuncB = getStyledForHTMLTag('feFuncB');
styled.feFuncG = getStyledForHTMLTag('feFuncG');
styled.feFuncR = getStyledForHTMLTag('feFuncR');
styled.feGaussianBlur = getStyledForHTMLTag('feGaussianBlur');
styled.feImage = getStyledForHTMLTag('feImage');
styled.feMerge = getStyledForHTMLTag('feMerge');
styled.feMergeNode = getStyledForHTMLTag('feMergeNode');
styled.feMorphology = getStyledForHTMLTag('feMorphology');
styled.feOffset = getStyledForHTMLTag('feOffset');
styled.fePointLight = getStyledForHTMLTag('fePointLight');
styled.feSpecularLighting = getStyledForHTMLTag('feSpecularLighting');
styled.feSpotLight = getStyledForHTMLTag('feSpotLight');
styled.feTile = getStyledForHTMLTag('feTile');
styled.feTurbulence = getStyledForHTMLTag('feTurbulence');
styled.filter = getStyledForHTMLTag('filter');
styled.foreignObject = getStyledForHTMLTag('foreignObject');
styled.g = getStyledForHTMLTag('g');
styled.image = getStyledForHTMLTag('image');
styled.line = getStyledForHTMLTag('line');
styled.linearGradient = getStyledForHTMLTag('linearGradient');
styled.marker = getStyledForHTMLTag('marker');
styled.mask = getStyledForHTMLTag('mask');
styled.metadata = getStyledForHTMLTag('metadata');
styled.mpath = getStyledForHTMLTag('mpath');
styled.path = getStyledForHTMLTag('path');
styled.pattern = getStyledForHTMLTag('pattern');
styled.polygon = getStyledForHTMLTag('polygon');
styled.polyline = getStyledForHTMLTag('polyline');
styled.radialGradient = getStyledForHTMLTag('radialGradient');
styled.rect = getStyledForHTMLTag('rect');
styled.set = getStyledForHTMLTag('set');
styled.stop = getStyledForHTMLTag('stop');
styled.switch = getStyledForHTMLTag('switch');
styled.symbol = getStyledForHTMLTag('symbol');
styled.text = getStyledForHTMLTag('text');
styled.textPath = getStyledForHTMLTag('textPath');
styled.tspan = getStyledForHTMLTag('tspan');
styled.use = getStyledForHTMLTag('use');
styled.view = getStyledForHTMLTag('view');

export function createGlobalStyle<StyledProps extends object = {}>(
  template: TemplateStringsArray,
  ...templateElements: (InterpolationFunction<{ theme: DefaultTheme } & StyledProps, undefined> | Function | string)[]
): (props: StyledProps) => JSX.Element {
  const { cssLines } = processTemplate(template, templateElements);

  const component = (props: StyledProps) => {
    const dynamicStyles = processDynamicCssLines(cssLines, {
      ...props,
      theme: CollectedStyles.theme,
    });
    CollectedStyles.setGlobalStyles(dynamicStyles);

    return <>{null}</>;
  };

  return component;
}

export function keyframes(
  template: TemplateStringsArray,
  ...templateElements: (InterpolationFunction<{ theme: DefaultTheme }, undefined> | string)[]
): { getName: () => string } {
  const { cssLines } = processTemplate(template, templateElements);

  const keyframeName = CollectedStyles.getKeyframeName();

  const x = processDynamicCssLines(cssLines, {
    theme: CollectedStyles.theme,
  });

  CollectedStyles.setKeyframe(keyframeName, x);

  return { getName: () => keyframeName };
}

function setTheme(theme: DefaultTheme) {
  CollectedStyles.setTheme(theme);
}

async function ServerStyleTag() {
  await new Promise((resolve) => setTimeout(resolve, 0));

  return <style data-id="styled-components-server" dangerouslySetInnerHTML={{ __html: CollectedStyles.getStyles() }} />;
}

export function StyleSheetManager({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <ServerStyleTag />
      <ClientStyleTag />
    </>
  );
}

export function ThemeProvider({ children, theme }: PropsWithChildren<{ theme: DefaultTheme }>) {
  setTheme(theme);

  return <>{children}</>;
}
